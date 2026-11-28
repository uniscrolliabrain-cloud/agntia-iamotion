import { z } from 'zod';

export const ParticleFieldSpec = z.strictObject({
  schemaVersion: z.literal(1),
  seed: z.number().int().min(1).max(0xffffffff),
  capacity: z.number().int().min(1).max(512),
  spawnPerTick: z.number().int().min(0).max(32),
  lifetimeTicks: z.number().int().min(1).max(3600),
  tickRate: z.number().int().min(1).max(120),
  maxSpeed: z.number().int().min(1).max(40000),
  maxAcceleration: z.number().int().min(1).max(2000),
  gravity: z.tuple([z.number().int().min(-2000).max(2000), z.number().int().min(-2000).max(2000)]),
  attraction: z.number().int().min(0).max(2000),
  boundary: z.literal('wrap'),
}).refine((spec) => spec.spawnPerTick <= spec.capacity);
export type ParticleFieldSpec = z.infer<typeof ParticleFieldSpec>;

export function particleFieldCapabilities(input: unknown) {
  const parsed = ParticleFieldSpec.safeParse(input);
  return parsed.success ? { ok: true, spec: parsed.data,
    capabilities: { domain: 'normalized', forces: ['gravity', 'center-attraction'],
      deterministic: true, capacity: parsed.data.capacity } } as const
    : { ok: false, code: 'INVALID_PARTICLE_FIELD' } as const;
}
