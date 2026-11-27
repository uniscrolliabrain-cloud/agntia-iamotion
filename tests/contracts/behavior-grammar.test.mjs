import assert from 'node:assert/strict';
import { test } from 'node:test';
import { composeBehaviors, expandBehavior } from '../../dist/index.js';

const visualId = 'v_9d7cbaa0-c4c9-4f0e-a193-a97ad9f812c3';
const context = { visualId, partIds: new Set(['flap']),
  properties: new Set(['translateX', 'translateY', 'translateZ', 'scale', 'opacity', 'rotateX', 'rotateZ']),
  allowIdleLoop: true, maxDurationMs: 2400 };
const request = { schemaVersion: 1, behaviorId: 'first', visualId,
  target: { kind: 'visual' }, primitive: 'float', trigger: 'idle', state: 'idle', intensity: .5,
  durationMs: 800, loop: false, reducedMotion: { kind: 'static', at: 0 },
  bounds: { maxDurationMs: 1200 }, evidenceIds: [], status: 'proposed' };
const expanded = (patch = {}, capabilities = context) => expandBehavior({ ...request, ...patch }, capabilities);

test('expands the grammar deterministically and requires real part capabilities for folds', () => {
  assert.deepEqual(expanded(), expanded());
  assert.deepEqual(expanded().spec.tracks[0].keyframes.map(({ value }) => value), [0, -6, 0]);
  assert.equal(expanded({ primitive: 'fold' }).code, 'CAPABILITY_UNSUPPORTED');
  const fold = expanded({ primitive: 'fold', target: { kind: 'part', partId: 'flap' } });
  assert.equal(fold.spec.tracks[0].keyframes[1].value, -55);
  assert.equal(expanded({ intensity: Infinity }).code, 'INVALID_PRIMITIVE_REQUEST');
});

test('detects parallel collisions and allows adjacent or independent tracks', () => {
  const first = expanded().spec;
  const second = expanded({ behaviorId: 'second', primitive: 'settle' }).spec;
  const parallel = { mode: 'parallel', clips: [{ spec: first }, { spec: second }] };
  assert.equal(composeBehaviors(parallel, context).code, 'TRACK_CONFLICT');
  const serial = composeBehaviors({ ...parallel, mode: 'serial' }, context);
  assert.deepEqual(serial.timeline.tracks.map(({ startMs, endMs }) => [startMs, endMs]), [[0, 800], [800, 1600]]);
  assert.deepEqual(serial, composeBehaviors({ ...parallel, mode: 'serial' }, context));
  const third = expanded({ behaviorId: 'third', primitive: 'reveal' }).spec;
  const independent = composeBehaviors({ mode: 'parallel', clips: [{ spec: first }, { spec: third }] }, context);
  assert.equal(independent.timeline.durationMs, 800);
  assert.equal(independent.timeline.tracks.length, 2);
});

test('applies bounded repeat counts and requires an authorized looping spec', () => {
  const compose = (spec, repeat) => composeBehaviors({ mode: 'serial', clips: [{ spec, repeat }] }, context);
  assert.equal(compose(expanded().spec, 2).code, 'REPEAT_NOT_ALLOWED');
  const loop = expanded({ loop: true }).spec;
  assert.equal(compose(loop, 3).timeline.durationMs, 2400);
  assert.equal(compose(loop, 4).code, 'TIMELINE_DURATION_EXCEEDED');
  assert.equal(compose(loop, 100).code, 'INVALID_COMPOSITION');
});
