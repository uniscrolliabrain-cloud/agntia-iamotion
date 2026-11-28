import { z } from 'zod';

const sha256Pattern = /^[a-f0-9]{64}$/;
const uuidPattern = '[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}';
const idPattern = (prefix: string) => new RegExp(`^${prefix}_${uuidPattern}$`);

const Hash = z.string().regex(sha256Pattern);
const VisualId = z.string().regex(idPattern('v'));
const ClaimId = z.string().regex(/^c_[a-f0-9]{64}$/);
const ReviewId = z.string().regex(idPattern('r'));
const Ref = z.string().min(1).max(192).regex(/^[a-zA-Z0-9_.:/-]+$/);
const Note = z.string().min(1).max(2048);
const RelativePath = z.string().min(1).max(2048)
  .regex(/^(?!\/)(?!.*(?:^|\/)\.{1,2}(?:\/|$))[^\\:\u0000-\u001f/]+(?:\/[^\\:\u0000-\u001f/]+)*$/u);
const Revision = z.number().int().min(1).max(Number.MAX_SAFE_INTEGER);
const ReviewStatus = z.enum(['pending', 'approved', 'rejected', 'withdrawn']);
const EvidenceIds = z.array(Ref).min(1).max(64);
const Version = z.literal(1);

const SourceRef = z.strictObject({
  repository: Ref,
  commit: z.string().regex(/^[a-f0-9]{40}$/),
  path: RelativePath,
});

export const BinaryRecordSchema = z.strictObject({
  schemaVersion: Version,
  binaryId: Hash,
  mime: z.enum(['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']),
  bytes: z.number().int().min(1).max(95 * 1024 * 1024),
  width: z.number().int().positive().max(32768).optional(),
  height: z.number().int().positive().max(32768).optional(),
  alpha: z.boolean().optional(),
  sourceRefs: z.array(SourceRef).max(256),
  storageRef: RelativePath,
  reviewStatus: ReviewStatus,
});

export const VisualEntitySchema = z.strictObject({
  schemaVersion: Version,
  visualId: VisualId,
  revision: Revision,
  slug: z.string().min(1).max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  kind: Ref,
  familyIds: z.array(Ref).max(64),
  binaryIds: z.array(Hash).max(256),
  claimIds: z.array(ClaimId).max(512),
  relationIds: z.array(Ref).max(512),
  lifecycle: z.enum(['candidate', 'active', 'retired']),
});

export const EvidenceSchema = z.strictObject({
  schemaVersion: Version,
  evidenceId: Ref,
  kind: z.enum(['source', 'prompt', 'measurement', 'inspection', 'review']),
  sourceCommit: z.string().regex(/^[a-f0-9]{40}$/).optional(),
  sourcePath: RelativePath.optional(),
  sourceHash: Hash,
  span: z.strictObject({
    start: z.number().int().min(0),
    end: z.number().int().min(0),
  }).refine(({ start, end }) => end >= start, 'Span ends before it starts').optional(),
  method: Ref,
  observedAt: z.iso.datetime().optional(),
});

const ClaimAtom = z.union([Note, z.number(), z.boolean(), z.null()]);

export const ClaimSchema = z.strictObject({
  schemaVersion: Version,
  claimId: ClaimId,
  visualId: VisualId,
  facet: Ref,
  predicate: Ref,
  value: z.union([ClaimAtom, z.array(ClaimAtom).max(64)]),
  unit: Ref.optional(),
  basis: z.enum(['observed', 'measured', 'source-spec', 'path-inference', 'proposed']),
  evidenceIds: EvidenceIds,
  confidence: z.enum(['low', 'medium', 'high']),
  reviewStatus: ReviewStatus,
  revision: Revision,
  supersedes: ClaimId.optional(),
});

export const RelationSchema = z.strictObject({
  schemaVersion: Version,
  id: Ref,
  from: Ref,
  to: Ref,
  type: z.enum(['variant-of', 'derived-from', 'same-family', 'depicts', 'used-in',
    'compatible-with', 'alternative-to', 'animates-as']),
  evidenceIds: EvidenceIds,
  status: ReviewStatus,
});

export const ReviewSchema = z.strictObject({
  schemaVersion: Version,
  id: ReviewId,
  targetId: Ref,
  targetRevision: Revision,
  decision: z.enum(['approve', 'reject', 'withdraw']),
  actorRef: Ref,
  reason: Note,
  evidenceIds: EvidenceIds,
  at: z.iso.datetime(),
});

export const visualLibrarySchemas = {
  binary: BinaryRecordSchema,
  visual: VisualEntitySchema,
  evidence: EvidenceSchema,
  claim: ClaimSchema,
  relation: RelationSchema,
  review: ReviewSchema,
} as const;

export function visualLibraryJsonSchemas() {
  return Object.fromEntries(Object.entries(visualLibrarySchemas).map(([name, schema]) =>
    [name, z.toJSONSchema(schema, { io: 'input' })]));
}
