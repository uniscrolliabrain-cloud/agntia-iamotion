import { visualLibraryJsonSchemas, visualLibrarySchemas } from '../../dist/index.js';

const version = { schemaVersion: 1 };
const hash = 'a'.repeat(64);
const visualId = 'v_9d7cbaa0-c4c9-4f0e-a193-a97ad9f812c3';
const claimId = `c_${hash}`;
const evidenceIds = ['e:demo'];
const at = '2026-11-27T00:00:00Z';
const samples = {
  binary: { ...version, binaryId: hash, mime: 'image/png', bytes: 8, storageRef: 'a/b.png',
    sourceRefs: [], reviewStatus: 'pending' },
  visual: { ...version, visualId, revision: 1, slug: 'mail', kind: 'icon', familyIds: [],
    binaryIds: [hash], claimIds: [], relationIds: [], lifecycle: 'candidate' },
  evidence: { ...version, evidenceId: evidenceIds[0], kind: 'prompt', sourceHash: hash,
    method: 'source-spec', observedAt: at, span: { start: 1, end: 3 } },
  claim: { ...version, claimId, visualId, facet: 'material', predicate: 'surface', value: 'ceramic',
    basis: 'proposed', evidenceIds, confidence: 'low', reviewStatus: 'pending', revision: 1 },
  relation: { ...version, id: 'relation:1', from: visualId, to: 'family:mail', type: 'same-family',
    evidenceIds, status: 'pending' },
  review: { ...version, id: 'r_9d7cbaa0-c4c9-4f0e-a193-a97ad9f812c3', targetId: claimId,
    targetRevision: 1, decision: 'approve', actorRef: 'test:reviewer', reason: 'Demo', evidenceIds, at },
};
const cases = Object.entries(samples).flatMap(([name, sample]) =>
  [[sample, true], [{ ...sample, schemaVersion: 2 }, false], [{ ...sample, unknown: true }, false]]
    .map(([value, expected]) => ({ name, value, expected })));
cases.push(
  { name: 'binary', value: { ...samples.binary, storageRef: 'a/../b.png' }, expected: false },
  { name: 'review', value: { ...samples.review, targetRevision: 0 }, expected: false },
  { name: 'claim', value: { ...samples.claim, evidenceIds: [] }, expected: false },
);
for (const { name, value, expected } of cases) {
  if (visualLibrarySchemas[name].safeParse(value).success !== expected) {
    throw new Error(`Zod disagrees with the expected result for ${name}`);
  }
}
const inverted = { ...samples.evidence, span: { start: 3, end: 1 } };
if (visualLibrarySchemas.evidence.safeParse(inverted).success) throw new Error('Invalid span accepted');
console.log(JSON.stringify({ schemas: visualLibraryJsonSchemas(), cases, runtimeOnly: inverted }));
