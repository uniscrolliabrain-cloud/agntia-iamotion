import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { BusinessContext } from '../../dist/index.js';

const sources = ['library/taxonomy/business.v1.json', 'library/catalog/semantic.json'];
const bytes = await Promise.all(sources.map((path) => readFile(new URL(`../../${path}`, import.meta.url))));
const [taxonomy, cards] = bytes.map((buffer) => JSON.parse(buffer.toString('utf8')));
const business = new BusinessContext(taxonomy);
const output = cards.map((card) => business.classifyCard(card));
const counts = Object.groupBy(output, ({ status }) => status);
console.log(JSON.stringify({
  schemaVersion: 1,
  inputHashes: Object.fromEntries(sources.map((path, i) => [
    path, createHash('sha256').update(bytes[i]).digest('hex'),
  ])),
  counts: Object.fromEntries(Object.entries(counts).map(([status, entries]) => [status, entries.length])),
  cards: output,
}, null, 2));
