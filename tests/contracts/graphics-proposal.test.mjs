import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { runLocalGraphicsProposal, validateGraphicsProposal } from '../../dist/index.js';

const knowledge = JSON.parse(await readFile(new URL('../../knowledge/factory/graphics/techniques.v1.json', import.meta.url)));
const renderer = { id: 'fixture', version: '1', features: new Set(['text', 'shape']) };
const approved = 'a'.repeat(64);
const locks = { text: [{ compositionId: 'main', layerId: 'headline', text: 'Resultado exacto: 42' }],
  metrics: [{ id: 'observed', label: 'Revisión', value: 42 }],
  approvedFonts: [approved], approvedReferences: ['technique:whole-run-fade', 'technique:glyph-morph'] };
const project = { schemaVersion: 1, rootId: 'main', timebase: 1000, fps: { numerator: 24, denominator: 1 },
  compositions: [{ id: 'main', durationTicks: 1000, viewport: { width: 960, height: 540 }, layers: [
    { kind: 'text', id: 'headline', text: locks.text[0].text, inTick: 0, outTick: 1000 },
  ] }] };
const draft = { schemaVersion: 1, project, techniqueIds: ['whole-run-fade'], fonts: [approved],
  metrics: locks.metrics, references: ['technique:whole-run-fade'] };
const capabilities = new Set(['text', 'opacity']);
const check = (replacement) => validateGraphicsProposal({ ...draft, ...replacement }, locks, knowledge, renderer, capabilities);

test('requires the exact source text, numeric data, consented references and capabilities', () => {
  assert.equal(check({}).status, 'proposal_only');
  assert.equal(check({ metrics: [{ ...draft.metrics[0], value: 43 }] }).code, 'GRAPHICS_DATA_LOCK_CHANGED');
  assert.equal(check({ fonts: ['b'.repeat(64)] }).code, 'GRAPHICS_REFERENCE_NOT_AUTHORIZED');
  assert.equal(check({ techniqueIds: ['glyph-morph'] }).code, 'GRAPHICS_TECHNIQUE_UNSUPPORTED');
  const changed = structuredClone(project);
  changed.compositions[0].layers[0].text = 'Resultado aproximado';
  assert.equal(check({ project: changed }).code, 'GRAPHICS_TEXT_LOCK_CHANGED');
});

test('runs a bounded mock with a separated data envelope and a hash-only receipt', async () => {
  const port = { kind: 'mock', async generate({ instruction, data }) {
    assert.match(instruction, /JSON estricto/u);
    assert.equal(JSON.parse(data).locks.metrics[0].value, 42);
    assert.equal(JSON.parse(data).techniques.length, 2);
    return JSON.stringify(draft);
  } };
  const result = await runLocalGraphicsProposal(locks, knowledge, renderer, capabilities, port);
  assert.equal(result.status, 'proposal_only');
  assert.match(result.receipt.inputHash, /^[a-f0-9]{64}$/u);
});
