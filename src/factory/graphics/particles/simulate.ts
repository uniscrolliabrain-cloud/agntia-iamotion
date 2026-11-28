import { z } from 'zod';
import { ParticlePointer } from './interaction.js';
import { ParticleFieldSpec } from './spec.js';

const domain = 1_000_000;
const maximumTicks = 1_000_000;
const Position = z.number().int().min(0).max(domain - 1);
const Velocity = z.number().int().min(-40000).max(40000);
const Checkpoint = z.strictObject({
  schemaVersion: z.literal(1), spec: ParticleFieldSpec,
  tick: z.number().int().min(0).max(maximumTicks),
  random: z.number().int().min(1).max(0xffffffff),
  nextId: z.number().int().min(1).max(32 * maximumTicks + 1),
  particles: z.array(z.strictObject({
    id: z.number().int().min(1).max(32 * maximumTicks),
    x: Position, y: Position, vx: Velocity, vy: Velocity,
    age: z.number().int().min(0).max(3599),
  })).max(512),
});
type Particle = z.infer<typeof Checkpoint>['particles'][number];
const clamp = (value: number, limit: number) => Math.min(limit, Math.max(-limit, value));
const wrap = (value: number) => ((value % domain) + domain) % domain;

export class ParticleField {
  readonly #spec;
  #tick = 0;
  #nextId = 1;
  #random: number;
  #particles: Particle[] = [];

  constructor(input: unknown, checkpoint?: unknown) {
    this.#spec = ParticleFieldSpec.parse(input);
    this.#random = this.#spec.seed;
    if (checkpoint === undefined) return;
    const state = Checkpoint.parse(checkpoint);
    const { capacity, lifetimeTicks, maxSpeed, spawnPerTick } = this.#spec;
    if (JSON.stringify(state.spec) !== JSON.stringify(this.#spec) || state.particles.length > capacity ||
        state.nextId > state.tick * spawnPerTick + 1 ||
        new Set(state.particles.map(({ id }) => id)).size !== state.particles.length ||
        state.particles.some(({ id, age, vx, vy }) => id >= state.nextId || age >= lifetimeTicks ||
          age >= state.tick || Math.max(Math.abs(vx), Math.abs(vy)) > maxSpeed)) {
      throw new Error('PARTICLE_CHECKPOINT_MISMATCH');
    }
    this.#tick = state.tick;
    this.#nextId = state.nextId;
    this.#random = state.random;
    this.#particles = state.particles;
  }

  #next() {
    let value = this.#random;
    value ^= value << 13;
    value ^= value >>> 17;
    value ^= value << 5;
    return this.#random = value >>> 0;
  }

  advance(ticks: number, pointerInput?: unknown) {
    if (!Number.isSafeInteger(ticks) || ticks < 0 || ticks > 4096 || this.#tick + ticks > maximumTicks) {
      throw new Error('PARTICLE_TICK_LIMIT');
    }
    const pointer = pointerInput === undefined ? undefined : ParticlePointer.parse(pointerInput);
    const influence = pointer && { x: Math.round(pointer.x * domain), y: Math.round(pointer.y * domain),
      radius: Math.round(pointer.radius * domain), strength: pointer.strength };
    const { capacity, spawnPerTick, lifetimeTicks, maxSpeed, maxAcceleration, gravity, attraction } = this.#spec;
    for (let index = 0; index < ticks; index++) {
      this.#particles = this.#particles.filter((particle) => ++particle.age < lifetimeTicks);
      for (const particle of this.#particles) {
        const dx = influence ? influence.x - particle.x : 0;
        const dy = influence ? influence.y - particle.y : 0;
        const distance = Math.max(Math.abs(dx), Math.abs(dy));
        const strength = influence && distance < influence.radius
          ? Math.trunc((influence.radius - distance) * influence.strength / influence.radius) : 0;
        const accelerate = (position: number, base: number, offset: number) =>
          clamp(base + Math.trunc((domain / 2 - position) * attraction / domain) +
            (distance ? Math.trunc(offset * strength / distance) : 0), maxAcceleration);
        particle.vx = clamp(particle.vx + accelerate(particle.x, gravity[0], dx), maxSpeed);
        particle.vy = clamp(particle.vy + accelerate(particle.y, gravity[1], dy), maxSpeed);
        particle.x = wrap(particle.x + particle.vx);
        particle.y = wrap(particle.y + particle.vy);
      }
      const available = Math.min(capacity - this.#particles.length, spawnPerTick);
      for (let slot = 0; slot < available; slot++) {
        this.#particles.push({ id: this.#nextId++, x: this.#next() % domain, y: this.#next() % domain,
          vx: 0, vy: 0, age: 0 });
      }
      this.#tick++;
    }
  }

  checkpoint() {
    return structuredClone({ schemaVersion: 1, spec: this.#spec, tick: this.#tick,
      random: this.#random, nextId: this.#nextId, particles: this.#particles });
  }

  sample() {
    return this.#particles.map(({ id, x, y, age }) => ({
      id, x: x / domain, y: y / domain, age,
    }));
  }
}
