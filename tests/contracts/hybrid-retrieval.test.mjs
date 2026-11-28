import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ScopedHybridIndex } from '../../dist/index.js';

const model = { modelId: 'mock', modelVersion: '1', dimension: 2 };
const card = (id, title, scope = 'alpha') => ({
  id, title, scope, visualId: id, locale: 'es', basis: 'observed', text: '', evidenceIds: [],
});
const cards = [card('a', 'Cerámica'), card('b', 'Esfera'), card('foreign', 'Cerámica', 'beta')];
const row = (card, values) => ({
  ...model, cardId: card.id, scope: card.scope, values,
});
const rows = [row(cards[0], [1, 0]), row(cards[1], [2, 1]), row(cards[2], [1, 0])];
const settings = { scope: 'alpha', authorizedScopes: new Set(['alpha']), locale: 'es' };

test('performs reciprocal rank fusion only inside the authorized scope', () => {
  const index = new ScopedHybridIndex(cards, rows, model);
  const result = index.search('ceramica', settings, { ...model, values: [1, 0] });
  assert.equal(result.mode, 'hybrid');
  assert.deepEqual(result.hits.map((hit) => [hit.card.id, hit.lexicalRank, hit.vectorRank]),
    [['a', 1, 1], ['b', undefined, 2]]);
  assert.equal(result.hits[0].score, 2 / 61);
  assert.deepEqual(index.search('ceramica', { ...settings, scope: 'beta' }).hits, []);
  assert.throws(() => new ScopedHybridIndex(cards, [{ ...rows[0], scope: 'beta' }], model), /INVALID_VECTOR_RECORD/u);
});

test('model mismatch or unavailable vector falls back to lexical explicitly', () => {
  const index = new ScopedHybridIndex(cards, rows, model);
  assert.equal(index.search('ceramica', settings).reason, 'vector_unavailable');
  const output = index.search('ceramica', settings, { ...model, modelVersion: '2', values: [1, 0] });
  assert.equal(output.mode, 'lexical');
  assert.equal(output.reason, 'vector_invalid');
  assert.equal(output.hits[0].card.id, 'a');
});

test('applies negative terms to vector matches and abstains without a positive query', () => {
  const index = new ScopedHybridIndex(cards, rows, model);
  const vector = { ...model, values: [1, 0] };
  assert.deepEqual(index.search('ceramica -esfera', settings, vector).hits.map(({ card }) => card.id), ['a']);
  assert.deepEqual(index.search('-esfera', settings, vector).hits, []);
});
