import type { VisualOntology } from './ontology.js';

type Polarity = 'positive' | 'negative' | 'uncertain';
type Token = { key: string; offset: number; end: number };
const normalize = (value: string) => value.normalize('NFKD').toLowerCase().replace(/\p{M}/gu, '');
const tokenize = (input: string): Token[] => Array.from(input.matchAll(/[\p{L}\p{N}][\p{L}\p{M}\p{N}]*|[.;!?\n]/gu),
  (match) => ({ key: normalize(match[0]), offset: match.index, end: match.index + match[0].length }));
const boundaries = new Set(['.', ';', '!', '?', '\n']);
const negate = new Set(['no', 'sin', 'without', 'avoid', 'evita', 'evitar', 'exclude', 'excluir', 'never', 'nunca']);
const reset = new Set(['pero', 'but', 'however', 'aunque', 'although']);
const uncertain = new Set(['quizas', 'quiza', 'talvez', 'maybe', 'possibly', 'posiblemente']);
const maxTermTokens = 16;

export class PromptLexicon {
  readonly #terms = new Map<string, Set<string>>();

  constructor(ontology: VisualOntology) {
    for (const locale of ['es', 'en'] as const) {
      for (const [label, ids] of Object.entries(ontology.aliasIndex(locale))) {
        const key = tokenize(label).map((part) => part.key).join(' ');
        const candidates = this.#terms.get(key) ?? new Set<string>();
        for (const id of ids) candidates.add(id);
        this.#terms.set(key, candidates);
      }
    }
  }

  extract(prompt: string) {
    if (typeof prompt !== 'string' || prompt.length > 65536) throw new Error('PROMPT_TEXT_LIMIT');
    const tokens = tokenize(prompt);
    let polarity: Polarity = 'positive';
    const mentions = [];
    let i = 0;
    while (i < tokens.length) {
      const token = tokens[i];
      const next = tokens[i + 1]?.key;
      if (token.key === 'sin' && next === 'embargo') {
        polarity = 'positive';
        i += 2;
        continue;
      }
      if (boundaries.has(token.key) || reset.has(token.key)) {
        polarity = 'positive';
        i++;
        continue;
      }
      if (uncertain.has(token.key) || (token.key === 'no' && ['solo', 'only'].includes(next))) {
        polarity = 'uncertain';
        i += token.key === 'no' ? 2 : 1;
        continue;
      }
      if (negate.has(token.key)) {
        polarity = polarity === 'positive' ? 'negative' : 'uncertain';
        i++;
        continue;
      }

      let key = '';
      let match: { ids: Set<string>; end: number; index: number } | undefined;
      for (let j = i; j < Math.min(tokens.length, i + maxTermTokens); j++) {
        if (j > i && !/^[-\s]+$/u.test(prompt.slice(tokens[j - 1].end, tokens[j].offset))) break;
        key += (key ? ' ' : '') + tokens[j].key;
        const ids = this.#terms.get(key);
        if (ids) match = { ids, end: tokens[j].end, index: j };
      }
      if (match) {
        const ids = [...match.ids].sort();
        mentions.push({
          start: token.offset, end: match.end, text: prompt.slice(token.offset, match.end),
          termIds: ids, polarity: ids.length > 1 ? 'uncertain' as const : polarity,
          basis: 'source-spec' as const,
        });
      }
      i = match ? match.index + 1 : i + 1;
    }
    return mentions;
  }
}
