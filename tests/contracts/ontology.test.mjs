import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { VisualOntology } from '../../dist/index.js';

const load = async (version) => JSON.parse(await readFile(new URL(
  `../../library/taxonomy/lexicon.v${version}.json`, import.meta.url,
), 'utf8'));
const previous = await load(1);
const current = await load(2);

test('bilingual migration preserves all IDs and returns ambiguous aliases explicitly', () => {
  const ontology = new VisualOntology(current);
  for (const { id, label } of previous.terms) {
    assert.equal(ontology.terms.get(id)?.label.en, label);
  }
  assert.deepEqual(ontology.lookup('Editorial', 'es'), ['style.editorial', 'ux.editorial']);
  assert.deepEqual(ontology.lookup('Editorial', 'es', 'ux'), ['ux.editorial']);
  assert.deepEqual(ontology.lookup('CERAMICA', 'es'), ['material.ceramic']);
  assert.deepEqual(ontology.lookup('photo', 'en'), ['subject.photo']);
  assert.deepEqual(ontology.lookup('photographic', 'en'), ['style.photographic']);
  assert.deepEqual(ontology.lookup('entidad visual', 'es'), ['identity.visual']);
  assert.deepEqual(ontology.lookup('sin coincidencia', 'es'), []);
  assert.deepEqual(new VisualOntology({ ...current, terms: [...current.terms].reverse() }).aliasIndex('es'),
    ontology.aliasIndex('es'));
});

test('ontology rejects dangling references, cycles and duplicate IDs', () => {
  const [a, b] = current.terms;
  const build = (terms) => new VisualOntology({ version: 2, terms });
  assert.throws(() => build([a, a]), /ONTOLOGY_DUPLICATE_ID/u);
  assert.throws(() => build([{ ...a, parentId: b.id }]), /ONTOLOGY_UNKNOWN_REFERENCE/u);
  assert.throws(() => build([{ ...a, parentId: b.id }, { ...b, parentId: a.id }]), /ONTOLOGY_CYCLE:parentId/u);
  assert.throws(() => build([
    { ...a, status: 'deprecated', replacementId: b.id },
    { ...b, status: 'deprecated', replacementId: a.id },
  ]), /ONTOLOGY_CYCLE:replacementId/u);
});
