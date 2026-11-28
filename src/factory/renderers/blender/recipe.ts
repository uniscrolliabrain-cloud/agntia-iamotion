import { z } from 'zod';

const Id = z.string().regex(/^[a-z0-9][a-z0-9-]{0,95}$/u);
const VisualId = z.string().regex(/^v_[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/u);
const Meters = z.number().min(-100).max(100);
const Point = z.tuple([Meters, Meters, Meters]);
const Dimension = z.number().min(0.0001).max(100);
const Color = z.number().min(0).max(1);
const Geometry = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('box'), dimensions: z.tuple([Dimension, Dimension, Dimension]) }),
  z.strictObject({ kind: z.literal('cylinder'), radius: Dimension, height: Dimension,
    segments: z.number().int().min(8).max(128) }),
  z.strictObject({ kind: z.literal('plane'), width: Dimension, height: Dimension }),
]);
const Part = z.strictObject({
  id: Id, parentId: Id.nullable(), geometry: Geometry, materialId: Id,
  position: Point, pivot: Point,
});
const Material = z.strictObject({
  id: Id, color: z.tuple([Color, Color, Color]), roughness: Color, metallic: Color,
});
const Camera = z.strictObject({
  kind: z.enum(['orthographic', 'perspective']), position: Point, target: Point,
});
const Light = z.strictObject({
  id: Id, kind: z.literal('area'), position: Point, target: Point, watts: z.number().positive().max(5000),
  size: Dimension,
});

export const ReconstructionRecipeSchema = z.strictObject({
  schemaVersion: z.literal(1),
  visualId: VisualId, mode: z.enum(['2d', '2.5d', '3d']), units: z.literal('m'), upAxis: z.literal('Z'),
  parts: z.array(Part).min(1).max(128), materials: z.array(Material).min(1).max(32),
  camera: Camera, lights: z.array(Light).max(8),
  sourceAssets: z.array(z.string().regex(/^[a-f0-9]{64}$/u)).max(32),
  uncertainty: z.strictObject({
    hiddenGeometry: z.enum(['unknown', 'proposed']), notes: z.array(z.string().min(1).max(1024)).max(64),
  }),
  status: z.literal('proposed'),
});

export function validateReconstructionRecipe(input: unknown, authorizedAssets: ReadonlySet<string>) {
  const parsed = ReconstructionRecipeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: 'INVALID_RECIPE' } as const;
  const recipe = parsed.data;
  const parts = new Map(recipe.parts.map((part) => [part.id, part]));
  const materials = new Set(recipe.materials.map(({ id }) => id));
  const lights = new Set(recipe.lights.map(({ id }) => id));
  if (parts.size !== recipe.parts.length || materials.size !== recipe.materials.length ||
      lights.size !== recipe.lights.length) return { ok: false, code: 'DUPLICATE_RECIPE_ID' } as const;
  if (recipe.sourceAssets.some((id) => !authorizedAssets.has(id))) {
    return { ok: false, code: 'RECIPE_ASSET_UNAUTHORIZED' } as const;
  }
  const checked = new Set<string>();
  for (const part of recipe.parts) {
    if (!materials.has(part.materialId)) return { ok: false, code: 'UNKNOWN_MATERIAL' } as const;
    if (recipe.mode === '2d' && part.geometry.kind !== 'plane') {
      return { ok: false, code: 'UNSUPPORTED_2D_GEOMETRY' } as const;
    }
    const branch = new Set<string>();
    let current: string | null = part.id;
    while (current !== null && !checked.has(current)) {
      if (branch.has(current)) return { ok: false, code: 'RECIPE_PART_CYCLE' } as const;
      branch.add(current);
      const node = parts.get(current);
      if (!node) return { ok: false, code: 'UNKNOWN_RECIPE_PARENT' } as const;
      current = node.parentId;
    }
    for (const id of branch) checked.add(id);
  }
  return { ok: true, recipe } as const;
}
