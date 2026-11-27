import { z } from 'zod';

const Id = z.string().min(1).max(192);
const Judgment = z.strictObject({ visualId: Id, relevance: z.number().int().min(0).max(3) });
const Query = z.strictObject({
  id: Id, split: z.enum(['validation', 'test']),
  judgments: z.array(Judgment).max(1000),
});
const Dataset = z.strictObject({
  schemaVersion: z.literal(1), judgmentSource: z.enum(['synthetic', 'human-reviewed']),
  queries: z.array(Query).max(10000),
});
const dcg = (grades) => grades.reduce((sum, grade, index) => sum + (2 ** grade - 1) / Math.log2(index + 2), 0);
const mean = (values) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;

export function evaluateRetrieval(input, predictions, split = 'test') {
  const dataset = Dataset.parse(input);
  if (split !== 'validation' && split !== 'test') throw new Error('INVALID_EVAL_SPLIT');
  const ids = new Set();
  const visualSplit = new Map();
  for (const query of dataset.queries) {
    if (ids.has(query.id)) throw new Error('DUPLICATE_EVAL_QUERY');
    ids.add(query.id);
    const local = new Set();
    for (const { visualId } of query.judgments) {
      if (local.has(visualId)) throw new Error('DUPLICATE_EVAL_JUDGMENT');
      local.add(visualId);
      if (visualSplit.has(visualId) && visualSplit.get(visualId) !== query.split) {
        throw new Error('EVAL_VISUAL_SPLIT_OVERLAP');
      }
      visualSplit.set(visualId, query.split);
    }
  }
  const cases = [];
  for (const query of dataset.queries.filter((item) => item.split === split)) {
    if (!Object.hasOwn(predictions, query.id)) throw new Error('MISSING_EVAL_PREDICTION');
    const ranked = z.array(Id).max(1000).parse(predictions[query.id]);
    const distinct = [...new Set(ranked)];
    const grades = new Map(query.judgments.map(({ visualId, relevance }) => [visualId, relevance]));
    const relevantGrades = [...grades.values()].filter((grade) => grade > 0).sort((a, b) => b - a);
    const relevance = distinct.map((id) => grades.get(id) ?? 0);
    const firstRelevant = relevance.findIndex((grade) => grade > 0);
    const relevant = relevantGrades.length;
    const recall = (k) => relevant ? relevance.slice(0, k).filter((grade) => grade > 0).length / relevant : null;
    cases.push({
      id: query.id, relevant, abstained: distinct.length === 0,
      unjudgedAt10: distinct.slice(0, 10).filter((id) => !grades.has(id)).length,
      recallAt5: recall(5), recallAt10: recall(10),
      reciprocalRank: relevant ? firstRelevant === -1 ? 0 : 1 / (firstRelevant + 1) : null,
      ndcgAt10: relevant ? dcg(relevance.slice(0, 10)) / dcg(relevantGrades.slice(0, 10)) : null,
    });
  }
  const answerable = cases.filter(({ relevant }) => relevant > 0);
  const noAnswer = cases.filter(({ relevant }) => relevant === 0);
  return {
    schemaVersion: 1, judgmentSource: dataset.judgmentSource, split,
    denominators: { queries: cases.length, answerable: answerable.length, noAnswer: noAnswer.length },
    metrics: {
      recallAt5: mean(answerable.map(({ recallAt5 }) => recallAt5)),
      recallAt10: mean(answerable.map(({ recallAt10 }) => recallAt10)),
      mrr: mean(answerable.map(({ reciprocalRank }) => reciprocalRank)),
      ndcgAt10: mean(answerable.map(({ ndcgAt10 }) => ndcgAt10)),
      noAnswerAbstentionRate: mean(noAnswer.map(({ abstained }) => Number(abstained))),
    },
    cases,
  };
}
