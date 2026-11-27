import { constants } from 'node:fs';
import { link, lstat, mkdir, mkdtemp, open, readdir, rename, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { canonical, hash, planLibraryMigration } from './plan-library-migration.mjs';

const digest = /^[a-f0-9]{64}$/u;
const revisionName = /^\d{12}\.json$/u;
const pointerName = (revision) => String(revision).padStart(12, '0') + '.json';

function failure(code) {
  return Object.assign(new Error(code), { code });
}

async function directory(path) {
  await mkdir(path, { mode: 0o700 }).catch((error) => {
    if (error.code !== 'EEXIST') throw error;
  });
  if (!(await lstat(path)).isDirectory()) throw failure('UNSAFE_DIRECTORY');
}

async function syncDirectory(path) {
  const handle = await open(path, constants.O_RDONLY | constants.O_DIRECTORY | constants.O_NOFOLLOW);
  try {
    await handle.sync();
  } finally {
    await handle.close();
  }
}

async function read(path) {
  const handle = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
  try {
    const stat = await handle.stat();
    if (!stat.isFile() || stat.size > 2 * 1024 * 1024) throw failure('INVALID_RECORD');
    return JSON.parse(await handle.readFile('utf8'));
  } finally {
    await handle.close();
  }
}

async function write(path, data) {
  const handle = await open(path, 'wx', 0o600);
  try {
    await handle.writeFile(canonical(data) + '\n');
    await handle.sync();
  } finally {
    await handle.close();
  }
}

function validateManifest(manifest, id) {
  const { snapshotId, parentSnapshotId, files, schemaVersion, ...metadata } = manifest ?? {};
  if (schemaVersion !== 1 || snapshotId !== id ||
      (parentSnapshotId !== null && !(typeof parentSnapshotId === 'string' && digest.test(parentSnapshotId))) ||
      !Array.isArray(files) || files.length > 10000 ||
      hash(canonical({ parentSnapshotId, files, schemaVersion, ...metadata })) !== id) {
    throw failure('INVALID_MANIFEST');
  }
  const seen = new Set();
  for (const file of files) {
    const { sha256, path, derivedPath, legacyPath, bytes } = file;
    if (typeof sha256 !== 'string' || !digest.test(sha256) || seen.has(sha256) ||
        !Number.isSafeInteger(bytes) || bytes < 1 ||
        !['.jpg', '.png', '.svg', '.webp'].some((ext) => path === `library/assets/pending-review/${sha256}${ext}`) ||
        derivedPath !== `binary/${sha256}.json` || legacyPath !== `library/entities/${sha256}`) {
      throw failure('INVALID_MANIFEST_ENTRY');
    }
    seen.add(sha256);
  }
}

export async function openSnapshotStore(root) {
  await directory(root);
  const snapshots = join(root, 'snapshots');
  const pointers = join(root, 'pointers');
  await directory(snapshots);
  await directory(pointers);

  async function load(id) {
    if (typeof id !== 'string' || !digest.test(id)) throw failure('INVALID_SNAPSHOT_ID');
    const path = join(snapshots, id);
    for (const dir of [path, join(path, 'binary')]) {
      if (!(await lstat(dir)).isDirectory()) throw failure('UNSAFE_DIRECTORY');
    }
    const manifest = await read(join(path, 'manifest.json'));
    validateManifest(manifest, id);
    for (const entry of manifest.files) {
      if (canonical(await read(join(path, entry.derivedPath))) !== canonical(entry)) {
        throw failure('SNAPSHOT_RECORD_MISMATCH');
      }
    }
    return manifest;
  }

  async function current() {
    const names = (await readdir(pointers)).filter((name) => revisionName.test(name)).sort();
    if (!names.length) return { revision: 0, snapshotId: null, previousSnapshotId: null };
    for (const [index, name] of names.entries()) {
      if (name !== pointerName(index + 1)) throw failure('INVALID_POINTER_HISTORY');
    }
    const value = await read(join(pointers, names.at(-1)));
    if (value?.revision !== names.length ||
        ![value.snapshotId, value.previousSnapshotId].every((id) =>
          id === null || (typeof id === 'string' && digest.test(id)))) {
      throw failure('INVALID_POINTER');
    }
    return value;
  }

  async function stage(checkout) {
    const parent = await current();
    const plan = await planLibraryMigration(checkout);
    if (plan.status === 'blocked') return plan;
    const { snapshotId: plannedId, ...source } = plan.manifest;
    const body = { ...source, parentSnapshotId: parent.snapshotId };
    const snapshotId = hash(canonical(body));
    const manifest = { ...body, snapshotId };
    validateManifest(manifest, snapshotId);

    const temp = await mkdtemp(join(snapshots, '.stage-'));
    const binary = join(temp, 'binary');
    try {
      await mkdir(binary, { mode: 0o700 });
      for (const entry of manifest.files) await write(join(temp, entry.derivedPath), entry);
      await write(join(temp, 'manifest.json'), manifest);
      await syncDirectory(binary);
      await syncDirectory(temp);
      try {
        await rename(temp, join(snapshots, snapshotId));
      } catch (error) {
        if (!['EEXIST', 'ENOTEMPTY'].includes(error.code)) throw error;
      }
      await syncDirectory(snapshots);
      await load(snapshotId);
      return { status: 'staged', snapshotId, expectedRevision: parent.revision, pending: plan.pending };
    } finally {
      await rm(temp, { recursive: true, force: true });
    }
  }

  async function update({ expectedRevision, snapshotId, reviewRef }, rollback) {
    if (typeof reviewRef !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9_./:-]{0,159}$/u.test(reviewRef)) {
      throw failure('REVIEW_REFERENCE_REQUIRED');
    }
    const previous = await current();
    if (previous.revision !== expectedRevision) throw failure('STALE_POINTER');
    if (rollback) {
      if (previous.snapshotId === null) throw failure('ROLLBACK_UNAVAILABLE');
      snapshotId = previous.previousSnapshotId;
      if (snapshotId !== null) await load(snapshotId);
    } else {
      const manifest = await load(snapshotId);
      if (manifest.parentSnapshotId !== previous.snapshotId) throw failure('PARENT_MISMATCH');
    }
    const pointer = {
      revision: previous.revision + 1, snapshotId, previousSnapshotId: previous.snapshotId,
      reviewRef, operation: rollback ? 'rollback' : 'promote',
    };
    const temp = await mkdtemp(join(pointers, '.pending-'));
    try {
      const record = join(temp, 'pointer.json');
      await write(record, pointer);
      try {
        await link(record, join(pointers, pointerName(pointer.revision)));
      } catch (error) {
        if (error.code === 'EEXIST') throw failure('STALE_POINTER');
        throw error;
      }
      await syncDirectory(pointers);
      return pointer;
    } finally {
      await rm(temp, { recursive: true, force: true });
    }
  }

  return {
    current, load, stage,
    promote: (options) => update(options, false),
    rollback: (options) => update(options, true),
  };
}
