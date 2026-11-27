import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildScopedVisualBrief, ScopedLexicalIndex } from '../../dist/index.js';

const authorizes = 'a'.repeat(64);
const card = {
  id: 'rag:mail', visualId: 'mail', scope: 'demo', title: 'Correo', text: 'Cerámica marfil',
  locale: 'es', basis: 'source-spec', evidenceIds: ['fixture:prompt'], conflicting: false,
};
const access = {
  scope: 'demo', authorizedScopes: new Set(['demo']), locale: 'es',
  approvedAssetsByVisualId: new Map(), characterBudget: 100,
};

test('brief cites scope-authorized references and never promotes retrieval hits to approved assets', () => {
  const index = new ScopedLexicalIndex([card]);
  const brief = buildScopedVisualBrief(index, 'correo', access);
  assert.equal(brief.status, 'ready');
  assert.deepEqual(brief.candidates[0].evidenceIds, ['fixture:prompt']);
  assert.equal(brief.candidates[0].status, 'reference-only');
  assert.deepEqual(brief.approvedAssetIds, []);
  const allowed = buildScopedVisualBrief(index, 'correo',
    { ...access, approvedAssetsByVisualId: new Map([['mail', [authorizes, 'unverified']]]) });
  assert.deepEqual(allowed.approvedAssetIds, [authorizes]);
});

test('brief abstains on scope denial, conflict or insufficient budget', () => {
  const index = new ScopedLexicalIndex([card]);
  const query = 'correo';
  assert.equal(buildScopedVisualBrief(index, query, { ...access, authorizedScopes: new Set() }).status,
    'insufficient_context');
  assert.equal(buildScopedVisualBrief(index, query, { ...access, characterBudget: 1 }).status,
    'insufficient_context');
  assert.equal(buildScopedVisualBrief(new ScopedLexicalIndex([{ ...card, conflicting: true }]),
    query, access).status, 'insufficient_context');
});
