import { z } from 'zod';

const Id = z.string().regex(/^[a-z0-9][a-z0-9-]{0,95}$/u);
const Hash = z.string().regex(/^[a-f0-9]{64}$/u);
const Tick = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);
const fps = z.strictObject({
  numerator: z.number().int().min(1).max(300000),
  denominator: z.number().int().min(1).max(10000),
});
const Viewport = z.strictObject({
  width: z.number().int().min(1).max(8192),
  height: z.number().int().min(1).max(8192),
});
const LayerFields = { id: Id, inTick: Tick, outTick: Tick, parentId: Id.optional(), maskId: Id.optional() };
const Layer = z.discriminatedUnion('kind', [
  z.strictObject({ ...LayerFields, kind: z.literal('group') }),
  z.strictObject({ ...LayerFields, kind: z.literal('shape'), shapeId: Id }),
  z.strictObject({ ...LayerFields, kind: z.literal('text'), text: z.string().min(1).max(12000) }),
  z.strictObject({ ...LayerFields, kind: z.literal('asset'), binaryId: Hash }),
  z.strictObject({ ...LayerFields, kind: z.literal('composition'), compositionId: Id }),
]);
const Composition = z.strictObject({
  id: Id, viewport: Viewport, durationTicks: Tick.positive(), layers: z.array(Layer).max(256),
});
export const CompositionProjectSchema = z.strictObject({
  schemaVersion: z.literal(1),
  rootId: Id, timebase: z.number().int().min(1).max(1000000), fps,
  compositions: z.array(Composition).min(1).max(32),
});
export type CompositionProject = z.infer<typeof CompositionProjectSchema>;

function gcd(a: number, b: number): number {
  return b ? gcd(b, a % b) : a;
}

export function validateCompositionProject(input: unknown) {
  const parsed = CompositionProjectSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: 'INVALID_COMPOSITION_PROJECT' } as const;
  const project = parsed.data;
  if (gcd(project.fps.numerator, project.fps.denominator) !== 1) {
    return { ok: false, code: 'FPS_NOT_REDUCED' } as const;
  }
  const compositions = new Map(project.compositions.map((composition) => [composition.id, composition]));
  if (compositions.size !== project.compositions.length || !compositions.has(project.rootId)) {
    return { ok: false, code: 'INVALID_COMPOSITION_IDS' } as const;
  }
  if (project.compositions.reduce((count, { layers }) => count + layers.length, 0) > 256) {
    return { ok: false, code: 'PROJECT_LAYER_LIMIT' } as const;
  }

  const graph = new Map<string, string[]>();
  for (const composition of project.compositions) {
    const { id, layers, durationTicks } = composition;
    const part = (layerId: string) => `${id}/${layerId}`;
    const layerIndex = new Map(layers.map((layer) => [layer.id, layer]));
    if (layerIndex.size !== layers.length) return { ok: false, code: 'DUPLICATE_COMPOSITION_LAYER' } as const;
    graph.set(id, layers.map(({ id }) => part(id)));
    for (const layer of layers) {
      if (layer.inTick >= layer.outTick || layer.outTick > durationTicks) {
        return { ok: false, code: 'INVALID_LAYER_INTERVAL' } as const;
      }
      const dependencies = [];
      if (layer.parentId) {
        if (!layerIndex.has(layer.parentId)) return { ok: false, code: 'UNKNOWN_LAYER_PARENT' } as const;
        dependencies.push(part(layer.parentId));
      }
      if (layer.maskId) {
        if (layerIndex.get(layer.maskId)?.kind !== 'shape') return { ok: false, code: 'INVALID_LAYER_MASK' } as const;
        dependencies.push(part(layer.maskId));
      }
      if (layer.kind === 'composition') {
        if (!compositions.has(layer.compositionId)) {
          return { ok: false, code: 'UNKNOWN_NESTED_COMPOSITION' } as const;
        }
        dependencies.push(layer.compositionId);
      }
      graph.set(part(layer.id), dependencies);
    }
  }

  const order: string[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();
  function visit(id: string): boolean {
    if (visited.has(id)) return true;
    if (visiting.has(id)) return false;
    visiting.add(id);
    for (const target of graph.get(id)!.sort()) if (!visit(target)) return false;
    visiting.delete(id);
    visited.add(id);
    order.push(id);
    return true;
  }
  for (const id of [...graph.keys()].sort()) {
    if (!visit(id)) return { ok: false, code: 'COMPOSITION_DEPENDENCY_CYCLE' } as const;
  }
  return { ok: true, project, dependencyOrder: order } as const;
}

export function frameTime(
  frame: number, clock: Pick<CompositionProject, 'fps' | 'timebase'>,
) {
  if (!Number.isSafeInteger(frame) || frame < 0) throw new Error('INVALID_FRAME');
  const timebase = z.number().int().min(1).max(1000000).parse(clock.timebase);
  const rate = fps.parse(clock.fps);
  return { numerator: BigInt(frame) * BigInt(rate.denominator) * BigInt(timebase),
    denominator: BigInt(rate.numerator) };
}

export function layerContainsFrame(
  layer: Pick<z.infer<typeof Layer>, 'inTick' | 'outTick'>,
  frame: number, clock: Pick<CompositionProject, 'fps' | 'timebase'>,
) {
  const time = frameTime(frame, clock);
  const start = BigInt(Tick.parse(layer.inTick));
  const end = BigInt(Tick.parse(layer.outTick));
  if (start >= end) throw new Error('INVALID_LAYER_INTERVAL');
  return start * time.denominator <= time.numerator && time.numerator < end * time.denominator;
}
