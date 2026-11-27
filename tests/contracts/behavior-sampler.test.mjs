import assert from 'node:assert/strict';
import { test } from 'node:test';
import { composeBehaviors, expandBehavior, sampleBehaviorTimeline } from '../../dist/index.js';

const visualId = 'v_9d7cbaa0-c4c9-4f0e-a193-a97ad9f812c3';
const context = { visualId, partIds: new Set(), properties: new Set(['translateY']) };
const { spec } = expandBehavior({ schemaVersion: 1, behaviorId: 'float', visualId,
  target: { kind: 'visual' }, primitive: 'float', trigger: 'manual', state: 'manual',
  intensity: 1, durationMs: 1000, loop: false, reducedMotion: { kind: 'static', at: 0 },
  bounds: { maxDurationMs: 1000 }, evidenceIds: [], status: 'proposed' }, context);
const { timeline } = composeBehaviors({ mode: 'serial', clips: [{ spec, delayMs: 100 }] }, context);

test('samples validated time and static fallback deterministically', () => {
  assert.deepEqual(sampleBehaviorTimeline(timeline, 0), []);
  assert.equal(sampleBehaviorTimeline(timeline, 350)[0].value, -6);
  assert.equal(sampleBehaviorTimeline(timeline, 600)[0].value, -12);
  assert.equal(sampleBehaviorTimeline(timeline, 600, true)[0].value, 0);
  assert.equal(sampleBehaviorTimeline(timeline, 5000)[0].value, 0);
  assert.throws(() => sampleBehaviorTimeline(timeline, Infinity), /INVALID_BEHAVIOR_SAMPLE_TIME/u);
});
