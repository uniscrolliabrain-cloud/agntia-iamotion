import { readFile } from 'node:fs/promises';
import { VisualOntology } from '../../dist/index.js';

const load = async (name) => JSON.parse(await readFile(new URL(name, import.meta.url), 'utf8'));
const previous = await load('../../library/taxonomy/lexicon.v1.json');
const next = await load('../../library/taxonomy/lexicon.v2.json');
const ontology = new VisualOntology(next);
const v1Ids = previous.terms.map(({ id }) => id).sort();
for (const id of v1Ids) {
  if (!ontology.terms.has(id)) throw new Error(`ONTOLOGY_LEGACY_ID_MISSING:${id}`);
}
console.log(JSON.stringify({
  version: next.version,
  aliases: { en: ontology.aliasIndex('en'), es: ontology.aliasIndex('es') },
  migration: Object.fromEntries(v1Ids.map((id) => [id, id])),
  added: [...ontology.terms.keys()].filter((id) => !v1Ids.includes(id)).sort(),
}, null, 2));
