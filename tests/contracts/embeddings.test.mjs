import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { test } from 'node:test';
import { EmbeddingsClient } from '../../dist/index.js';

const settings = { modelId: 'mock', modelVersion: '1', dimension: 2, maxBatch: 4, maxCharacters: 100, timeoutMs: 50 };
const text = 'ivory ceramic';
const input = (scope = 'alpha') => ({ scope, inputs: [
  { id: 'mail', contentHash: createHash('sha256').update(text).digest('hex'), text },
] });
const authorized = new Set(['alpha', 'beta']);
const output = (values = [3, 4]) => ({ modelId: 'mock', modelVersion: '1', dimension: 2, vectors: [{ id: 'mail', values }] });

test('validates vectors, partitions the cache by scope and refuses unauthorised scopes', async () => {
  let calls = 0;
  const client = new EmbeddingsClient(settings, { embed: async () => { calls++; return output(); } });
  assert.equal((await client.embed(input('foreign'), authorized)).status, 'scope_denied');
  const first = await client.embed(input(), authorized);
  assert.deepEqual(first.vectors[0].values, [.6, .8]);
  first.vectors[0].values[0] = 7;
  assert.deepEqual((await client.embed(input(), authorized)).vectors[0].values, [.6, .8]);
  assert.equal(calls, 1);
  assert.equal((await client.embed(input('beta'), authorized)).status, 'ok');
  assert.equal(calls, 2);
  assert.equal((await new EmbeddingsClient(settings).embed(input(), authorized)).status, 'not_configured');
});

test('rejects malformed output and enforces deadlines without a live provider', async () => {
  for (const values of [[NaN, 1], [0, 0], [42]]) {
    const client = new EmbeddingsClient(settings, { embed: async () => output(values) });
    assert.equal((await client.embed(input(), authorized)).status, 'invalid_response');
  }
  let observed;
  const timeout = new EmbeddingsClient({ ...settings, timeoutMs: 5 }, { embed: ({ signal }) => {
    observed = signal;
    return new Promise(() => {});
  } });
  assert.equal((await timeout.embed(input(), authorized)).status, 'timeout');
  assert.equal(observed.aborted, true);
  const abort = new AbortController();
  abort.abort();
  assert.equal((await timeout.embed(input(), authorized, abort.signal)).status, 'aborted');
});
