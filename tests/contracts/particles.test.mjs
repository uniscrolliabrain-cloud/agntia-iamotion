import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ParticleField, particleFieldCapabilities } from '../../dist/index.js';

const spec = { schemaVersion: 1, seed: 496, capacity: 12, spawnPerTick: 3, lifetimeTicks: 5,
  tickRate: 60, maxSpeed: 50, maxAcceleration: 20, gravity: [1, 20], attraction: 30, boundary: 'wrap' };
test('replays particles deterministically across batches and serialized checkpoints', () => {
  const field = new ParticleField(spec);
  field.advance(14);
  const restored = new ParticleField(spec, JSON.parse(JSON.stringify(field.checkpoint())));
  restored.advance(9);
  field.advance(9);
  assert.deepEqual(restored.checkpoint(), field.checkpoint());
  const direct = new ParticleField(spec);
  direct.advance(23);
  assert.deepEqual(direct.sample(), field.sample());
  const state = field.checkpoint();
  assert.ok(state.particles.length <= 12);
  assert.ok(state.particles.every(({ age, vx, vy }) => age < 5 && Math.abs(vx) <= 50 && Math.abs(vy) <= 50));
  assert.ok(field.sample().every(({ x, y }) => x >= 0 && x < 1 && y >= 0 && y < 1));
});

test('rejects invalid forces, budgets and incompatible checkpoints', () => {
  assert.equal(particleFieldCapabilities({ ...spec, gravity: [NaN, 0] }).ok, false);
  assert.equal(particleFieldCapabilities({ ...spec, capacity: 2 }).ok, false);
  const field = new ParticleField(spec);
  assert.throws(() => field.advance(4097), /PARTICLE_TICK_LIMIT/u);
  field.advance(1);
  assert.throws(() => new ParticleField({ ...spec, seed: 1 }, field.checkpoint()), /PARTICLE_CHECKPOINT_MISMATCH/u);
  const snapshot = field.checkpoint();
  snapshot.particles.push(snapshot.particles[0]);
  assert.throws(() => new ParticleField(spec, snapshot), /PARTICLE_CHECKPOINT_MISMATCH/u);
});

test('responsive particle projection preserves IDs, caps density and rejects a zero viewport', async () => {
  const { layoutParticles } = await import('../../dist/index.js');
  const samples = Array.from({ length: 120 }, (_, index) => ({ id: index + 1, x: .5, y: .25, age: 12 }));
  const landscape = layoutParticles(samples, { width: 1000, height: 500, tier: 'standard' });
  const portrait = layoutParticles(samples, { width: 400, height: 800, tier: 'compact' });
  assert.equal(portrait.omitted, 24);
  assert.deepEqual(portrait.points.map(({ id }) => id), landscape.points.slice(0, 96).map(({ id }) => id));
  assert.deepEqual(portrait.points[0], { id: 1, x: 200, y: 200, age: 12 });
  assert.equal(layoutParticles(samples, { width: 0, height: 10, tier: 'compact' }).code, 'INVALID_PARTICLE_VIEWPORT');
});

test('bounds normalized pointer influence and replays the same input from a checkpoint', async () => {
  const { normalizeParticlePointer } = await import('../../dist/index.js');
  const point = { clientX: 50, clientY: 80 };
  const viewport = { left: 0, top: 0, width: 100, height: 160 };
  assert.equal(normalizeParticlePointer(point, viewport, true), undefined);
  assert.equal(normalizeParticlePointer({ ...point, clientX: -1 }, viewport, false), undefined);
  assert.equal(normalizeParticlePointer(point, { ...viewport, width: 0 }, false), undefined);
  assert.equal(normalizeParticlePointer(point, viewport, false).x, .5);
  const field = new ParticleField(spec);
  field.advance(1);
  const checkpoint = field.checkpoint();
  const particle = field.sample()[0];
  const influence = { x: particle.x + .025 < 1 ? particle.x + .025 : particle.x - .025,
    y: particle.y, radius: .3, strength: 2000 };
  const replay = new ParticleField(spec, checkpoint);
  const neutral = new ParticleField(spec, checkpoint);
  field.advance(1, influence);
  replay.advance(1, influence);
  neutral.advance(1);
  assert.deepEqual(field.checkpoint(), replay.checkpoint());
  assert.notDeepEqual(field.sample(), neutral.sample());
});
