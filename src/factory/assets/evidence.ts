import type { z } from 'zod';
import { ClaimSchema, EvidenceSchema, ReviewSchema } from './schemas/index.js';

type Claim = z.infer<typeof ClaimSchema>;
type Review = z.infer<typeof ReviewSchema>;
type Evidence = z.infer<typeof EvidenceSchema>;
type ReviewAuthority = (actorRef: string, claim: Readonly<Claim>) => boolean | Promise<boolean>;

export class ClaimLedger {
  readonly #evidence = new Map<string, Evidence>();
  readonly #claims = new Map<string, Claim>();
  readonly #superseded = new Set<string>();
  readonly #reviews: Review[] = [];
  readonly #reviewIds = new Set<string>();
  readonly #effective = new Map<string, Review>();

  constructor(evidence: readonly unknown[], claims: readonly unknown[]) {
    for (const input of evidence) {
      const record = EvidenceSchema.parse(input);
      if (this.#evidence.has(record.evidenceId)) throw new Error('DUPLICATE_EVIDENCE_ID');
      this.#evidence.set(record.evidenceId, record);
    }
    for (const input of claims) {
      const claim = ClaimSchema.parse(input);
      if (this.#claims.has(claim.claimId)) throw new Error('DUPLICATE_CLAIM_ID');
      if (claim.reviewStatus !== 'pending') throw new Error('CLAIM_REQUIRES_EXPLICIT_REVIEW');
      const kinds = this.#evidenceKinds(claim.evidenceIds);
      if ((claim.basis === 'observed' && !kinds.includes('inspection')) ||
          (claim.basis === 'measured' && !kinds.includes('measurement'))) {
        throw new Error('CLAIM_BASIS_UNSUPPORTED');
      }

      if (claim.supersedes) {
        const previous = this.#claims.get(claim.supersedes);
        if (!previous || this.#superseded.has(previous.claimId) ||
            previous.visualId !== claim.visualId || previous.facet !== claim.facet ||
            previous.predicate !== claim.predicate || previous.revision + 1 !== claim.revision) {
          throw new Error('INVALID_CLAIM_REVISION');
        }
        this.#superseded.add(previous.claimId);
      } else if (claim.revision !== 1) throw new Error('INVALID_CLAIM_REVISION');

      this.#claims.set(claim.claimId, claim);
    }
  }

  #evidenceKinds(ids: readonly string[]) {
    return ids.map((id) => {
      const evidence = this.#evidence.get(id);
      if (!evidence) throw new Error('EVIDENCE_NOT_FOUND');
      return evidence.kind;
    });
  }

  get reviewRevision() {
    return this.#reviews.length;
  }

  async appendReview(input: unknown, expectedReviewRevision: number, authorize?: ReviewAuthority) {
    const review = ReviewSchema.parse(input);
    if (expectedReviewRevision !== this.reviewRevision) throw new Error('STALE_REVIEW');
    const claim = this.#claims.get(review.targetId);
    if (!claim || this.#superseded.has(claim.claimId) || claim.revision !== review.targetRevision) {
      throw new Error('STALE_CLAIM_REVISION');
    }
    this.#evidenceKinds(review.evidenceIds);
    if (!authorize || !await authorize(review.actorRef, structuredClone(claim))) {
      throw new Error('REVIEW_AUTHORITY_REQUIRED');
    }
    if (expectedReviewRevision !== this.reviewRevision) throw new Error('STALE_REVIEW');
    if (this.#reviewIds.has(review.id)) throw new Error('DUPLICATE_REVIEW_ID');

    this.#reviewIds.add(review.id);
    this.#reviews.push(review);
    this.#effective.set(review.targetId, review);
    return this.reviewRevision;
  }

  projection() {
    const claims = [...this.#claims.values()].map((claim) => {
      const review = this.#effective.get(claim.claimId);
      return { ...claim, reviewStatus: review ? {
        approve: 'approved', reject: 'rejected', withdraw: 'withdrawn',
      }[review.decision] : claim.reviewStatus, superseded: this.#superseded.has(claim.claimId) };
    });
    const byFacet = new Map<string, Map<string, Map<string, number>>>();
    for (const claim of claims) {
      if (claim.superseded) continue;
      const bases = byFacet.get(claim.facet) ?? new Map();
      const statuses = bases.get(claim.basis) ?? new Map();
      statuses.set(claim.reviewStatus, (statuses.get(claim.reviewStatus) ?? 0) + 1);
      bases.set(claim.basis, statuses);
      byFacet.set(claim.facet, bases);
    }
    const coverage = [...byFacet].flatMap(([facet, bases]) => [...bases].flatMap(([basis, statuses]) =>
      [...statuses].map(([status, count]) => ({ facet, basis, status, count }))));
    return structuredClone({ claims, reviews: this.#reviews, coverage, reviewRevision: this.reviewRevision });
  }
}
