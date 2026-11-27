import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  BinaryRecordSchema, ClaimSchema, MotionSpec, VisualEntitySchema, visualLibraryJsonSchemas,
} from '../../dist/index.js';

const binary = {
  schemaVersion: 1, binaryId: 'a'.repeat(64), mime: 'image/webp', bytes: 100,
  storageRef: 'pending-review/image.webp', reviewStatus: 'pending', sourceRefs: [],
};
const visual = {
  schemaVersion: 1, visualId: 'v_9d7cbaa0-c4c9-4f0e-a193-a97ad9f812c3',
  revision: 1, slug: 'ceramic-mail', kind: 'icon', familyIds: [],
  binaryIds: [binary.binaryId], claimIds: [], relationIds: [], lifecycle: 'candidate',
};

test('valid versioned records parse and V1 MotionSpec remains supported', () => {
  assert.deepEqual(BinaryRecordSchema.parse(binary), binary);
  assert.deepEqual(VisualEntitySchema.parse(visual), visual);
  const motion = { schemaVersion: 1, title: 'Mail', assetIds: [], durationMs: 250,
    behavior: 'breathe', output: 'svg' };
  assert.deepEqual(MotionSpec.parse(motion), motion);
});

test('rejects escaping paths, unbounded records and unversioned data', () => {
  for (const storageRef of ['../asset.webp', 'foo/../asset.webp', '/asset.webp',
    'https://assets.invalid/a.webp', 'foo//asset.webp', 'foo\\asset.webp']) {
    assert.equal(BinaryRecordSchema.safeParse({ ...binary, storageRef }).success, false, storageRef);
  }
  assert.equal(BinaryRecordSchema.safeParse({ ...binary, injected: true }).success, false);
  assert.equal(BinaryRecordSchema.safeParse({ ...binary, bytes: Infinity }).success, false);
  assert.equal(VisualEntitySchema.safeParse({ ...visual, visualId: 'v_invalid' }).success, false);
  assert.equal(VisualEntitySchema.safeParse({ ...visual, schemaVersion: 2 }).success, false);
  assert.equal(VisualEntitySchema.safeParse({ ...visual, binaryIds: Array(257).fill(binary.binaryId) }).success, false);
});

test('claims require evidence even when marked proposed', () => {
  const claim = {
    schemaVersion: 1, claimId: 'c_' + 'b'.repeat(64), visualId: visual.visualId,
    facet: 'appearance', predicate: 'material', value: 'ceramic', basis: 'proposed',
    evidenceIds: ['e:prompt'], confidence: 'low', reviewStatus: 'pending', revision: 1,
  };
  assert.equal(ClaimSchema.safeParse(claim).success, true);
  assert.equal(ClaimSchema.safeParse({ ...claim, evidenceIds: [] }).success, false);
  assert.equal(ClaimSchema.safeParse({ ...claim, value: NaN }).success, false);
});

test('registry generates six versioned strict JSON schemas', () => {
  const schemas = visualLibraryJsonSchemas();
  assert.deepEqual(Object.keys(schemas), ['binary', 'visual', 'evidence', 'claim', 'relation', 'review']);
  for (const schema of Object.values(schemas)) {
    assert.equal(schema.additionalProperties, false);
    assert.equal(schema.properties.schemaVersion.const, 1);
  }
});
