import { z } from 'zod';
import { EvidenceSchema } from './schemas/index.js';

const Id = z.string().min(1).max(192).regex(/^[a-zA-Z0-9_.:/-]+$/u);
const Coordinate = z.number().min(0).max(1);
const Region = z.strictObject({
  x: Coordinate, y: Coordinate, width: Coordinate.positive(), height: Coordinate.positive(),
}).refine(({ x, y, width, height }) => x + width <= 1 && y + height <= 1,
  'Region extends outside the normalized frame');
const Annotation = z.strictObject({
  partId: Id,
  parentPartId: Id.nullable(),
  label: z.string().min(1).max(160),
  region: Region.nullable(),
  separable: z.boolean().nullable(),
  evidenceIds: z.array(Id).min(1).max(64),
});

export function validatePartAnatomy(
  rawParts: unknown,
  rawEvidence: readonly unknown[],
) {
  const parts = z.array(Annotation).max(512).parse(rawParts);
  const evidence = rawEvidence.map((item) => EvidenceSchema.parse(item));
  const evidenceIndex = new Map(evidence.map((item) => [item.evidenceId, item]));
  if (evidenceIndex.size !== evidence.length) throw new Error('DUPLICATE_PART_EVIDENCE');
  const partIndex = new Map(parts.map((part) => [part.partId, part]));
  if (partIndex.size !== parts.length) throw new Error('DUPLICATE_PART_ID');

  for (const part of parts) {
    const refs = part.evidenceIds.map((id) => evidenceIndex.get(id));
    if (refs.some((ref) => !ref)) throw new Error('UNKNOWN_PART_EVIDENCE');
    if (part.region && !refs.some((ref) => ref?.kind === 'inspection' || ref?.kind === 'measurement')) {
      throw new Error('PART_REGION_REQUIRES_OBSERVATION');
    }
    if (part.separable !== null && (!part.region || !refs.some((ref) => ref?.kind === 'inspection'))) {
      throw new Error('PART_SEPARABILITY_REQUIRES_INSPECTION');
    }
    const visited = new Set([part.partId]);
    let parent = part.parentPartId;
    while (parent !== null) {
      if (visited.has(parent)) throw new Error('PART_PARENT_CYCLE');
      visited.add(parent);
      const record = partIndex.get(parent);
      if (!record) throw new Error('UNKNOWN_PART_PARENT');
      parent = record.parentPartId;
    }
  }
  return parts.map((part) => ({
    ...part,
    regionStatus: part.region === null ? 'unknown' as const : 'annotated' as const,
    separableTarget: part.separable === true,
    hiddenGeometry: null,
  }));
}
