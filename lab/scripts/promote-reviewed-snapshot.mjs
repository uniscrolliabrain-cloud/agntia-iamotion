import { z } from 'zod';

const Id = z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9_.:/-]{0,159}$/u);
const Hash = z.string().regex(/^[a-f0-9]{64}$/u);
const Request = z.strictObject({
  scope: Id, actorId: Id, snapshotId: Hash, reviewRef: Id,
  expectedRevision: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER - 1),
});
const Review = z.strictObject({
  scope: Id, snapshotId: Hash, reviewRef: Id,
  expectedRevision: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER - 1),
  decision: z.literal('approved'),
});

export async function promoteReviewedSnapshot(input, store, policy) {
  const parsed = Request.safeParse(input);
  if (!parsed.success) return { status: 'denied', code: 'INVALID_PROMOTION_REQUEST' };
  const request = parsed.data;
  if (!policy || !await policy.authorize(structuredClone(request))) {
    return { status: 'denied', code: 'PROMOTION_AUTHORITY_REQUIRED' };
  }
  const reviewed = Review.safeParse(await policy.review(request.scope, request.reviewRef));
  if (!reviewed.success || reviewed.data.scope !== request.scope ||
      reviewed.data.snapshotId !== request.snapshotId || reviewed.data.reviewRef !== request.reviewRef ||
      reviewed.data.expectedRevision !== request.expectedRevision) {
    return { status: 'denied', code: 'STALE_OR_UNAPPROVED_REVIEW' };
  }
  const current = await store.current();
  if (current.revision !== request.expectedRevision) return { status: 'conflict', code: 'STALE_POINTER' };
  const manifest = await store.load(request.snapshotId);
  const binaryIds = manifest.files.map(({ sha256 }) => sha256);
  if (!await policy.rightsApproved({ scope: request.scope, binaryIds, snapshotId: request.snapshotId })) {
    return { status: 'denied', code: 'RIGHTS_PENDING' };
  }
  try {
    const pointer = await store.promote(request);
    return { status: 'promoted', pointer };
  } catch (error) {
    if (error?.code === 'STALE_POINTER') return { status: 'conflict', code: 'STALE_POINTER' };
    if (error?.code === 'PARENT_MISMATCH') return { status: 'conflict', code: 'PARENT_MISMATCH' };
    throw error;
  }
}
