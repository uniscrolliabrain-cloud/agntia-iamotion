import { createLocalVisualApi, createVisualBinding, visualManifestId } from '../../dist/index.js';

const tenant = 'demo-tenant';
const binaryId = 'b'.repeat(64);
const manifest = { schemaVersion: 1, tenantId: tenant, revision: 1,
  assets: [{ binaryId, mime: 'image/png', bytes: 32, rights: 'approved' }] };
const snapshotId = await visualManifestId(manifest);
const api = createLocalVisualApi({
  identify: async (request) => {
    const tenantId = request.headers.get('x-fixture-tenant');
    return tenantId && { tenantId, actorId: 'fixture-actor', correlationId: 'fixture-trace' };
  },
  authority: { authorize: async (identity, capability) => identity.tenantId === tenant &&
    ['motion.status', 'motion.assets.read', 'motion.preview.request'].includes(capability) },
  reader: {
    readManifest: async (requested) => requested.tenantId === tenant && requested.snapshotId === snapshotId
      ? manifest : undefined,
    isAssetReadable: async (requested) => requested.tenantId === tenant && requested.binaryId === binaryId,
  },
});
const post = async (path, body, scope = tenant) => {
  const response = await api.request(path, { method: 'POST', headers: {
    'content-type': 'application/json', 'x-fixture-tenant': scope,
  }, body: JSON.stringify(body) });
  return { status: response.status, payload: await response.json() };
};
const asset = await post('/v1/assets/resolve', { binaryId, snapshotId });
const event = { schemaVersion: 1, streamId: 'field', idempotencyKey: 'initial',
  expectedRevision: 0, state: 'ready', synthetic: true };
const accepted = await post('/v1/visual-events', event);
const replayed = await post('/v1/visual-events', event);
const conflict = await post('/v1/visual-events', { ...event, state: 'paused' });
const foreign = await post('/v1/assets/resolve', { binaryId, snapshotId }, 'foreign');
if (asset.status !== 200 || accepted.status !== 201 || replayed.status !== 200 ||
    conflict.status !== 409 || foreign.status !== 403) throw new Error('HOST_FIXTURE_FAILED');
const binding = createVisualBinding({ scope: tenant, bindingId: 'field', allowedRecipes: ['ambient'], synthetic: true });
const update = { schemaVersion: 1, scope: tenant, bindingId: accepted.payload.receipt.streamId,
  recipeId: 'ambient', revision: accepted.payload.receipt.revision, state: accepted.payload.receipt.state,
  synthetic: accepted.payload.receipt.synthetic };
if (!binding.accept(update).ok || binding.accept(update).code !== 'BINDING_STALE_REVISION') {
  throw new Error('HOST_BINDING_FIXTURE_FAILED');
}
console.log(JSON.stringify({ schemaVersion: 1, sampleKind: 'synthetic', asset, accepted,
  replayed, conflict, foreign, binding: binding.flush() }, null, 2));
