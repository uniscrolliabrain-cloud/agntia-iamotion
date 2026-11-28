import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { compileRag, runLocalGraphicsProposal, ScopedLexicalIndex } from '../../dist/index.js';

const path = 'knowledge/factory/graphics/techniques.v1.json';
const file = await readFile(path);
const knowledge = JSON.parse(file);
const scope = 'graphics-fixture';
const id = (prefix, index) => `${prefix}:${knowledge[index].id}`;
const hash = (value) => createHash('sha256').update(value).digest('hex');
const evidence = knowledge.map(({ evidenceId }) => ({ schemaVersion: 1, evidenceId,
  kind: 'source', sourcePath: path, sourceHash: hash(file), method: 'synthetic-review-fixture' }));
const sources = knowledge.map(({ id: title, definition, evidenceId }, index) => ({
  locale: 'es', title,
  claim: { schemaVersion: 1, claimId: 'c_' + hash(id('fixture', index)),
    visualId: `v_9d7cbaa0-c4c9-4f0e-a193-a97ad9f812c${index}`,
    facet: 'technique', predicate: 'definition', value: definition, basis: 'source-spec',
    evidenceIds: [evidenceId], confidence: 'high', reviewStatus: 'approved', revision: 1 },
}));
const corpus = await compileRag({ schemaVersion: 1, scope, sources, evidence });
if (!corpus.ok) throw new Error(corpus.code);
const index = new ScopedLexicalIndex(corpus.cards);
const hits = index.search('opacidad', { scope, authorizedScopes: new Set([scope]), locale: 'es' });
const retrieved = new Set(hits.flatMap(({ card }) => card.evidenceIds));
const techniques = knowledge.filter(({ evidenceId }) => retrieved.has(evidenceId));
if (techniques.length !== 1 || techniques[0].id !== 'whole-run-fade') throw new Error('UNEXPECTED_TECHNIQUE');
const locks = { text: [{ compositionId: 'main', layerId: 'title', text: 'Revisión: 42' }],
  metrics: [{ id: 'review', label: 'Revisión', value: 42 }], approvedFonts: [],
  approvedReferences: [...retrieved] };
const project = { schemaVersion: 1, rootId: 'main', timebase: 1000, fps: { numerator: 24, denominator: 1 },
  compositions: [{ id: 'main', durationTicks: 1000, viewport: { width: 960, height: 540 }, layers: [
    { kind: 'text', id: 'title', text: locks.text[0].text, inTick: 0, outTick: 1000 },
  ] }] };
const proposal = await runLocalGraphicsProposal(locks, techniques,
  { id: 'local', version: '1', features: new Set(['text']) },
  new Set(['text', 'opacity']), { kind: 'mock', async generate({ data }) {
    const input = JSON.parse(data);
    return JSON.stringify({ schemaVersion: 1, project, techniqueIds: input.techniques.map(({ id }) => id),
      fonts: [], metrics: input.locks.metrics, references: input.locks.approvedReferences });
  } });
if (!proposal.ok) throw new Error(proposal.code);
console.log(JSON.stringify({ schemaVersion: 1, sampleKind: 'synthetic', scope,
  sourceHash: hash(file), retrieved: [...retrieved], proposal }, null, 2));
