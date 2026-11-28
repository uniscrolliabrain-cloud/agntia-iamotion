import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { PromptLexicon, VisualOntology } from '../../dist/index.js';

const inputs = {};
async function load(path) {
  const bytes = await readFile(new URL(`../../${path}`, import.meta.url));
  inputs[path] = createHash('sha256').update(bytes).digest('hex');
  return JSON.parse(bytes.toString('utf8'));
}

const parser = new PromptLexicon(new VisualOntology(await load('library/taxonomy/lexicon.v2.json')));
const cards = [];
for (const sourcePath of ['library/cards/formation-automation.json',
  'library/cards/launcher-v3.json', 'library/cards/mi-empresa-v1.json']) {
  for (const card of await load(sourcePath)) {
    const prompt = card.prompt ?? card.generationSpec?.prompt;
    const sections = [];
    if (typeof prompt === 'string' && prompt.length) sections.push({
      scope: 'asset-prompt', field: card.prompt === prompt ? 'prompt' : 'generationSpec.prompt',
      mentions: parser.extract(prompt),
    });
    for (const [field, value] of Object.entries(card.artDirection ?? {}).sort()) {
      if (typeof value === 'string' && value.length) sections.push({
        scope: 'art-direction', field: `artDirection.${field}`, mentions: parser.extract(value),
      });
    }
    cards.push({ id: card.id, sourcePath, sections, status: sections.length ? 'candidate' : 'no-prompt' });
  }
}
const counts = { cards: cards.length, missing: 0, positive: 0, negative: 0, uncertain: 0 };
for (const card of cards) {
  if (!card.sections.length) counts.missing++;
  for (const section of card.sections) {
    for (const { polarity } of section.mentions) counts[polarity]++;
  }
}
console.log(JSON.stringify({ schemaVersion: 1, inputHashes: inputs, counts, cards }, null, 2));
