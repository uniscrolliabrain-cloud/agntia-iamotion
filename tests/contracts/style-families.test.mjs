import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { StyleFamilies } from '../../dist/index.js';

const load = async (path) => JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'));
const manifest = await load('../../knowledge/factory/style-families/manifest.v1.json');
const cards = await load('../../library/catalog/semantic.json');

test('style rules are directional and scoped to a named context', () => {
  const styles = new StyleFamilies(manifest, cards);
  assert.equal(styles.get('company-editorial').approvedExamples.length, 0);
  assert.equal(styles.compatibility('launcher-ceramic', 'automation-nodes', 'app').disposition, 'reference-only');
  assert.equal(styles.compatibility('launcher-ceramic', 'company-editorial', 'mi-empresa').disposition, 'incompatible');
  assert.equal(styles.compatibility('launcher-ceramic', 'automation-nodes', 'mi-empresa').disposition, 'review-required');
  assert.equal(styles.compatibility('company-editorial', 'launcher-ceramic', 'app').disposition, 'review-required');
});

test('candidate examples must belong to the stated collection and cannot be self-approved', () => {
  const damaged = structuredClone(manifest);
  damaged.families[0].candidateExamples = ['01-webhook'];
  assert.throws(() => new StyleFamilies(damaged, cards), /STYLE_EXAMPLE_MISMATCH/u);
  damaged.families[0].approvedExamples = ['01-webhook'];
  assert.throws(() => new StyleFamilies(damaged, cards), /STYLE_APPROVAL_REQUIRES_REVIEW_LEDGER/u);
});
