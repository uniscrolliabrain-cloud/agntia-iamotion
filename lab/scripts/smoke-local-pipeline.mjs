import { readFile } from 'node:fs/promises';
import { readRagCorpus } from './rag-corpus-store.mjs';
import { runLocalPipeline } from './run-local-pipeline.mjs';
import { buildScopedVisualBrief, ScopedLexicalIndex } from '../../dist/index.js';
import { evaluateRetrieval } from './evaluate-retrieval.mjs';

const { snapshotId } = JSON.parse(await readFile('lab/staging/rag-durable.json', 'utf8'));
const stages = [
  { id: 'corpus', handler: 'read', input: { snapshotId }, dependsOn: [] },
  { id: 'brief', handler: 'brief', input: { query: 'ceramica' }, dependsOn: ['corpus'] },
  { id: 'evaluation', handler: 'evaluate', input: null, dependsOn: ['brief'] },
].map((entry) => ({ ...entry, version: 'v1', timeoutMs: 3000 }));
const handlers = new Map([
  ['read', async ({ input }) => (await readRagCorpus('lab/staging/rag-corpora', input.snapshotId, 'synthetic')).cards],
  ['brief', ({ input, dependencies }) => buildScopedVisualBrief(
    new ScopedLexicalIndex(dependencies.get('corpus')), input.query,
    { scope: 'synthetic', authorizedScopes: new Set(['synthetic']), locale: 'es',
      approvedAssetsByVisualId: new Map(), characterBudget: 512 },
  )],
  ['evaluate', ({ dependencies }) => {
    const brief = dependencies.get('brief');
    if (brief.status !== 'ready') throw new Error('SYNTHETIC_BRIEF_FAILED');
    return evaluateRetrieval({
      schemaVersion: 1, judgmentSource: 'synthetic',
      queries: [{ id: 'match', split: 'test', judgments: [
        { visualId: 'v_9d7cbaa0-c4c9-4f0e-a193-a97ad9f812c3', relevance: 3 },
      ] }],
    }, { match: brief.candidates.map(({ visualId }) => visualId) });
  }],
]);
const plan = { schemaVersion: 1, stages };
const cache = new Map();
const result = await runLocalPipeline(plan, handlers, { cache });
const replay = await runLocalPipeline(plan, handlers, { cache });
if (result.receipt.status !== 'success' || !replay.receipt.stages.every(({ status }) => status === 'cached')) {
  throw new Error('SYNTHETIC_PIPELINE_FAILED');
}
console.log(JSON.stringify({ schemaVersion: 1, sampleKind: 'synthetic', receipt: result.receipt,
  replay: replay.receipt, evaluation: result.outputs.get('evaluation').data }, null, 2));
