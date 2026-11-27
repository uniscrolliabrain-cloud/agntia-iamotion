import { buildScopedVisualBrief, compileRag, ScopedLexicalIndex } from '../../dist/index.js';

const evidence = {
  schemaVersion: 1, evidenceId: 'fixture:mail-intent', kind: 'prompt',
  sourceHash: 'a'.repeat(64), method: 'synthetic-fixture',
};
const source = {
  locale: 'es', title: 'Correo cerámico',
  claim: {
    schemaVersion: 1, claimId: 'c_' + 'a'.repeat(64),
    visualId: 'v_9d7cbaa0-c4c9-4f0e-a193-a97ad9f812c3',
    facet: 'material', predicate: 'surface', value: 'Cerámica marfil', basis: 'source-spec',
    evidenceIds: [evidence.evidenceId], confidence: 'low', reviewStatus: 'approved', revision: 1,
  },
};
const partition = async (scope, sources) => {
  const result = await compileRag({ schemaVersion: 1, scope, sources, evidence: [evidence] });
  if (!result.ok) throw new Error(result.code);
  return result;
};
const primary = await partition('synthetic', [source]);
const foreign = await partition('synthetic-other', [{ ...source, title: 'Segundo corpus' }]);
const index = new ScopedLexicalIndex([...primary.cards, ...foreign.cards]);
const access = {
  scope: 'synthetic', authorizedScopes: new Set(['synthetic']), locale: 'es',
  approvedAssetsByVisualId: new Map(), characterBudget: 512,
};
const brief = buildScopedVisualBrief(index, 'ceramica', access);
const denied = buildScopedVisualBrief(index, 'segundo', { ...access, scope: 'synthetic-other' });
if (brief.status !== 'ready' || brief.candidates.length !== 1 || brief.approvedAssetIds.length ||
    denied.status !== 'insufficient_context') throw new Error('SYNTHETIC_BRIEF_SMOKE_FAILED');
console.log(JSON.stringify({ schemaVersion: 1, sampleKind: 'synthetic', cards: primary.cards,
  reverseIndex: primary.reverseIndex, brief, denied: denied.status }, null, 2));
