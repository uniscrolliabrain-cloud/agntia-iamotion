import assert from 'node:assert/strict';
import { test } from 'node:test';
import { evaluateRetrieval } from '../../lab/scripts/evaluate-retrieval.mjs';

const dataset = { schemaVersion: 1, judgmentSource: 'synthetic', queries: [
  { id: 'known', split: 'test', judgments: [{ visualId: 'relevant', relevance: 3 },
    { visualId: 'irrelevant', relevance: 0 }] },
  { id: 'none', split: 'test', judgments: [] },
  { id: 'calibrate', split: 'validation', judgments: [{ visualId: 'other', relevance: 3 }] },
] };

test('reports ranked retrieval metrics and no-answer abstention with explicit denominators', () => {
  const result = evaluateRetrieval(dataset, { known: ['irrelevant', 'irrelevant', 'relevant'], none: [] });
  assert.deepEqual(result.denominators, { queries: 2, answerable: 1, noAnswer: 1 });
  assert.equal(result.metrics.recallAt5, 1);
  assert.equal(result.metrics.mrr, .5);
  assert.equal(result.metrics.ndcgAt10, 1 / Math.log2(3));
  assert.equal(result.metrics.noAnswerAbstentionRate, 1);
  assert.equal(result.judgmentSource, 'synthetic');
});

test('rejects overlapping visual identities and distinguishes missing predictions from abstention', () => {
  const contaminated = { ...dataset, queries: [...dataset.queries, {
    id: 'overlap', split: 'test', judgments: [{ visualId: 'other', relevance: 1 }],
  }] };
  assert.throws(() => evaluateRetrieval(contaminated, {}), /EVAL_VISUAL_SPLIT_OVERLAP/u);
  assert.throws(() => evaluateRetrieval(dataset, { known: [] }), /MISSING_EVAL_PREDICTION/u);
});
