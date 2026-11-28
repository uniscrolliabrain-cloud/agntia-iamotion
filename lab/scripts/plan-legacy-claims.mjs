import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { auditBaseline } from './audit-baseline.mjs';
import { canonical, hash } from './plan-library-migration.mjs';
import { EvidenceSchema } from '../../dist/index.js';

const root = resolve('.');
const audit = await auditBaseline(root);
if (audit.counts.errors) {
  console.log(JSON.stringify({ status: 'blocked', reason: 'AUDIT_FAILED', audit }));
  process.exitCode = 2;
} else {
  const sourcePath = 'library/catalog/semantic.json';
  const bytes = await readFile(join(root, sourcePath));
  const sourceHash = hash(bytes);
  if (sourceHash !== audit.inputHashes[sourcePath]) throw new Error('CLAIM_SOURCE_CHANGED');
  const cards = new Map(JSON.parse(bytes).map((card) => [card.id, card]));
  const evidence = new Map();
  const pending = [];
  const assets = JSON.parse(await readFile(join(root, 'library/catalog/assets.json'), 'utf8'));
  const coverage = new Map();
  for (const { id: binaryId } of assets) {
    if (!/^[a-f0-9]{64}$/u.test(binaryId)) throw new Error('INVALID_BINARY_ID');
    const filename = `library/entities/${binaryId}/evidence.json`;
    const { claims } = JSON.parse(await readFile(join(root, filename), 'utf8'));
    for (const claim of claims) {
      if (!cards.has(claim.evidenceRef) || claim.basis !== 'source-spec' ||
          claim.reviewStatus !== 'pending' || typeof claim.matchedPhrase !== 'string' ||
          !/^[a-z][a-z0-9-]*\.[\w.-]+$/u.test(claim.termId)) {
        throw new Error('UNSUPPORTED_LEGACY_CLAIM');
      }
      const cardId = claim.evidenceRef;
      const evidenceId = 'e:' + hash(canonical({ sourceHash, cardId }));
      if (!evidence.has(evidenceId)) evidence.set(evidenceId, {
        cardId, ...EvidenceSchema.parse({
          schemaVersion: 1, evidenceId, kind: 'prompt', sourcePath, sourceHash, method: 'legacy-lexical-match',
        }),
      });
      const facet = claim.termId.split('.')[0];
      pending.push({
        binaryId, facet, termId: claim.termId, value: claim.matchedPhrase, basis: claim.basis,
        confidence: claim.confidence, reviewStatus: 'pending', evidenceId, legacyEvidencePath: filename,
        visualId: null,
      });
      coverage.set(facet, (coverage.get(facet) ?? 0) + 1);
    }
  }
  if (pending.length !== audit.counts.claims) throw new Error('LEGACY_CLAIM_COUNT_MISMATCH');
  console.log(JSON.stringify({
    status: 'awaiting-visual-identity',
    auditInputHash: audit.inputHash,
    evidence: [...evidence.values()],
    pending,
    coverage: [...coverage].sort(([a], [b]) => a.localeCompare(b, 'en')).map(([facet, count]) =>
      ({ facet, count, basis: 'source-spec', reviewStatus: 'pending' })),
  }, null, 2));
}
