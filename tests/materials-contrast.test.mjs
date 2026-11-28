import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseHex, composite, relativeLuminance, contrastRatio, minimumAlphaForContrast, readableSurfaceAlpha,
} from '../dist/factory/materials/contrast.js';

const near = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol, `${a} != ${b}`);

test('parses only opaque six-digit hex', () => {
  assert.deepEqual(parseHex('#FCFAF6'), { r: 252, g: 250, b: 246 });
  assert.deepEqual(parseHex('#242421'), { r: 36, g: 36, b: 33 });
  assert.throws(() => parseHex('242421'));
  assert.throws(() => parseHex('#2424'));
  assert.throws(() => parseHex('#GGGGGG'));
});

test('composite is the identity at both endpoints', () => {
  const surface = parseHex('#fffaf5');
  const ground = parseHex('#211f1c');
  assert.deepEqual(composite(surface, ground, 1), surface);
  assert.deepEqual(composite(surface, ground, 0), ground);
  const mid = composite(surface, ground, 0.5);
  near(mid.r, (surface.r + ground.r) / 2);
  assert.throws(() => composite(surface, ground, 1.2));
  assert.throws(() => composite(surface, ground, Number.NaN));
});

test('luminance and ratio match the WCAG reference values', () => {
  const white = parseHex('#ffffff');
  const black = parseHex('#000000');
  near(relativeLuminance(white), 1, 1e-12);
  near(relativeLuminance(black), 0, 1e-12);
  near(contrastRatio(white, black), 21, 1e-12);
  near(contrastRatio(black, white), 21, 1e-12);
  near(contrastRatio(white, white), 1, 1e-12);
});

test('minimum alpha reaches the target and is tight', () => {
  const surface = parseHex('#fffaf5');
  const ground = parseHex('#211f1c');
  const text = parseHex('#6e6c66');
  const alpha = minimumAlphaForContrast(surface, ground, text, 4.5, 200);
  assert.ok(alpha > 0 && alpha <= 1);
  assert.ok(contrastRatio(composite(surface, ground, alpha), text) >= 4.5);
  if (alpha > 0) {
    const below = composite(surface, ground, Math.max(0, alpha - 1 / 200));
    assert.ok(contrastRatio(below, text) < 4.5);
  }
  assert.equal(alpha, minimumAlphaForContrast(surface, ground, text, 4.5, 200));
});

test('readable alpha never lowers the material opacity', () => {
  const surface = parseHex('#fffaf5');
  const paper = parseHex('#f2efe8');
  const ink = parseHex('#211f1c');
  const text = parseHex('#242421');
  const onPaper = readableSurfaceAlpha(0.58, surface, paper, text);
  const onInk = readableSurfaceAlpha(0.58, surface, ink, text);
  assert.ok(onPaper >= 0.58);
  assert.ok(onInk >= 0.58);
  assert.ok(onInk >= onPaper, 'a dark ground needs at least as much surface opacity as paper');
  assert.ok(contrastRatio(composite(surface, ink, onInk), text) >= 4.5);
  assert.throws(() => readableSurfaceAlpha(2, surface, paper, text));
});
