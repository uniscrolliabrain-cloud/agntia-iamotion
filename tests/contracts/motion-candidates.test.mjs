import assert from 'node:assert/strict';
import { test } from 'node:test';
import { proposeMotion } from '../../dist/index.js';

const context = { visualId: 'v_9d7cbaa0-c4c9-4f0e-a193-a97ad9f812c3',
  partIds: new Set(), properties: new Set(['translateY', 'opacity', 'scale']) };
const report = (usageRole, options = {}, target = context) =>
  proposeMotion({ usageRole, evidenceIds: ['fixture:role'], ...options }, target);

test('catalogue roles yield bounded proposals with no independent part motion on a flat asset', () => {
  assert.equal(report('launcher-icon').proposals[0].spec.primitive, 'float');
  assert.equal(report('workflow-node').proposals[0].spec.trigger, 'focus');
  assert.equal(report('course-cover').proposals[0].spec.reducedMotion.at, 1);
  const flat = report('launcher-icon', { inspectedHinge: 'flap' });
  assert.equal(flat.proposals.length, 1);
  assert.deepEqual(flat.abstentions, [{ primitive: 'fold', reason: 'TARGET_NOT_FOUND' }]);
});

test('allows an explicit inspected hinge and abstains when role or capability is missing', () => {
  const hinged = report('launcher-icon', { inspectedHinge: 'flap' }, {
    ...context, partIds: new Set(['flap']), properties: new Set([...context.properties, 'rotateX']),
  });
  assert.equal(hinged.proposals[1].spec.target.partId, 'flap');
  assert.deepEqual(report('unknown').abstentions, [{ reason: 'UNKNOWN_USAGE_ROLE' }]);
  assert.deepEqual(report('course-cover', {}, { ...context, properties: new Set() }).abstentions,
    [{ primitive: 'reveal', reason: 'CAPABILITY_UNSUPPORTED' }]);
});
