import { z } from 'zod';
import { ParticleFieldSpec } from './particles/spec.js';

const Id = z.string().regex(/^[a-z0-9][a-z0-9-]{0,95}$/u);
const Seed = z.number().int().min(1).max(0xffffffff);
const common = { schemaVersion: z.literal(1), id: Id, seed: Seed,
  label: z.string().min(1).max(100), capacity: z.number().int().min(12).max(180) };
const Recipe = z.discriminatedUnion('kind', [
  z.strictObject({ ...common, kind: z.literal('ambient') }),
  z.strictObject({ ...common, kind: z.literal('flow'), heading: z.enum(['left', 'right']) }),
  z.strictObject({ ...common, kind: z.literal('attraction'), intensity: z.number().int().min(100).max(900) }),
]);
export type ParticleRecipe = z.infer<typeof Recipe>;

export function loadParticleRecipes(input: unknown) {
  const list = z.array(Recipe).min(1).max(32).parse(input);
  const index = new Map(list.map((recipe) => [recipe.id, recipe]));
  if (index.size !== list.length) throw new Error('DUPLICATE_PARTICLE_RECIPE');
  return index;
}

export function compileParticleRecipe(index: ReadonlyMap<string, ParticleRecipe>, id: string,
  capabilities: ReadonlySet<string>) {
  const recipe = index.get(id);
  if (!recipe) return { ok: false, code: 'UNKNOWN_PARTICLE_RECIPE' } as const;
  if (!capabilities.has('canvas2d')) return { ok: false, code: 'PARTICLE_RENDERER_UNSUPPORTED' } as const;
  const options: Pick<ParticleFieldSpec, 'gravity' | 'attraction'> =
    recipe.kind === 'ambient' ? { gravity: [7, -11], attraction: 110 }
    : recipe.kind === 'flow' ? { gravity: [recipe.heading === 'right' ? 150 : -150, 0], attraction: 0 }
    : { gravity: [0, 0], attraction: recipe.intensity };
  const spec = ParticleFieldSpec.parse({
    schemaVersion: 1, seed: recipe.seed, capacity: recipe.capacity, spawnPerTick: 5,
    lifetimeTicks: 110, tickRate: 60, maxSpeed: 9000, maxAcceleration: 400, boundary: 'wrap',
    ...options,
  });
  return { ok: true, id, label: recipe.label, kind: recipe.kind, spec,
    renderer: 'canvas2d', initialTicks: 45, reducedMotion: 'static' } as const;
}
