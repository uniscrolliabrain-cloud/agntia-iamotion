import assert from 'node:assert/strict';
import { test } from 'node:test';
import { reconcileLibrary } from '../../lab/scripts/reconcile-library.mjs';

const a = 'a'.repeat(64);
const b = 'b'.repeat(64);
const visualId = 'v_9d7cbaa0-c4c9-4f0e-a193-a97ad9f812c3';
const source = (path, commit = '1'.repeat(40)) => ({ repository: 'test/fixtures', commit, path });
const matching = source('a/icon.png');
const alternate = source('b/icon.png');
const assets = [{ id: a, sources: [matching] }, { id: b, sources: [alternate] }];

test('reconciles exact pinned references and preserves explicit identity links in both directions', () => {
  const cards = [
    { id: 'hash', references: [{ hash: b }] },
    { id: 'path', references: [matching] },
    { id: 'basename-only', references: [source('icon.png')] },
    { id: 'wrong-commit', references: [source(matching.path, '2'.repeat(40))] },
  ];
  const assignments = [{ visualId, binaryIds: [b, a] }];
  const report = reconcileLibrary(assets, [{ assets }], cards, assignments);
  assert.deepEqual(report.candidates.map(({ binaryIds }) => binaryIds), [[], [b], [a], []]);
  assert.equal(report.unresolved.length, 2);
  assert.deepEqual(report.binaryToVisual, { [a]: [visualId], [b]: [visualId] });
  assert.deepEqual(report.visualToBinary[visualId], [a, b]);
  assert.deepEqual(report, reconcileLibrary([...assets].reverse(), [{ assets }], [...cards].reverse(), assignments));
  assert.throws(() => reconcileLibrary(assets, [], [], [{ visualId, binaryIds: ['c'.repeat(64)] }]),
    /INVALID_VISUAL_ASSIGNMENT/u);
});

test('hash and path disagreement and ambiguous tuples remain conflicts', () => {
  const conflicting = { id: 'explicit-conflict', references: [{ ...matching, hash: b }] };
  const ambiguous = { id: 'ambiguous', references: [matching] };
  const mismatch = reconcileLibrary(assets, [{ assets }], [conflicting]);
  const collision = reconcileLibrary(assets, [{ assets }, { assets: [{ id: b, sources: [matching] }] }], [ambiguous]);
  for (const result of [mismatch, collision]) {
    assert.equal(result.conflicts.length, 1);
    assert.deepEqual(result.candidates[0].binaryIds, []);
    assert.deepEqual(result.binaryToVisual, { [a]: [], [b]: [] });
  }
});
