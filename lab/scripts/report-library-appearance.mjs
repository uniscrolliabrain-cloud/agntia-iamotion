import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const [assetsBytes, measurementBytes, intentBytes, semanticBytes] = await Promise.all([
  'library/catalog/assets.json', 'lab/staging/image-inspection-final.json',
  'lab/staging/prompt-intent.json', 'library/catalog/semantic.json',
].map((path) => readFile(path)));
const [assets, inspection, intents, semantic] = [assetsBytes, measurementBytes, intentBytes, semanticBytes]
  .map((bytes) => JSON.parse(bytes.toString('utf8')));
if (inspection.inputHash !== sha(assetsBytes)) throw new Error('APPEARANCE_INPUT_MISMATCH');
const measurement = new Map(inspection.records.map((record) => [record.binaryId, record]));
const intent = new Set(intents.cards.filter(({ status }) => status === 'candidate').map(({ id }) => id));
const cardIndex = new Map(semantic.map((data) => [data.id, data]));
if (measurement.size !== assets.length || inspection.records.length !== assets.length) {
  throw new Error('APPEARANCE_INSPECTION_COVERAGE_MISMATCH');
}

const records = assets.map(({ id, cardIds }) => {
  const result = measurement.get(id);
  if (!result || result.status === 'error') throw new Error('APPEARANCE_MEASUREMENT_MISSING');
  if (cardIds.some((cardId) => !cardIndex.has(cardId))) throw new Error('APPEARANCE_CARD_MISSING');
  return {
    binaryId: id,
    measured: result.basis === 'measured' ? result : null,
    vectorSource: result.basis === 'source-spec' ? result : null,
    intentCardIds: cardIds.filter((cardId) => intent.has(cardId)).sort(),
    observed: null,
    parts: [],
    unknowns: ['silhouette', 'depth', 'physical-material', 'hidden-geometry'],
  };
});
console.log(JSON.stringify({
  schemaVersion: 1,
  inputHashes: {
    assets: sha(assetsBytes), measurement: sha(measurementBytes),
    promptIntent: sha(intentBytes), semantic: sha(semanticBytes),
  },
  counts: { records: records.length, withAnnotations: 0 },
  records,
}, null, 2));
