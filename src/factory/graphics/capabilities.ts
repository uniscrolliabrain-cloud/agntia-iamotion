import { validateCompositionProject } from './composition.js';

type Feature = 'shape' | 'text' | 'asset' | 'nested' | 'mask' | 'parent';
export interface GraphicsRendererProfile {
  id: string;
  version: string;
  features: ReadonlySet<Feature>;
}

export function negotiateGraphicsRenderer(input: unknown, renderer: GraphicsRendererProfile) {
  const result = validateCompositionProject(input);
  if (!result.ok) return result;
  const index = new Map(result.project.compositions.map((composition) => [composition.id, composition]));
  const visited = new Set<string>();
  const needs = new Set<Feature>();
  const queue = [result.project.rootId];
  for (const id of queue) {
    if (visited.has(id)) continue;
    visited.add(id);
    for (const layer of index.get(id)!.layers) {
      if (layer.kind !== 'group') needs.add(layer.kind === 'composition' ? 'nested' : layer.kind);
      if (layer.kind === 'composition') queue.push(layer.compositionId);
      if (layer.maskId) needs.add('mask');
      if (layer.parentId) needs.add('parent');
    }
  }
  const required = [...needs].sort();
  const missing = required.filter((feature) => !renderer.features.has(feature));
  const rendererId = { id: renderer.id, version: renderer.version };
  if (missing.length) return { ok: false, code: 'RENDER_FEATURE_UNSUPPORTED', renderer: rendererId, required, missing } as const;
  return { ok: true, renderer: rendererId, required } as const;
}
