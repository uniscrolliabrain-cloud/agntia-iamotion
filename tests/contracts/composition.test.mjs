import assert from 'node:assert/strict';
import { test } from 'node:test';
import { frameTime, layerContainsFrame, validateCompositionProject } from '../../dist/index.js';

const timing = { timebase: 30000, fps: { numerator: 30000, denominator: 1001 } };
const box = { id: 'shape', kind: 'shape', shapeId: 'box', inTick: 0, outTick: 2002 };
const label = { id: 'label', kind: 'text', text: 'Exacto', inTick: 1001, outTick: 2002, maskId: 'shape' };
const comp = (id, layers) => ({ id, layers, durationTicks: 3003, viewport: { width: 1920, height: 1080 } });
const spec = { schemaVersion: 1, rootId: 'scene', ...timing, compositions: [comp('scene', [label, box])] };

test('validates composition dependencies and uses half-open intervals at rational frame rates', () => {
  const validated = validateCompositionProject(spec);
  assert.equal(validated.ok, true);
  assert.deepEqual(validated.dependencyOrder, ['scene/shape', 'scene/label', 'scene']);
  assert.equal(layerContainsFrame(label, 0, timing), false);
  assert.equal(layerContainsFrame(label, 1, timing), true);
  assert.equal(layerContainsFrame(label, 2, timing), false);
  const exact = frameTime(Number.MAX_SAFE_INTEGER, timing);
  assert.equal(exact.numerator / exact.denominator, BigInt(Number.MAX_SAFE_INTEGER) * 1001n);
});

test('rejects cycles across shape masks and parents, invalid ticks and unreduced rates', () => {
  const run = (layers) => validateCompositionProject({ ...spec, compositions: [comp('scene', layers)] });
  assert.equal(run([label, { ...box, parentId: label.id }]).code, 'COMPOSITION_DEPENDENCY_CYCLE');
  assert.equal(run([box, box]).code, 'DUPLICATE_COMPOSITION_LAYER');
  assert.equal(run([{ ...box, outTick: Number.MAX_SAFE_INTEGER + 1 }]).code, 'INVALID_COMPOSITION_PROJECT');
  assert.equal(validateCompositionProject({ ...spec, fps: { numerator: 60000, denominator: 2002 } }).code,
    'FPS_NOT_REDUCED');
  assert.equal(run([{ id: 'self', kind: 'composition', compositionId: 'scene', inTick: 0, outTick: 2002 }]).code,
    'COMPOSITION_DEPENDENCY_CYCLE');
});
