import { z } from 'zod';
import { ClaimSchema, EvidenceSchema } from './schemas/index.js';

const Token = z.string().regex(/^[a-zA-Z0-9_.:/-]{1,192}$/u);
const Locale = z.enum(['es', 'en']);
const Scope = z.string().regex(/^[a-z0-9][a-z0-9-]{0,95}$/u);
const Source = z.strictObject({
  locale: Locale, title: z.string().min(1).max(160), claim: ClaimSchema,
});
const Input = z.strictObject({
  schemaVersion: z.literal(1), scope: Scope, sources: z.array(Source).max(10000),
  evidence: z.array(EvidenceSchema).max(10000),
});
const Previous = z.strictObject({
  scope: Scope, id: Token, contentHash: z.string().regex(/^[a-f0-9]{64}$/u),
});
export type RagCard = {
  id: string;
  scope: string;
  visualId: string;
  facet: string;
  locale: 'es' | 'en';
  basis: z.infer<typeof ClaimSchema>['basis'];
  revision: number;
  title: string;
  text: string;
  conflicting: boolean;
  claimIds: string[];
  evidenceIds: string[];
  contentHash: string;
};

type SourceRecord = z.infer<typeof Source>;
const compare = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;
const localized = {
  es: { alternatives: 'Afirmaciones en conflicto', proposed: 'Propuesta', values: 'Afirmaciones' },
  en: { alternatives: 'Conflicting claims', proposed: 'Proposal', values: 'Claims' },
};
async function digest(value: string) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bytes), (x) => x.toString(16).padStart(2, '0')).join('');
}

export async function compileRag(input: unknown, previousInput: unknown = []) {
  const parsed = Input.safeParse(input);
  const previousParsed = z.array(Previous).max(10000).safeParse(previousInput);
  if (!parsed.success || !previousParsed.success) return { ok: false, code: 'INVALID_RAG_INPUT' } as const;
  const { sources, evidence, scope } = parsed.data;
  const previous = previousParsed.data;
  const evidenceIndex = new Map(evidence.map((item) => [item.evidenceId, item]));
  if (evidenceIndex.size !== evidence.length) return { ok: false, code: 'DUPLICATE_RAG_EVIDENCE' } as const;
  const groups = new Map<string, SourceRecord[]>();
  const seenClaims = new Set<string>();

  for (const source of sources) {
    const { claim, locale } = source;
    if (claim.reviewStatus !== 'approved') continue;
    const localizedClaim = JSON.stringify([claim.claimId, locale]);
    if (seenClaims.has(localizedClaim)) return { ok: false, code: 'DUPLICATE_RAG_CLAIM' } as const;
    seenClaims.add(localizedClaim);
    const origins = claim.evidenceIds.map((id) => evidenceIndex.get(id));
    if (origins.some((record) => !record) ||
        (claim.basis === 'observed' && !origins.some((record) => record?.kind === 'inspection')) ||
        (claim.basis === 'measured' && !origins.some((record) => record?.kind === 'measurement'))) {
      return { ok: false, code: 'RAG_EVIDENCE_INSUFFICIENT' } as const;
    }
    const groupKey = JSON.stringify([claim.visualId, claim.facet, locale, claim.basis]);
    const group = groups.get(groupKey) ?? [];
    group.push(source);
    groups.set(groupKey, group);
  }

  const cards: RagCard[] = [];
  const references = new Map<string, string[]>();
  for (const group of groups.values()) {
    group.sort((a, b) => compare(a.claim.claimId, b.claim.claimId));
    const first = group[0];
    const { visualId, facet, basis } = first.claim;
    const { locale, title } = first;
    if (group.some((item) => item.title !== title)) return { ok: false, code: 'RAG_TITLE_CONFLICT' } as const;
    const alternatives = new Map<string, Set<string>>();
    for (const { claim } of group) {
      const values = alternatives.get(claim.predicate) ?? new Set<string>();
      values.add(JSON.stringify([claim.value, claim.unit ?? null]));
      alternatives.set(claim.predicate, values);
    }
    const conflicting = [...alternatives.values()].some((values) => values.size > 1);
    const labels = localized[locale];
    const heading = basis === 'proposed' ? labels.proposed : labels.values;
    const rows = group.map(({ claim }) =>
      `${claim.predicate}: ${JSON.stringify(claim.value)}${claim.unit ? ' ' + claim.unit : ''}`);
    const evidenceIds = [...new Set(group.flatMap(({ claim }) => claim.evidenceIds))].sort(compare);
    const id = 'rag:' + await digest(JSON.stringify([scope, visualId, facet, locale, basis]));
    const card = {
      id, scope, visualId, facet, locale, basis,
      revision: Math.max(...group.map(({ claim }) => claim.revision)),
      title, text: [heading, ...(conflicting ? [labels.alternatives] : []), ...new Set(rows)].join('\n'),
      conflicting, claimIds: group.map(({ claim }) => claim.claimId), evidenceIds,
    };
    const evidenceDigest = await digest(JSON.stringify(evidenceIds.map((value) => evidenceIndex.get(value))));
    cards.push({ ...card, contentHash: await digest(JSON.stringify({ card, evidenceDigest })) });
    for (const evidenceId of evidenceIds) {
      const ids = references.get(evidenceId) ?? [];
      ids.push(id);
      references.set(evidenceId, ids);
    }
  }

  cards.sort((a, b) => compare(a.id, b.id));
  const previousInScope = new Map(previous.filter((card) => card.scope === scope).map((card) => [card.id, card.contentHash]));
  const retained = new Set(cards.map((card) => card.id));
  const changed = cards.filter((card) => previousInScope.get(card.id) !== card.contentHash).map(({ id }) => id);
  const tombstones = [...previousInScope.keys()].filter((id) => !retained.has(id)).sort(compare);
  const reverseIndex = Object.fromEntries([...references].sort(([a], [b]) => compare(a, b))
    .map(([id, cards]) => [id, cards.sort(compare)]));
  return { ok: true, scope, cards, changed, tombstones, reverseIndex } as const;
}
