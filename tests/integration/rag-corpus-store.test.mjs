import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { readRagCorpus, stageRagCorpus } from '../../lab/scripts/rag-corpus-store.mjs';

test('persists a scoped corpus with deterministic replay and detects file changes', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'rag-corpus-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const result = { ok: true, scope: 'test', cards: [{ id: 'rag:1', scope: 'test', title: 'Sample' }],
    reverseIndex: { 'e:1': ['rag:1'] }, tombstones: ['old'] };
  const [left, right] = await Promise.all([stageRagCorpus(root, result), stageRagCorpus(root, result)]);
  assert.deepEqual(left, right);
  assert.deepEqual(left.cards, result.cards);
  assert.deepEqual(left.tombstones, ['old']);
  assert.match(await readFile(join(root, left.snapshotId, 'cards.jsonl'), 'utf8'), /\n$/u);
  await assert.rejects(readRagCorpus(root, left.snapshotId, 'other'), /INVALID_CORPUS_MANIFEST/u);
  await writeFile(join(root, left.snapshotId, 'cards.jsonl'), '{}\n');
  await assert.rejects(readRagCorpus(root, left.snapshotId, 'test'), /CORPUS_ARTIFACT_MISMATCH/u);
  await assert.rejects(stageRagCorpus(root, result), /CORPUS_ARTIFACT_MISMATCH/u);
});
