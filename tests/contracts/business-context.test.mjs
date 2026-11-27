import assert from 'node:assert/strict';
import { test } from 'node:test';
import { BusinessContext } from '../../dist/index.js';

const demo = { id: 'lab', label: 'Estudio', context: 'demo' };
const active = { id: 'tenant', label: 'Estudio', context: 'metaapp' };
const collection = { id: 'test-cards', workspaceId: active.id, domainId: 'learning',
  capabilityId: 'course-discovery', roleId: 'course-cover' };
const taxonomy = { schemaVersion: 1, workspaces: [demo, active], collections: [collection] };

test('uses stable workspace IDs and keeps source intent distinct from observed usage', () => {
  const context = new BusinessContext(taxonomy);
  const card = context.classifyCard({ id: 'example', collection: collection.id });
  assert.equal(card.context, 'metaapp');
  assert.equal(card.basis, 'source-spec');
  const usage = context.classifyUsage({ path: 'lab/legacy/view.tsx', workspaceId: demo.id, resolution: 'exact' });
  assert.equal(usage.context, 'demo');
  assert.equal(usage.lifecycle, 'legacy');
  assert.equal(usage.useConfirmed, true);
  assert.equal(usage.productionUse, null);
});

test('missing workspaces and unlisted collections stay unresolved', () => {
  const context = new BusinessContext(taxonomy);
  assert.equal(context.classifyCard({ id: 'example', collection: 'unknown' }).status, 'unresolved');
  assert.equal(context.classifyUsage({ path: 'lab/view.tsx', workspaceId: 'unknown',
    resolution: 'exact' }).useConfirmed, false);
  assert.equal(context.classifyUsage({ path: 'lab/view.tsx', workspaceId: demo.id,
    resolution: 'candidate' }).useConfirmed, false);
  assert.throws(() => new BusinessContext({ ...taxonomy, workspaces: [demo] }), /UNKNOWN_CONTEXT_WORKSPACE/u);
});
