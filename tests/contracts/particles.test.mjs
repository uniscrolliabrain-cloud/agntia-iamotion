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
