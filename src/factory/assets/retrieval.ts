import type { RagCard } from './rag-compiler.js';

type Field = 'title' | 'body';
const weights: Record<Field, number> = { title: 4, body: 1 };
const fields = ['title', 'body'] as const;
export const tokenizeSearchText = (value: string) => value.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase()
  .match(/[\p{L}\p{N}]+/gu) ?? [];
export function parseSearchQuery(query: string) {
  if (typeof query !== 'string' || query.length > 512) return null;
  const exclusion = /(?:^|\s)-([\p{L}\p{M}\p{N}]+)(?=\s|$)/gu;
  const negative = [...new Set([...query.matchAll(exclusion)].flatMap((match) => tokenizeSearchText(match[1])))];
  const positive = [...new Set(tokenizeSearchText(query.replace(exclusion, ' ')))];
  return positive.length ? { positive, negative } : null;
}
const compare = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;

interface Partition {
  documents: Posting[];
  inverted: Record<Field, Map<string, Posting[]>>;
}

interface Posting {
  card: RagCard;
  fieldLengths: Record<Field, number>;
  terms: Record<Field, Map<string, number>>;
}

function count(tokens: string[]) {
  const values = new Map<string, number>();
  for (const term of tokens) values.set(term, (values.get(term) ?? 0) + 1);
  return values;
}

export class ScopedLexicalIndex {
  readonly #partitions = new Map<string, Partition>();

  constructor(cards: readonly RagCard[]) {
    const ids = new Set<string>();
    for (const card of cards) {
      if (ids.has(card.id)) throw new Error('DUPLICATE_RAG_CARD');
      ids.add(card.id);
      const title = tokenizeSearchText(card.title);
      const body = tokenizeSearchText(card.text);
      const partition: Partition = this.#partitions.get(card.scope) ??
        { documents: [], inverted: { title: new Map(), body: new Map() } };
      const posting: Posting = {
        card: structuredClone(card), fieldLengths: { title: title.length, body: body.length },
        terms: { title: count(title), body: count(body) },
      };
      partition.documents.push(posting);
      for (const field of fields) {
        for (const term of posting.terms[field].keys()) {
          const matching = partition.inverted[field].get(term) ?? [];
          matching.push(posting);
          partition.inverted[field].set(term, matching);
        }
      }
      this.#partitions.set(card.scope, partition);
    }
  }

  search(
    query: string,
    options: { authorizedScopes: ReadonlySet<string>; scope: string; locale: RagCard['locale'];
      bases?: ReadonlySet<RagCard['basis']>; limit?: number },
  ) {
    if (!options.authorizedScopes.has(options.scope)) return [];
    const { scope, locale, bases } = options;
    if (typeof query !== 'string' || query.length > 512 ||
        !Number.isInteger(options.limit ?? 10) || (options.limit ?? 10) < 1) return [];
    const limit = Math.min(50, options.limit ?? 10);
    const parsed = parseSearchQuery(query);
    if (!parsed) return [];
    const { positive, negative } = parsed;

    const partition = this.#partitions.get(scope);
    if (!partition) return [];
    const postings = new Set(partition.documents.filter(({ card }) =>
      card.locale === locale && (bases?.has(card.basis) ?? card.basis !== 'proposed')));
    const n = postings.size;
    if (!n) return [];
    const scores = new Map<Posting, Record<Field, number>>();
    const total = (score: Record<Field, number>) => score.title + score.body;
    for (const field of fields) {
      const meanLength = [...postings].reduce((sum, posting) => sum + posting.fieldLengths[field], 0) / n;
      if (!meanLength) continue;
      for (const term of positive) {
        const available = (partition.inverted[field].get(term) ?? []).filter((posting) => postings.has(posting));
        const df = available.length;
        const idf = Math.log1p((n - df + .5) / (df + .5));
        for (const posting of available) {
          const frequency = posting.terms[field].get(term)!;
          const normalization = 1.2 * (.25 + .75 * posting.fieldLengths[field] / meanLength);
          const score = weights[field] * idf * (frequency * 2.2) / (frequency + normalization);
          const breakdown = scores.get(posting) ?? { title: 0, body: 0 };
          breakdown[field] += score;
          scores.set(posting, breakdown);
        }
      }
    }
    const ordered = [...scores].filter(([posting]) => !negative.some(
      (term) => fields.some((field) => posting.terms[field].has(term)),
    )).sort(([a, scoreA], [b, scoreB]) => total(scoreB) - total(scoreA) || compare(a.card.id, b.card.id));

    const seen = new Set<string>();
    const results = [];
    for (const [posting, breakdown] of ordered) {
      if (seen.has(posting.card.visualId)) continue;
      seen.add(posting.card.visualId);
      results.push({ card: structuredClone(posting.card), score: total(breakdown), breakdown, rank: results.length + 1 });
      if (results.length === limit) break;
    }
    return results;
  }
}
