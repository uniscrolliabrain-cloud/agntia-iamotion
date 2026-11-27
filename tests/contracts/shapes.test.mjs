import assert from 'node:assert/strict';
import { test } from 'node:test';
import { negotiateShapeMorph, serializeShapeSvg, validateShape } from '../../dist/index.js';

const rectangle = { schemaVersion: 1, geometry: { kind: 'rect', x: 2, y: 3, width: 10, height: 12 },
  fill: '#ffeecc', stroke: 'none', strokeWidth: 0, label: 'A < B & C' };

test('produces deterministic SVG with escaped labels and only allowlisted paint', () => {
  const canvas = { width: 20, height: 20 };
  const out = serializeShapeSvg(rectangle, canvas);
  assert.equal(out.svg,
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>A &lt; B &amp; C</title><rect x="2" y="3" width="10" height="12" rx="0" fill="#ffeecc" stroke="none" stroke-width="0"/></svg>');
  assert.equal(serializeShapeSvg({ ...rectangle, fill: 'not-a-color' }, canvas).code, 'INVALID_SHAPE');
  assert.equal(serializeShapeSvg({ ...rectangle, geometry: { ...rectangle.geometry, radius: -2 } }, canvas).ok, false);
  assert.equal(validateShape({ ...rectangle, fill: { angle: 90, stops: [
    { offset: .5, color: '#ffffff' }, { offset: .25, color: '#000000' },
  ] } }).code, 'UNORDERED_GRADIENT');
});

test('requires matching path commands before offering shape morph', () => {
  const path = (commands) => ({ ...rectangle, geometry: { kind: 'path', commands } });
  const move = { type: 'M', to: [0, 0] };
  const line = { type: 'L', to: [10, 10] };
  const a = path([move, line, { type: 'Z' }]);
  assert.equal(negotiateShapeMorph(a, path([move, { ...line, to: [20, 20] }, { type: 'Z' }])).mode, 'morph');
  assert.equal(negotiateShapeMorph(a, path([move, line])).mode, 'crossfade');
  assert.equal(validateShape(path([line, { type: 'Z' }])).code, 'INVALID_PATH_TOPOLOGY');
});
