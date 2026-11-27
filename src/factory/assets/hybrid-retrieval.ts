import { unitVector } from '../../llm/embeddings.js';
import type { RagCard } from './rag-compiler.js';
import { ScopedLexicalIndex } from './retrieval.js';

interface VectorRecord {
  cardId: string;
  scope: string;
  modelId: string;
  modelVersion: string;
  values: readonly number[];
}

type Access = Parameters<ScopedLexicalIndex['search']>[1];
const sameModel = (left: Pick<VectorRecord, 'modelId' | 'modelVersion'>, right: typeof left) =>
  left.modelId === right.modelId && left.modelVersion === right.modelVersion;
const compare = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;

export class ScopedHybridIndex {
  readonly #lexical;
  readonly #vectors = new Map<string, { card: RagCard; values: number[] }[]>();

  constructor(cards: readonly RagCard[], rows: readonly VectorRecord[],
    readonly model: Readonly<{ modelId: string; modelVersion: string; dimension: number }>) {
    if (!model.modelId || !model.modelVersion ||
        !Number.isInteger(model.dimension) || model.dimension < 1 || model.dimension > 4096) {
      throw new Error('INVALID_VECTOR_MODEL');
    }
    this.model = { ...model };
    this.#lexical = new ScopedLexicalIndex(cards);
    const cardIndex = new Map(cards.map((card) => [card.id, card]));
    const seen = new Set<string>();
    for (const row of rows) {
      if (!sameModel(row, this.model)) continue;
      const card = cardIndex.get(row.cardId);
      const values = unitVector(row.values, this.model.dimension);
      if (!card || card.scope !== row.scope || seen.has(row.cardId) || !values) {
        throw new Error('INVALID_VECTOR_RECORD');
      }
      seen.add(row.cardId);
      const partition = this.#vectors.get(row.scope) ?? [];
      partition.push({ card: structuredClone(card), values });
      this.#vectors.set(row.scope, partition);
    }
  }

  search(query: string, access: Access, vector?: Readonly<{
    modelId: string; modelVersion: string; values: readonly number[];
  }>, weights: Readonly<{ lexical: number; vector: number }> = { lexical: 1, vector: 1 }) {
    const limit = access.limit ?? 10;
    if (!access.authorizedScopes.has(access.scope)) return { mode: 'denied', hits: [] } as const;
    if (!Number.isInteger(limit) || limit < 1 || limit > 50 ||
        ![weights.lexical, weights.vector].every((w) => Number.isFinite(w) && w > 0 && w <= 10)) {
      return { mode: 'invalid_options', hits: [] } as const;
    }
    const lexical = this.#lexical.search(query, { ...access, limit: 50 });
    const fallback = (reason: 'vector_unavailable' | 'vector_invalid' | 'vector_no_match') =>
      ({ mode: 'lexical', reason, hits: lexical.slice(0, limit) } as const);
    if (!vector) return fallback('vector_unavailable');
    const direction = sameModel(vector, this.model) && unitVector(vector.values, this.model.dimension);
    if (!direction) return fallback('vector_invalid');
    const vectorHits = (this.#vectors.get(access.scope) ?? []).filter(({ card }) =>
      card.locale === access.locale && (access.bases?.has(card.basis) ?? card.basis !== 'proposed'))
      .map(({ card, values }) => ({ card, score: values.reduce((sum, value, index) => sum + value * direction[index], 0) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score || compare(a.card.id, b.card.id)).slice(0, 50);
    if (!vectorHits.length) return fallback('vector_no_match');

    const fused = new Map<string, { card: RagCard; score: number; lexicalRank?: number; vectorRank?: number }>();
    for (const [hits, bias, channel] of [
      [lexical, weights.lexical, 'lexicalRank'], [vectorHits, weights.vector, 'vectorRank'],
    ] as const) {
      for (const [index, { card }] of hits.entries()) {
        const position = index + 1;
        const hit = fused.get(card.id) ?? { card, score: 0 };
        hit.score += bias / (60 + position);
        hit[channel] = position;
        fused.set(card.id, hit);
      }
    }
    const ordered = [...fused.values()].sort((a, b) => b.score - a.score || compare(a.card.id, b.card.id));
    const seen = new Set<string>();
    const hits = [];
    for (const hit of ordered) {
      if (seen.has(hit.card.visualId)) continue;
      seen.add(hit.card.visualId);
      hits.push({ ...structuredClone(hit), rank: hits.length + 1 });
      if (hits.length === limit) break;
    }
    return { mode: 'hybrid', hits } as const;
  }
}
