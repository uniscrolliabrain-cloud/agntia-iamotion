import assert from 'node:assert/strict';
import { test } from 'node:test';
import { compileRag } from '../../dist/index.js';

const visualId = 'v_9d7cbaa0-c4c9-4f0e-a193-a97ad9f812c3';
const evidence = { schemaVersion: 1, evidenceId: 'fixture:inspection', kind: 'inspection',
  sourceHash: '1'.repeat(64), method: 'synthetic' };
const source = (id, value, basis = 'observed') => ({ locale: 'es', title: 'Ejemplo',
  claim: { schemaVersion: 1, claimId: 'c_' + id.repeat(64), visualId,
    facet: 'material', predicate: 'surface', value, basis, evidenceIds: [evidence.evidenceId],
    confidence: 'low', reviewStatus: 'approved', revision: 1 } });
const input = (sources, scope = 'fixtures') => ({ schemaVersion: 1, scope, sources, evidence: [evidence] });

test('preserves conflict and separates approved proposals from observation', async () => {
  const sources = [source('a', 'cerámica'), source('b', 'papel'), source('c', 'metal', 'proposed')];
  const report = await compileRag(input(sources));
  assert.equal(report.ok, true);
  assert.equal(report.cards.length, 2);
  const observed = report.cards.find((card) => card.basis === 'observed');
  assert.match(observed.text, /Afirmaciones en conflicto/u);
  assert.equal(observed.conflicting, true);
  assert.equal(report.cards.find((card) => card.basis === 'proposed').text.startsWith('Propuesta'), true);
  assert.equal(report.reverseIndex[evidence.evidenceId].length, 2);
  assert.deepEqual(await compileRag(input([...sources].reverse())), report);
});

test('diff emits only same-scope tombstones and detects evidence changes', async () => {
  const sourceRecord = source('a', 'cerámica');
  const prior = await compileRag(input([sourceRecord]));
  const foreign = await compileRag(input([sourceRecord], 'another-scope'));
  const previous = [...prior.cards, ...foreign.cards].map(({ scope, id, contentHash }) => ({ scope, id, contentHash }));
  const same = await compileRag(input([sourceRecord]), previous);
  assert.deepEqual(same.changed, []);
  const modified = await compileRag({ ...input([sourceRecord]), evidence: [{ ...evidence, sourceHash: '2'.repeat(64) }] }, previous);
  assert.deepEqual(modified.changed, [prior.cards[0].id]);
  const removed = await compileRag(input([]), previous);
  assert.deepEqual(removed.tombstones, [prior.cards[0].id]);
});

test('rejects missing or incompatible evidence and excludes unreviewed claims', async () => {
  const sourceRecord = source('a', 'cerámica');
  for (const references of [[], [{ ...evidence, kind: 'prompt' }]]) {
    assert.equal((await compileRag({ ...input([sourceRecord]), evidence: references })).code, 'RAG_EVIDENCE_INSUFFICIENT');
  }
  const pending = { ...sourceRecord, claim: { ...sourceRecord.claim, reviewStatus: 'pending' } };
  assert.deepEqual((await compileRag(input([pending]))).cards, []);
});
