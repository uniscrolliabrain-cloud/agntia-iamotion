import { z } from 'zod';

const Id = z.string().min(1).max(120).regex(/^[a-z0-9-]+$/u);
const Note = z.string().min(1).max(1024);
const Family = z.strictObject({
  id: Id, collection: Id, purpose: Note, paletteIntent: z.array(Note).min(1).max(32),
  materialIntent: z.array(Note).min(1).max(32), composition: Note, lighting: Note,
  forbidden: z.array(Note).max(32), exceptions: z.array(Note).max(32),
  candidateExamples: z.array(Id).max(64), approvedExamples: z.array(Id).max(64),
  sourceRefs: z.array(Note).min(1).max(32),
});
const Rule = z.strictObject({
  from: Id, to: Id, context: Id, disposition: z.enum(['reference-only', 'incompatible']), reason: Note,
});
const Manifest = z.strictObject({
  schemaVersion: z.literal(1), families: z.array(Family).max(128), rules: z.array(Rule).max(1024),
});
const key = (from: string, to: string, context: string) => JSON.stringify([from, to, context]);

export class StyleFamilies {
  readonly #families: Map<string, z.infer<typeof Family>>;
  readonly #rules: Map<string, z.infer<typeof Rule>>;

  constructor(input: unknown, cards: readonly { id: string; collection: string }[]) {
    const data = Manifest.parse(input);
    const catalogue = new Map(cards.map(({ id, collection }) => [id, collection]));
    this.#families = new Map(data.families.map((family) => [family.id, family]));
    this.#rules = new Map(data.rules.map((rule) => [key(rule.from, rule.to, rule.context), rule]));
    if (this.#families.size !== data.families.length || this.#rules.size !== data.rules.length ||
        new Set(data.families.map(({ collection }) => collection)).size !== data.families.length) {
      throw new Error('DUPLICATE_STYLE_MAPPING');
    }
    for (const family of data.families) {
      if (family.approvedExamples.length) throw new Error('STYLE_APPROVAL_REQUIRES_REVIEW_LEDGER');
      for (const example of family.candidateExamples) {
        if (catalogue.get(example) !== family.collection) throw new Error('STYLE_EXAMPLE_MISMATCH');
      }
    }
    for (const rule of data.rules) {
      if (!this.#families.has(rule.from) || !this.#families.has(rule.to) || rule.from === rule.to) {
        throw new Error('INVALID_STYLE_RULE');
      }
    }
  }

  get(id: string) {
    const family = this.#families.get(id);
    return family ? structuredClone(family) : undefined;
  }

  compatibility(from: string, to: string, context: string) {
    const rule = this.#rules.get(key(from, to, context));
    if (rule) return { disposition: rule.disposition, reason: rule.reason };
    return { disposition: 'review-required' as const, reason: 'Sin regla para este contexto.' };
  }
}
