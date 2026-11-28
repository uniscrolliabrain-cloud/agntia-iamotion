import test from 'node:test';
import assert from 'node:assert/strict';
import {
  compileMotionDocument,
  describeMotion,
  sampleMotion,
  sampleMotionFrame,
} from '../dist/factory/composition/document-runtime.js';

const policy = {
  surface: { glass: true, spatial: true, reducedMotion: false, intensity: 1 },
  particles: false,
  maxParticles: 0,
  maxVertices: 0,
  maxSculptureParts: 0,
};
const target = {
  previewId: 'kpi',
  componentId: 'card',
  sourceRevision: 'a'.repeat(40),
};
const surface = { id: 'surface', kind: 'surface', startMs: 0, durationMs: 400, stage: 1 };
const sceneSpec = { version: 1, id: 'scene', durationMs: 1000, layers: [surface] };
const sceneDocument = {
  schemaVersion: 1,
  id: 'demo',
  revision: 0,
  target,
  composition: { kind: 'scene', spec: sceneSpec },
};
const scene = () =>
  compileMotionDocument(sceneDocument, { policy, features: ['surface'], lockedText: {} });

const ambient = {
  base: [0.05, 0.04, 0.06],
  lights: [
    { id: 'key', color: [0.4, 0.3, 0.9], x: 0.5, y: 0.4, radius: 0.8, strength: 0.6, drift: 0.05, phase: 0 },
  ],
  periodMs: 12000,
  intensity: 0.8,
  reducedMotion: false,
  active: true,
};
const filmSpec = {
  version: 1,
  id: 'film',
  fps: 24,
  shots: [
    {
      id: 'a',
      scene: sceneSpec,
      ambient,
      cameraFrom: { position: [0, 0, 3], target: [0, 0, 0], fov: 35 },
      cameraTo: { position: [0.4, 0.2, 2.4], target: [0, 0, 0], fov: 40 },
      overlapMs: 0,
    },
  ],
};
const film = () =>
  compileMotionDocument(
    { schemaVersion: 1, id: 'reel', revision: 0, target, composition: { kind: 'film', spec: filmSpec } },
    { policy, features: ['surface', 'ambient', 'camera'], lockedText: {} },
  );

test('a scene document compiles into a described plan', () => {
  const compiled = scene();
  assert.equal(compiled.kind, 'scene');
  assert.equal(compiled.durationMs, 1000);
  assert.equal(compiled.fps, null);
  assert.equal(compiled.frameCount, null);
  assert.ok(Object.isFrozen(compiled));
  const summary = describeMotion(compiled);
  assert.equal(summary.compositionId, 'scene');
  assert.equal(summary.layerCount, 1);
  assert.equal(summary.revision, 0);
  assert.equal(summary.status, 'experimental');
});

test('sampling the same instant is the same sample, and neighbours in a millisecond collapse', () => {
  const compiled = scene();
  assert.deepEqual(sampleMotion(compiled, 250), sampleMotion(compiled, 250));
  assert.deepEqual(sampleMotion(compiled, 250), sampleMotion(compiled, 250.4));
  assert.equal(sampleMotion(compiled, 250.4).timeMs, 250);
});

test('sampling is clamped to the composition, not extrapolated', () => {
  const compiled = scene();
  assert.equal(sampleMotion(compiled, -10).timeMs, 0);
  assert.equal(sampleMotion(compiled, 5000).timeMs, 1000);
  assert.deepEqual(sampleMotion(compiled, 5000).layers, []);
});

test('non-finite time is rejected instead of silently becoming zero', () => {
  const compiled = scene();
  assert.throws(() => sampleMotion(compiled, Number.NaN), /INVALID_MOTION_TIME/);
  assert.throws(() => sampleMotion(compiled, Number.POSITIVE_INFINITY), /INVALID_MOTION_TIME/);
});

test('an unavailable capability fails closed at compile time', () => {
  assert.throws(
    () => compileMotionDocument(sceneDocument, { policy, features: [], lockedText: {} }),
    /AESTHETIC_CAPABILITY_UNAVAILABLE/,
  );
});

test('a layer that overruns the composition is refused', () => {
  const broken = {
    ...sceneDocument,
    composition: {
      kind: 'scene',
      spec: { ...sceneSpec, layers: [{ ...surface, durationMs: 2000 }] },
    },
  };
  assert.throws(
    () => compileMotionDocument(broken, { policy, features: ['surface'], lockedText: {} }),
    /INVALID_AESTHETIC_INTERVAL/,
  );
});

test('reduced motion is applied by the engine, not by the caller', () => {
  const compiled = compileMotionDocument(sceneDocument, {
    policy: { ...policy, surface: { ...policy.surface, reducedMotion: true } },
    features: ['surface'],
    lockedText: {},
  });
  const [layer] = sampleMotion(compiled, 200).layers;
  assert.equal(layer.pose.elevationPx, 0);
  assert.equal(layer.pose.tiltDeg, 0);
});

test('a film document derives its frame count from its own rate', () => {
  const compiled = film();
  assert.equal(compiled.kind, 'film');
  assert.equal(compiled.fps, 24);
  assert.equal(compiled.durationMs, 1000);
  assert.equal(compiled.frameCount, 24);
});

test('film sampling is monotonic and stays inside the last frame', () => {
  const compiled = film();
  const frames = [0, 41, 500, 999, 1000].map((ms) => sampleMotion(compiled, ms).frame.frame);
  assert.deepEqual(frames, [0, 0, 12, 23, 23]);
  assert.equal(sampleMotion(compiled, 0).frame.ended, false);
  assert.equal(sampleMotion(compiled, 1000).frame.shots.length, 1);
});

test('frame addressing is for films only and clamps to the frame budget', () => {
  assert.throws(() => sampleMotionFrame(scene(), 0), /MOTION_KIND_MISMATCH/);
  assert.throws(() => sampleMotionFrame(film(), 1.5), /INVALID_MOTION_FRAME/);
  assert.equal(sampleMotionFrame(film(), 999).frame.frame, 23);
});
