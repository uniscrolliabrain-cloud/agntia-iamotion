import type { VisualCatalog } from './catalog.js';
import type { ScopedLexicalIndex } from './retrieval.js';
export function buildVisualBrief(catalog:VisualCatalog,query:string){
 return {query,candidates:catalog.search(query).map(({card,score,assets})=>({id:card.id,title:card.title,description:card.description,basis:card.basis,score,assetIds:assets.map(a=>a.id),status:'reference-only'})),approvedAssetIds:[] as string[]};
}

export interface ScopedBriefAccess {
  scope: string;
  authorizedScopes: ReadonlySet<string>;
  locale: 'es' | 'en';
  approvedAssetsByVisualId: ReadonlyMap<string, readonly string[]>;
  characterBudget: number;
}

export function buildScopedVisualBrief(index: ScopedLexicalIndex, query: string, access: ScopedBriefAccess) {
  const candidates = [];
  const approved = new Set<string>();
  let remaining = access.characterBudget;
  if (!Number.isSafeInteger(remaining) || remaining < 0 || remaining > 16000) {
    return { status: 'insufficient_context', reason: 'invalid_budget',
      candidates: [], approvedAssetIds: [] } as const;
  }
  for (const { card, score } of index.search(query, { ...access, limit: 20 })) {
    if (card.conflicting || card.evidenceIds.length === 0) continue;
    const cost = card.title.length + card.text.length;
    if (cost > remaining) continue;
    remaining -= cost;
    candidates.push({
      referenceId: card.id, visualId: card.visualId, title: card.title, text: card.text,
      basis: card.basis, evidenceIds: card.evidenceIds, score, status: 'reference-only' as const,
    });
    for (const asset of access.approvedAssetsByVisualId.get(card.visualId) ?? []) {
      if (/^[a-f0-9]{64}$/u.test(asset)) approved.add(asset);
    }
  }
  return {
    status: candidates.length ? 'ready' as const : 'insufficient_context' as const,
    candidates,
    approvedAssetIds: [...approved].sort(),
    usedCharacters: access.characterBudget - remaining,
  };
}
