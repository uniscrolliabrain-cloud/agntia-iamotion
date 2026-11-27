import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { auditBaseline } from '../../lab/scripts/audit-baseline.mjs';
import { openSnapshotStore } from '../../lab/scripts/library-snapshot-store.mjs';
import { planLibraryMigration } from '../../lab/scripts/plan-library-migration.mjs';

const hash = (contents) => createHash('sha256').update(contents).digest('hex');
const png = Buffer.from('89504e470d0a1a0a', 'hex');

async function fixture(t, { bytes = png, extension = '.png', extraSources = [], orphan = false } = {}) {
  const root = await mkdtemp(join(tmpdir(), 'iamotion-audit-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const put = async (path, contents) => {
    const file = join(root, path);
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, contents);
  };
  const id = hash(bytes);
  const path = `library/assets/pending-review/${id}${extension}`;
  await put(path, bytes);
  const ids = orphan ? ['orphan'] : [];
  const asset = { id, extension, bytes: bytes.length, cardIds: ids, paths: ['images/icon.png'],
    refs: ['main'], status: 'pending-review' };
  const inputs = {
    'library/catalog/assets.json': [asset],
    'library/catalog/semantic.json': [],
    'library/taxonomy/lexicon.v1.json': { terms: [] },
  };
  for (const [file, data] of Object.entries(inputs)) await put(file, JSON.stringify(data));
  for (const ref of ['main', 'ui-lab', 'ui-lab-pro']) {
    const commit = '1'.repeat(40);
    const source = { repository: 'example/source', ref, commit, path: 'images/icon.png' };
    const sources = ref === 'main' ? [source, ...extraSources.map((path) => ({ ...source, path }))] : [];
    const assets = sources.length ? [{ ...asset, sha256: id, sources }] : [];
    await put(`library/inventory/${ref}.json`, JSON.stringify({
      ref, commit, assets, trackedImages: sources.length, uniqueAssets: assets.length,
    }));
  }
  await put(`library/entities/${id}/evidence.json`, '{"claims":[]}');
  await put('lab/observability/entity-build.json', JSON.stringify({
    entities: 1, classified: 0, claims: 0,
    inputHashes: Object.fromEntries(Object.entries(inputs).map(([key, value]) => [
      key, hash(JSON.stringify(value)),
    ])),
  }));
  return { root, put, path };
}

test('valid inventory is read-only and produces identical reports', async (t) => {
  const { root } = await fixture(t);
  const report = await auditBaseline(root);
  assert.equal(report.counts.errors, 0);
  assert.equal(report.counts.verified, 1);
  assert.deepEqual(await auditBaseline(root), report);
});

test('reports corrupted, missing, linked incorrectly and LFS-managed binaries', async (t) => {
  const { root, put, path } = await fixture(t, { orphan: true });
  const codes = async () => (await auditBaseline(root)).findings.map((finding) => finding.code);
  await put(path, 'version https://git-lfs.github.com/spec/v1\n');
  for (const code of ['HASH_MISMATCH', 'LFS_POINTER', 'MIME_MISMATCH', 'BROKEN_CARD_LINK']) {
    assert.ok((await codes()).includes(code), code);
  }
  await rm(join(root, path));
  assert.ok((await codes()).includes('MISSING_BINARY'));
  await symlink('/dev/null', join(root, path));
  assert.ok((await codes()).includes('UNSAFE_PATH'));
});

test('flags active SVG and checks provenance collisions and traversal', async (t) => {
  const { root } = await fixture(t, {
    bytes: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script/></svg>'),
    extension: '.svg',
    extraSources: ['images/Icon.png', '../icon.png'],
  });
  const codes = (await auditBaseline(root)).findings.map((finding) => finding.code);
  for (const code of ['UNSAFE_SVG', 'AMBIGUOUS_SOURCE_PATH', 'INVALID_SOURCE']) {
    assert.ok(codes.includes(code), code);
  }
});

test('migration dry-run is reproducible and refuses a corrupted checkout', async (t) => {
  const { root, put, path } = await fixture(t);
  const plan = await planLibraryMigration(root);
  assert.equal(plan.status, 'dry-run');
  assert.equal(plan.manifest.files[0].path, path);
  assert.match(plan.manifest.snapshotId, /^[a-f0-9]{64}$/u);
  assert.deepEqual(await planLibraryMigration(root), plan);

  await put(path, 'corrupt');
  const blocked = await planLibraryMigration(root);
  assert.equal(blocked.status, 'blocked');
  assert.equal(blocked.reason, 'AUDIT_FAILED');
  assert.equal(blocked.manifest, undefined);
});

test('snapshot stage is idempotent and rollback preserves records and legacy', async (t) => {
  const { root, path } = await fixture(t);
  const store = await openSnapshotStore(join(root, 'store'));
  const [first, retry] = await Promise.all([store.stage(root), store.stage(root)]);
  assert.deepEqual(first, retry);
  assert.equal((await store.load(first.snapshotId)).files[0].path, path);
  assert.equal((await store.current()).snapshotId, null);

  await assert.rejects(store.promote(first), { code: 'REVIEW_REFERENCE_REQUIRED' });
  await store.promote({ ...first, reviewRef: 'test/review-1' });
  const second = await store.stage(root);
  assert.notEqual(second.snapshotId, first.snapshotId);
  await store.promote({ ...second, reviewRef: 'test/review-2' });
  const rolledBack = await store.rollback({ expectedRevision: 2, reviewRef: 'test/rollback' });
  assert.equal(rolledBack.snapshotId, first.snapshotId);
  assert.equal((await store.load(second.snapshotId)).parentSnapshotId, first.snapshotId);
  assert.equal((await auditBaseline(root)).counts.errors, 0);
});

test('only one competing writer can advance the same pointer revision', async (t) => {
  const { root } = await fixture(t);
  const path = join(root, 'store');
  const first = await openSnapshotStore(path);
  const second = await openSnapshotStore(path);
  const stage = await first.stage(root);
  const results = await Promise.allSettled([
    first.promote({ ...stage, reviewRef: 'test/first-writer' }),
    second.promote({ ...stage, reviewRef: 'test/second-writer' }),
  ]);
  assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1);
  assert.equal(results.find((result) => result.status === 'rejected').reason.code, 'STALE_POINTER');
  assert.equal((await second.current()).revision, 1);
  const rollback = await second.rollback({ expectedRevision: 1, reviewRef: 'test/rollback' });
  assert.equal(rollback.snapshotId, null);
  await assert.rejects(
    first.promote({ ...stage, reviewRef: 'test/stale-after-rollback' }), { code: 'STALE_POINTER' },
  );
});

test('ignores interrupted writes and refuses a corrupt staged snapshot', async (t) => {
  const { root, put, path } = await fixture(t);
  await put('store/pointers/.pending-interrupted/pointer.json', '{"revision":');
  await put('store/snapshots/.stage-interrupted/manifest.json', '{"snapshotId":');
  const store = await openSnapshotStore(join(root, 'store'));
  assert.equal((await store.current()).revision, 0);
  const first = await store.stage(root);
  const manifest = await store.load(first.snapshotId);
  await put(`store/snapshots/${first.snapshotId}/${manifest.files[0].derivedPath}`, '{}');
  await assert.rejects(store.promote({ ...first, reviewRef: 'test/corrupt' }), {
    code: 'SNAPSHOT_RECORD_MISMATCH',
  });
  assert.equal((await store.current()).revision, 0);
  await put(path, 'corrupt');
  assert.equal((await store.stage(root)).status, 'blocked');
});
