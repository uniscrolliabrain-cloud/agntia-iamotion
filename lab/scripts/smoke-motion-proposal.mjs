import { readFile } from 'node:fs/promises';
import { readRagCorpus } from './rag-corpus-store.mjs';
import { runMotionDraft, ScopedLexicalIndex } from '../../dist/index.js';

const { snapshotId } = JSON.parse(await readFile('lab/staging/rag-durable.json', 'utf8'));
const corpus = await readRagCorpus('lab/staging/rag-corpora', snapshotId, 'synthetic');
const index = new ScopedLexicalIndex(corpus.cards);
const access = { scope: 'synthetic', authorizedScopes: new Set(['synthetic']), locale: 'es',
  approvedAssetsByVisualId: new Map(), characterBudget: 512 };
const provider = {
  mode: 'mock', modelId: 'fixture-motion-v1',
  async generate({ data }) {
    const { references } = JSON.parse(data);
    return JSON.stringify({
      spec: { schemaVersion: 1, title: 'Correo cerámico sintético', assetIds: [],
        durationMs: 500, behavior: 'float', output: 'svg' },
      referenceIds: [references[0].referenceId],
    });
  },
};
const config = { mode: 'mock', modelId: provider.modelId, timeoutMs: 2000,
  maxInputCharacters: 5000, maxOutputCharacters: 1000, repairOnce: false };
const result = await runMotionDraft({ query: 'ceramica', promptVersion: 1 }, index, access, config, provider);
if (result.status !== 'proposal_only') throw new Error(result.status);
console.log(JSON.stringify({ schemaVersion: 1, sampleKind: 'synthetic', snapshotId, ...result }, null, 2));
