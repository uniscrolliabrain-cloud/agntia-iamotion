import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { composeBehaviors, proposeMotion } from '../../dist/index.js';

const input = await readFile('lab/staging/business-context.json');
const { cards } = JSON.parse(input.toString('utf8'));
const synthetic = [
  { card: 'mail', usageRole: 'launcher-icon', inspectedHinge: 'flap',
    partIds: ['flap'], properties: ['translateY', 'rotateX'] },
  { card: 'node', usageRole: 'workflow-node', partIds: [], properties: ['scale'] },
  { card: 'course', usageRole: 'course-cover', partIds: [], properties: ['opacity'] },
];
console.log(JSON.stringify({
  schemaVersion: 1,
  status: 'proposal',
  inputHash: createHash('sha256').update(input).digest('hex'),
  catalogue: cards.map(({ id }) => ({ id, reason: 'REVIEWED_VISUAL_ASSIGNMENT_REQUIRED' })),
  synthetic: synthetic.map(({ card, usageRole, inspectedHinge, partIds, properties }, index) => {
    const context = { visualId: `v_9d7cbaa0-c4c9-4f0e-a193-a97ad9f812c${index}`,
      partIds: new Set(partIds), properties: new Set(properties) };
    const report = proposeMotion({ usageRole, inspectedHinge, evidenceIds: [`fixture:${card}`] }, context);
    const composition = composeBehaviors({ mode: 'serial',
      clips: report.proposals.map(({ spec }) => ({ spec })) }, context);
    if (!composition.ok) throw new Error(`FIXTURE_COMPOSITION_FAILED:${composition.code}`);
    return { card, sampleKind: 'synthetic', ...report, timeline: composition.timeline };
  }),
}, null, 2));
