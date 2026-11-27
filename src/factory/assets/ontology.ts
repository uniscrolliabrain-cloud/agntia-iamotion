import { z } from 'zod';

const Token = z.string().regex(/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/u).max(96);
const Text = z.string().trim().min(1).max(512);
const Localized = z.strictObject({ es: Text, en: Text });
const Aliases = z.array(Text).max(64);
const Term = z.strictObject({
  id: Token,
  facet: Token,
  label: Localized,
  aliases: z.strictObject({ es: Aliases, en: Aliases }),
  definition: Localized,
  parentId: Token.nullable(),
  status: z.enum(['active', 'deprecated']),
  replacementId: Token.nullable(),
});
const Ontology = z.strictObject({ version: z.literal(2), terms: z.array(Term).max(2048) });

export type OntologyTerm = z.infer<typeof Term>;
type Locale = keyof OntologyTerm['label'];
const normalize = (value: string) => value.normalize('NFKD').toLowerCase()
  .replace(/\p{M}/gu, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const locales: readonly Locale[] = ['es', 'en'];

function assertAcyclic(terms: Map<string, OntologyTerm>, field: 'parentId' | 'replacementId') {
  const checked = new Set<string>();
  for (const id of terms.keys()) {
    const path = new Set<string>();
    let next: string | null = id;
    while (next !== null && !checked.has(next)) {
      if (path.has(next)) throw new Error(`ONTOLOGY_CYCLE:${field}:${next}`);
      path.add(next);
      const term = terms.get(next);
      if (!term) throw new Error(`ONTOLOGY_UNKNOWN_REFERENCE:${field}:${next}`);
      next = term[field];
    }
    for (const visited of path) checked.add(visited);
  }
}

export class VisualOntology {
  readonly terms: ReadonlyMap<string, OntologyTerm>;
  readonly #aliases: Record<Locale, Map<string, Set<string>>> = { es: new Map(), en: new Map() };

  constructor(input: unknown) {
    const { terms } = Ontology.parse(input);
    const index = new Map<string, OntologyTerm>();
    for (const term of terms) {
      if (index.has(term.id)) throw new Error(`ONTOLOGY_DUPLICATE_ID:${term.id}`);
      if (!term.id.startsWith(`${term.facet}.`)) throw new Error(`ONTOLOGY_FACET_MISMATCH:${term.id}`);
      if (term.status === 'active' && term.replacementId !== null) {
        throw new Error(`ONTOLOGY_ACTIVE_REPLACEMENT:${term.id}`);
      }
      index.set(term.id, term);
      for (const locale of locales) {
        for (const alias of [term.label[locale], ...term.aliases[locale]]) {
          const key = normalize(alias);
          if (!key) throw new Error(`ONTOLOGY_EMPTY_ALIAS:${term.id}`);
          const ids = this.#aliases[locale].get(key) ?? new Set<string>();
          ids.add(term.id);
          this.#aliases[locale].set(key, ids);
        }
      }
    }
    assertAcyclic(index, 'parentId');
    assertAcyclic(index, 'replacementId');
    this.terms = index;
  }

  lookup(label: string, locale: Locale, facet?: string): readonly string[] {
    const ids = [...(this.#aliases[locale].get(normalize(label)) ?? [])];
    return ids.filter((id) => facet === undefined || this.terms.get(id)?.facet === facet).sort();
  }

  aliasIndex(locale: Locale) {
    return Object.fromEntries([...this.#aliases[locale].keys()].sort().map((label) =>
      [label, this.lookup(label, locale)]));
  }
}
