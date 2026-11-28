import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readVisualAsset, visualManifestId } from '../../dist/index.js';

const approved = 'a'.repeat(64);
const pending = 'b'.repeat(64);
const manifest = { schemaVersion: 1, tenantId: 'fixture', revision: 1, assets: [
  { binaryId: pending, mime: 'image/png', bytes: 33, rights: 'pending' },
  { binaryId: approved, mime: 'image/webp', bytes: 55, rights: 'approved' },
] };
const id = await visualManifestId(manifest);
const context = { tenantId: 'fixture', actorId: 'fixture-reader', correlationId: 'fixture-run' };
const authority = { async authorize(ctx, capability) {
  return ctx.tenantId === 'fixture' && capability === 'motion.assets.read';
} };
const request = { snapshotId: id, binaryId: approved };

test('requires host authority before reading storage and projects approved asset metadata', async () => {
  let reads = 0;
  const reader = { async readManifest() { reads++; return manifest; },
    isAssetReadable: async () => true };
  assert.equal((await readVisualAsset(request, context, undefined, reader)).status, 'denied');
  assert.equal(reads, 0);
  const result = await readVisualAsset(request, context, authority, reader);
  assert.deepEqual(result.asset, { binaryId: approved, mime: 'image/webp', bytes: 55 });
  assert.equal(result.status, 'available');
  assert.equal((await readVisualAsset({ ...request, binaryId: pending }, context, authority, reader)).status,
    'not_available');
  assert.equal((await readVisualAsset(request, context, authority, {
    ...reader, isAssetReadable: async () => false,
  })).status, 'not_available');
  assert.equal(id, await visualManifestId({ ...manifest, assets: [...manifest.assets].reverse() }));
});

test('rejects corrupt, foreign or unrecognized manifests without disclosing storage contents', async () => {
  for (const payload of [{ ...manifest, revision: 2 }, { ...manifest, tenantId: 'foreign' }, { paths: [] }]) {
    const result = await readVisualAsset(request, context, authority, { readManifest: async () => payload, isAssetReadable: async () => true });
    assert.deepEqual(result, { status: 'manifest_integrity_failed' });
  }
});
