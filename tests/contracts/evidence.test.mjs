import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ClaimLedger } from '../../dist/index.js';

const hash = 'a'.repeat(64);
const evidence = { schemaVersion: 1, evidenceId: 'e:prompt', kind: 'prompt',
  sourceHash: hash, method: 'source-spec' };
const claim = {
  schemaVersion: 1, claimId: 'c_' + hash, visualId: 'v_9d7cbaa0-c4c9-4f0e-a193-a97ad9f812c3',
  facet: 'material', predicate: 'surface', value: 'ceramic', basis: 'source-spec',
  evidenceIds: [evidence.evidenceId], confidence: 'low', reviewStatus: 'pending', revision: 1,
};
const review = {
  schemaVersion: 1, id: 'r_9d7cbaa0-c4c9-4f0e-a193-a97ad9f812c3', targetId: claim.claimId,
  targetRevision: 1, decision: 'approve', actorRef: 'test:reviewer', reason: 'Synthetic fixture',
  evidenceIds: [evidence.evidenceId], at: '2026-11-27T00:00:00Z',
};
const authorize = () => true;

test('review requires authority, known evidence, and current revisions', async () => {
  const ledger = new ClaimLedger([evidence], [claim]);
  await assert.rejects(ledger.appendReview(review, 0), /REVIEW_AUTHORITY_REQUIRED/u);
  await assert.rejects(ledger.appendReview({ ...review, evidenceIds: ['missing'] }, 0, authorize),
    /EVIDENCE_NOT_FOUND/u);
  await assert.rejects(ledger.appendReview({ ...review, targetRevision: 2 }, 0, authorize),
    /STALE_CLAIM_REVISION/u);
  const races = await Promise.allSettled([
    ledger.appendReview(review, 0, authorize),
    ledger.appendReview({ ...review, decision: 'reject' }, 0, authorize),
  ]);
  assert.equal(races.filter(({ status }) => status === 'fulfilled').length, 1);
  assert.match(races.find(({ status }) => status === 'rejected').reason.message, /STALE_REVIEW/u);
  const state = ledger.projection();
  assert.equal(state.claims[0].basis, 'source-spec');
  assert.equal(state.claims[0].reviewStatus, 'approved');
  assert.deepEqual(state.coverage, [{ facet: 'material', basis: 'source-spec', status: 'approved', count: 1 }]);
});

test('preserves old claim revisions and keeps contradictory pending claims visible', async () => {
  const next = { ...claim, claimId: 'c_' + 'b'.repeat(64), value: 'enamel', revision: 2,
    supersedes: claim.claimId };
  const alternative = { ...claim, claimId: 'c_' + 'c'.repeat(64), value: 'glass' };
  const ledger = new ClaimLedger([evidence], [claim, next, alternative]);
  const projection = ledger.projection();
  assert.deepEqual(projection.claims.map(({ superseded }) => superseded), [true, false, false]);
  assert.equal(projection.coverage[0].count, 2);
  await assert.rejects(ledger.appendReview(review, 0, authorize), /STALE_CLAIM_REVISION/u);
});

test('rejects claims without evidence, automatic approval and promotion of prompt text to fact', () => {
  assert.throws(() => new ClaimLedger([], [claim]), /EVIDENCE_NOT_FOUND/u);
  assert.throws(() => new ClaimLedger([evidence], [{ ...claim, reviewStatus: 'approved' }]),
    /CLAIM_REQUIRES_EXPLICIT_REVIEW/u);
  assert.throws(() => new ClaimLedger([evidence], [{ ...claim, basis: 'observed' }]),
    /CLAIM_BASIS_UNSUPPORTED/u);
});
