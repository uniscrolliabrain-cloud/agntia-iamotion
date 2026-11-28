import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { PromptLexicon, VisualOntology } from '../../dist/index.js';

const data = JSON.parse(await readFile(new URL('../../library/taxonomy/lexicon.v2.json', import.meta.url), 'utf8'));
const parser = new PromptLexicon(new VisualOntology(data));

test('prompt intent preserves negation, bilingual spelling and original Unicode offsets', () => {
  const prompt = '🟣 Cera\u0301mica marfil, evitar latón y papel; violet light. No glass, but enamel.';
  const matches = parser.extract(prompt);
  assert.deepEqual(matches.map(({ termIds, polarity }) => [termIds, polarity]), [
    [['material.ceramic'], 'positive'], [['color.ivory'], 'positive'], [['material.brass'], 'negative'],
    [['material.paper'], 'negative'], [['color.violet'], 'positive'], [['material.glass'], 'negative'],
    [['material.enamel'], 'positive'],
  ]);
  for (const mention of matches) {
    assert.equal(prompt.slice(mention.start, mention.end), mention.text);
    assert.equal(mention.basis, 'source-spec');
  }
});

test('multiword aliases and ambiguous or qualified phrases are preserved for review', () => {
  const matches = parser.extract('evitar cerámica; no solo papel, sin embargo editorial. Cámara tres cuartos.');
  assert.deepEqual(matches.map(({ termIds, polarity }) => [termIds, polarity]), [
    [['material.ceramic'], 'negative'],
    [['material.paper'], 'uncertain'],
    [['style.editorial', 'ux.editorial'], 'uncertain'],
    [['composition.three-quarter'], 'positive'],
  ]);
});
