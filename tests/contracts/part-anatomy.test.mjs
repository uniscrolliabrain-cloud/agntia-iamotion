import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validatePartAnatomy } from '../../dist/index.js';

const evidence = { schemaVersion: 1, evidenceId: 'inspection:one', kind: 'inspection',
  sourceHash: 'a'.repeat(64), method: 'synthetic-fixture' };
const part = { partId: 'flap', label: 'Flap', parentPartId: null, evidenceIds: [evidence.evidenceId],
  region: { x: .2, y: .2, width: .6, height: .5 }, separable: true };

test('flags annotated parts with supporting evidence and keeps hidden geometry unknown', () => {
  const [annotation] = validatePartAnatomy([part], [evidence]);
  assert.equal(annotation.regionStatus, 'annotated');
  assert.equal(annotation.separableTarget, true);
  assert.equal(annotation.hiddenGeometry, null);
  const [unknown] = validatePartAnatomy([{ ...part, region: null, separable: null }], [evidence]);
  assert.equal(unknown.regionStatus, 'unknown');
  assert.equal(unknown.separableTarget, false);
});

test('rejects geometry inferred from prompts, out-of-frame regions and parent cycles', () => {
  assert.throws(() => validatePartAnatomy([part], [{ ...evidence, kind: 'prompt' }]),
    /PART_REGION_REQUIRES_OBSERVATION/u);
  assert.throws(() => validatePartAnatomy([{ ...part, region: { ...part.region, x: .6 } }], [evidence]),
    /Region extends/u);
  assert.throws(() => validatePartAnatomy([
    { ...part, parentPartId: 'seal' }, { ...part, partId: 'seal', parentPartId: 'flap' },
  ], [evidence]), /PART_PARENT_CYCLE/u);
});
