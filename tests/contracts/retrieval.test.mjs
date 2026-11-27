import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ScopedLexicalIndex } from '../../dist/index.js';

const card = (id, patch = {}) => ({
  id, scope: 'tenant-a', visualId: id, locale: 'es', basis: 'observed', facet: 'material',
  title: 'Cerámica', text: 'Marfil brillante', claimIds: [], evidenceIds: ['fixture:note'],
  ...patch,
});
const options = { authorizedScopes: new Set(['tenant-a']), scope: 'tenant-a', locale: 'es' };
const relevant = [card('b'), card('a'), card('alternate', { visualId: 'a' })];

test('authorized-only ranking is unchanged by adding a different scope', () => {
  const baseline = new ScopedLexicalIndex(relevant).search('ceramica', options);
  const foreign = Array.from({ length: 20 }, (_, index) =>
    card(`private-${index}`, { scope: 'tenant-b', title: 'Another title' }));
  const combined = new ScopedLexicalIndex([...foreign, ...relevant]);
  assert.deepEqual(combined.search('ceramica', options), baseline);
  assert.deepEqual(baseline.map(({ card }) => card.id), ['a', 'b']);
  assert.deepEqual(combined.search('title', { ...options, scope: 'tenant-b' }), []);
});

test('excludes explicit negative terms and proposed content by default', () => {
  const index = new ScopedLexicalIndex([card('a'), card('b', { text: 'Papel mate' }),
    card('draft', { title: 'Cerámica', text: 'Papel', basis: 'proposed' })]);
  assert.deepEqual(index.search('cerámica -brillante', options).map(({ card }) => card.id), ['b']);
  assert.deepEqual(index.search('-brillante', options), []);
  assert.deepEqual(index.search('papel', options).map(({ card }) => card.id), ['b']);
  const proposed = { ...options, bases: new Set(['proposed']) };
  assert.deepEqual(index.search('papel', proposed).map(({ card }) => card.id), ['draft']);
});
