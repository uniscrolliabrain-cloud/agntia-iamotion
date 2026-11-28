import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validateBehaviorSpec } from '../../dist/index.js';

const context = { visualId: 'v_9d7cbaa0-c4c9-4f0e-a193-a97ad9f812c3',
  partIds: new Set(['flap']), properties: new Set(['rotateX']), maxDurationMs: 1500 };
const track = { property: 'rotateX', unit: 'deg', keyframes: [
  { t: 0, value: 0, easing: 'linear' }, { t: 1, value: 80, easing: 'ease-out' },
] };
const spec = { schemaVersion: 1, behaviorId: 'flap-opening', visualId: context.visualId,
  target: { kind: 'part', partId: 'flap' }, primitive: 'fold', trigger: 'manual', state: 'manual',
  tracks: [track], durationMs: 800, loop: false, reducedMotion: { kind: 'static', at: 1 },
  bounds: { maxDurationMs: 1200 }, evidenceIds: [], status: 'proposed' };
const code = (patch, options = context) => validateBehaviorSpec({ ...spec, ...patch }, options).code;

test('validates an annotated target and renderer-supported static-fallback proposal', () => {
  assert.deepEqual(validateBehaviorSpec(spec, context), { ok: true, spec });
  assert.equal(code({ target: { kind: 'part', partId: 'missing' } }), 'TARGET_NOT_FOUND');
  assert.equal(code({}, { ...context, properties: new Set() }), 'CAPABILITY_UNSUPPORTED');
  assert.equal(code({ target: { kind: 'visual' } }), 'CAPABILITY_UNSUPPORTED');
  assert.equal(code({ reducedMotion: undefined }), 'INVALID_SPEC');
  assert.equal(code({ durationMs: 1300 }), 'DURATION_EXCEEDED');
});

test('rejects nonfinite data, unordered or duplicated tracks and unauthorized loops', () => {
  assert.equal(code({ tracks: [{ ...track, keyframes: [...track.keyframes].reverse() }] }), 'KEYFRAME_ORDER');
  assert.equal(code({ tracks: [track, track] }), 'DUPLICATE_PROPERTY');
  assert.equal(code({ tracks: [{ ...track, unit: 'px' }] }), 'UNIT_MISMATCH');
  for (const [value, expected] of [[NaN, 'INVALID_SPEC'], [361, 'KEYFRAME_VALUE_OUT_OF_BOUNDS']]) {
    assert.equal(code({ tracks: [{ ...track, keyframes: [track.keyframes[0],
      { ...track.keyframes[1], value }] }] }), expected);
  }
  assert.equal(code({ loop: true }, { ...context, allowIdleLoop: true }), 'LOOP_NOT_ALLOWED');
  assert.equal(code({ loop: true, trigger: 'idle', state: 'idle' }), 'LOOP_NOT_ALLOWED');
  assert.equal(validateBehaviorSpec({ ...spec, loop: true, trigger: 'idle', state: 'idle' },
    { ...context, allowIdleLoop: true }).ok, true);
});
