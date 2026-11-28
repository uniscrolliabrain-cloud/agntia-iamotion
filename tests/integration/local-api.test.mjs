import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createLocalVisualApi } from '../../dist/index.js';

const ports = {
  identify: async (request) => request.headers.get('x-fixture') ? {
    tenantId: request.headers.get('x-fixture'), actorId: 'actor', correlationId: 'test',
  } : undefined,
  authority: { authorize: async ({ tenantId }) => ['a', 'b'].includes(tenantId) },
  reader: { readManifest: async () => assert.fail('untrusted manifest read'), isAssetReadable: async () => false },
};
const event = { schemaVersion: 1, streamId: 'particles', idempotencyKey: 'one',
  expectedRevision: 0, state: 'ready', synthetic: true };
function post(api, input, tenant = 'a') {
  return api.request('/v1/visual-events', { method: 'POST',
    headers: { 'content-type': 'application/json', 'x-fixture': tenant }, body: JSON.stringify(input) });
}

test('enforces tenant isolation, exact idempotent replay and revision CAS', async () => {
  const api = createLocalVisualApi(ports);
  assert.equal((await post(api, event, 'foreign')).status, 403);
  const pair = await Promise.all([post(api, event), post(api, event)]);
  assert.deepEqual(pair.map(({ status }) => status).sort(), [200, 201]);
  for (const result of pair) assert.equal((await result.json()).receipt.revision, 1);
  const conflicting = await post(api, { ...event, state: 'paused' });
  assert.equal((await conflicting.json()).status, 'idempotency_conflict');
  assert.equal((await (await post(api, { ...event, idempotencyKey: 'other' })).json()).status, 'stale_revision');
  assert.equal((await post(api, event, 'b')).status, 201);
});

test('denies by default and rejects malformed, oversized or non-synthetic input', async () => {
  const api = createLocalVisualApi(ports);
  assert.equal((await api.request('/v1/status')).status, 403);
  assert.equal((await post(createLocalVisualApi({ ...ports, authority: undefined }), event)).status, 403);
  assert.equal((await (await api.request('/v1/status', { headers: { 'x-fixture': 'a' } })).json()).localOnly, true);
  assert.equal((await post(api, { ...event, synthetic: false })).status, 400);
  assert.equal((await post(api, { ...event, streamId: 'n'.repeat(17000) })).status, 400);
});
