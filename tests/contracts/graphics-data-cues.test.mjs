import assert from 'node:assert/strict';
import { test } from 'node:test';
import { negotiateGraphicsRenderer, planGraphicsCues, prepareBarChart } from '../../dist/index.js';

const request = { id: 'fixture', scope: 'demo', revision: 1 };
const snapshot = { schemaVersion: 1, ...request, unit: 'u', source: 'fixture', synthetic: true,
  rows: [{ id: 'one', label: 'Revisión', value: 42 }, { id: 'zero', label: 'Pendiente', value: 0 }] };
const permissions = new Set(['demo']);
const domain = { min: 0, max: 100 };
test('bar geometry keeps exact synthetic host values and a zero baseline', async () => {
  const reader = { read: async () => snapshot };
  const result = await prepareBarChart(request, permissions, reader, domain);
  assert.deepEqual(result.table, snapshot.rows);
  assert.equal(result.synthetic, true);
  assert.equal(result.marks[0].proportion, .42);
  assert.equal((await prepareBarChart(request, permissions, reader, { min: 20, max: 100 })).code,
    'INVALID_BAR_DOMAIN');
  assert.equal((await prepareBarChart(request, permissions, reader, { min: 0, max: 20 })).code,
    'VALUE_OUTSIDE_BAR_DOMAIN');
  assert.equal((await prepareBarChart({ ...request, revision: 2 }, permissions, reader, domain)).code,
    'STALE_DATA_REVISION');
  assert.equal((await prepareBarChart(request, new Set(), { read: async () => assert.fail() }, domain)).code,
    'DATA_SCOPE_DENIED');
});

test('validates cues, leaves captions exact and emits explicit silent fallback', () => {
  const binaryId = 'a'.repeat(64);
  const caption = { id: 'caption', channel: 'es', locale: 'es', text: 'Revisión 42',
    startTick: 1, endTick: 10 };
  const cue = { id: 'sound', binaryId, gain: .3, fadeIn: 1, fadeOut: 1, startTick: 0, endTick: 10 };
  const original = { durationTicks: 10, captions: [caption], audio: [cue] };
  assert.equal(planGraphicsCues(original, new Set(), true).code, 'AUDIO_RIGHTS_REQUIRED');
  const silent = planGraphicsCues(original, new Set([binaryId]), false);
  assert.equal(silent.mode, 'silent');
  assert.deepEqual(silent.captions, [caption]);
  assert.deepEqual(silent.audio, []);
  assert.equal(planGraphicsCues({ ...original, captions: [caption, { ...caption, id: 'other' }] },
    new Set([binaryId]), false).code, 'CAPTION_CHANNEL_OVERLAP');
});

test('rejects a renderer that lacks mandatory mask features', () => {
  const scene = { schemaVersion: 1, timebase: 1000, fps: { numerator: 24, denominator: 1 },
    rootId: 'scene', compositions: [{ id: 'scene', viewport: { width: 720, height: 480 }, durationTicks: 1000,
      layers: [
        { kind: 'shape', id: 'mask', shapeId: 'box', inTick: 0, outTick: 1000 },
        { kind: 'text', id: 'title', text: 'Texto', maskId: 'mask', inTick: 0, outTick: 1000 },
      ] }] };
  const profile = { id: 'fixture', version: '1', features: new Set(['shape', 'text']) };
  const result = negotiateGraphicsRenderer(scene, profile);
  assert.equal(result.code, 'RENDER_FEATURE_UNSUPPORTED');
  assert.deepEqual(result.missing, ['mask']);
  profile.features.add('mask');
  assert.equal(negotiateGraphicsRenderer(scene, profile).ok, true);
});
