import assert from 'node:assert/strict';
import { test } from 'node:test';
import { bindCompositionBehaviors, composeBehaviors, expandBehavior, sampleCompositionFrame } from '../../dist/index.js';

const visualId = 'v_9d7cbaa0-c4c9-4f0e-a193-a97ad9f812c3';
const context = { visualId, partIds: new Set(['graphic']), properties: new Set(['opacity']) };
const draft = { schemaVersion: 1, behaviorId: 'reveal', visualId, target: { kind: 'visual' },
  primitive: 'reveal', intensity: 1, trigger: 'manual', state: 'manual', durationMs: 1000,
  loop: false, reducedMotion: { kind: 'static', at: 1 }, bounds: { maxDurationMs: 1000 },
  evidenceIds: [], status: 'proposed' };
const { spec } = expandBehavior(draft, context);
const { timeline } = composeBehaviors({ mode: 'serial', clips: [{ spec }] }, context);
const layer = { id: 'title', kind: 'text', text: 'Composición', inTick: 200, outTick: 1400 };
const project = { schemaVersion: 1, timebase: 1000, fps: { numerator: 25, denominator: 1 },
  rootId: 'scene', compositions: [{ id: 'scene', durationTicks: 1400,
    viewport: { width: 400, height: 300 }, layers: [layer] }] };
const targets = new Map([['visual', 'title'], ['part:graphic', 'title']]);

test('binds milliseconds exactly to layer-relative ticks and samples half-open frames', () => {
  const bound = bindCompositionBehaviors(project, 'scene', timeline, targets);
  assert.equal(bound.ok, true);
  assert.deepEqual(sampleCompositionFrame(bound, 4).activeLayers, []);
  assert.equal(sampleCompositionFrame(bound, 5).properties[0].value, 0);
  assert.equal(sampleCompositionFrame(bound, 5, true).properties[0].value, 1);
  assert.equal(sampleCompositionFrame(bound, 30).properties[0].value, 1);
  assert.deepEqual(sampleCompositionFrame(bound, 35).properties, []);
});

test('rejects unsupported destinations, out-of-layer timing and collapsed write channels', () => {
  assert.equal(bindCompositionBehaviors(project, 'scene', timeline, new Map()).code, 'UNBOUND_BEHAVIOR_LAYER');
  const late = { ...timeline, tracks: [{ ...timeline.tracks[0], endMs: 1201 }] };
  assert.equal(bindCompositionBehaviors(project, 'scene', late, targets).code, 'BEHAVIOR_OUTSIDE_LAYER');
  const inexact = { ...timeline, tracks: [{ ...timeline.tracks[0], startMs: 1 }] };
  assert.equal(bindCompositionBehaviors({ ...project, timebase: 24 }, 'scene', inexact, targets).code,
    'INEXACT_BEHAVIOR_TIME');
  const collided = { ...timeline, tracks: [...timeline.tracks,
    { ...timeline.tracks[0], target: { kind: 'part', partId: 'graphic' } }] };
  assert.equal(bindCompositionBehaviors(project, 'scene', collided, targets).code, 'COMPOSITION_TRACK_COLLISION');
});
