import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validateExportSpec, validateReconstructionRecipe } from '../../dist/index.js';

const visualId = 'v_9d7cbaa0-c4c9-4f0e-a193-a97ad9f812c3';
const asset = 'a'.repeat(64);
const origin = [0, 0, 0];
const part = { id: 'body', parentId: null, geometry: { kind: 'box', dimensions: [2, .4, 1] },
  materialId: 'ivory', position: origin, pivot: origin };
const flap = { ...part, id: 'flap', parentId: 'body' };
const recipe = { schemaVersion: 1, visualId, mode: '3d', units: 'm', upAxis: 'Z', parts: [flap, part],
  materials: [{ id: 'ivory', color: [1, .9, .8], roughness: .3, metallic: 0 }],
  camera: { kind: 'orthographic', position: [3, 4, 2], target: origin }, lights: [],
  sourceAssets: [asset], uncertainty: { hiddenGeometry: 'proposed', notes: ['Synthetic envelope'] },
  status: 'proposed' };

test('validates declarative reconstruction trees and exact authorized asset hashes', () => {
  const check = (input) => validateReconstructionRecipe(input, new Set([asset]));
  assert.equal(check(recipe).ok, true);
  assert.equal(check({ ...recipe, parts: [flap, { ...part, parentId: 'flap' }] }).code, 'RECIPE_PART_CYCLE');
  assert.equal(check({ ...recipe, parts: [flap] }).code, 'UNKNOWN_RECIPE_PARENT');
  assert.equal(check({ ...recipe, parts: [{ ...part, materialId: 'unknown' }] }).code, 'UNKNOWN_MATERIAL');
  assert.equal(check({ ...recipe, script: 'opaque' }).code, 'INVALID_RECIPE');
  assert.equal(check({ ...recipe, sourceAssets: ['b'.repeat(64)] }).code, 'RECIPE_ASSET_UNAUTHORIZED');
  assert.equal(check({ ...recipe, mode: '2d' }).code, 'UNSUPPORTED_2D_GEOMETRY');
});

const capabilities = { renderer: 'test-renderer', formats: new Set(['png', 'svg', 'webm', 'mp4', 'glb']),
  alphaFormats: new Set(['png', 'webm']), sanitizedSvg: false,
  maxPixels: 1920 * 1080, maxBytes: 1024 * 1024, maxFrames: 120 };
const video = { schemaVersion: 1, renderer: 'test-renderer', sourceRevision: 2, colorSpace: 'srgb',
  byteBudget: 1024, format: 'webm', width: 960, height: 540, alpha: true, fps: 30,
  durationMs: 1000, fallback: 'png' };

test('negotiates format, alpha, fallbacks, revision and renderer limits', () => {
  const check = (patch, revision = 2) => validateExportSpec({ ...video, ...patch }, capabilities, revision);
  assert.equal(check({}).ok, true);
  assert.equal(check({ format: 'mp4' }).code, 'INVALID_EXPORT_SPEC');
  assert.equal(check({ format: 'mp4', alpha: false }).ok, true);
  assert.equal(check({ fallback: 'webp' }).code, 'EXPORT_FORMAT_UNSUPPORTED');
  assert.equal(check({}, 3).code, 'STALE_EXPORT_REVISION');
  assert.equal(check({ durationMs: 4010 }).code, 'EXPORT_BUDGET_EXCEEDED');
  assert.equal(check({ byteBudget: 1048577 }).code, 'EXPORT_BUDGET_EXCEEDED');
  const { fps, durationMs, ...image } = video;
  assert.equal(validateExportSpec({ ...image, format: 'svg' }, capabilities, 2).code,
    'SVG_SANITIZATION_REQUIRED');
});
