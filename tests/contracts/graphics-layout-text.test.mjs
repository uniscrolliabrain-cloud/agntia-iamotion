import assert from 'node:assert/strict';
import { test } from 'node:test';
import { prepareGraphicsText, resolveGraphicsLayout } from '../../dist/index.js';

const padding = { top: 10, right: 10, bottom: 10, left: 10 };
const rule = { minWidth: 50, maxWidth: 500, minHeight: 30, maxHeight: 300,
  horizontal: 'center', vertical: 'start', overflow: 'wrap', padding };
const input = { viewport: { width: 320, height: 250 }, safeArea: padding, layers: [
  { id: 'title', parentId: 'group', rule,
    compact: { maxViewportWidth: 320, rule: { ...rule, overflow: 'reflow' } } },
  { id: 'group', parentId: null, rule },
] };

test('measures text against the parent and uses explicit compact rules within safe bounds', () => {
  const layout = resolveGraphicsLayout(input, (id, limits) => {
    if (id === 'group') return { width: 260, height: 160 };
    assert.equal(limits.overflow, 'reflow');
    assert.equal(limits.width, 240);
    return { width: 220, height: 80 };
  });
  assert.deepEqual(layout.layers.map(({ bounds }) => bounds), [
    { x: 20, y: 10, width: 280, height: 180 }, { x: 40, y: 20, width: 240, height: 100 },
  ]);
  assert.equal(resolveGraphicsLayout(input, () => ({ width: 500, height: 500 })).code, 'LAYOUT_CONTENT_OVERFLOW');
  assert.equal(resolveGraphicsLayout(input, () => undefined).code, 'LAYOUT_MEASUREMENT_REQUIRED');
});

test('keeps Unicode graphemes intact and preserves exact bidirectional source text', () => {
  const sourceText = 'e\u0301 👨‍👩‍👧‍👦 العربية 12';
  const spec = { schemaVersion: 1, sourceText, locale: 'es', direction: 'auto', writingMode: 'horizontal-tb', spans: [] };
  const layout = prepareGraphicsText(spec);
  assert.equal(layout.accessibilityText, sourceText);
  assert.equal(layout.graphemes[0].text, 'e\u0301');
  assert.equal(layout.graphemes[2].text, '👨‍👩‍👧‍👦');
  assert.equal(prepareGraphicsText({ ...spec, spans: [{ start: 0, end: 1, styleId: 'strong' }] }).code,
    'INVALID_TEXT_SPAN');
});

test('whole-run text fade always retains original accessible text and rejects unsupported techniques', async () => {
  const { planGraphicsTextBehavior } = await import('../../dist/index.js');
  const text = { schemaVersion: 1, sourceText: 'Importe exacto: € 1.250,00',
    locale: 'es', direction: 'ltr', writingMode: 'horizontal-tb', spans: [] };
  const context = { visualId: 'v_9d7cbaa0-c4c9-4f0e-a193-a97ad9f812c3',
    partIds: new Set(['title']), properties: new Set(['opacity']) };
  const request = { technique: 'run-fade', behaviorId: 'title', partId: 'title', durationMs: 500 };
  const plan = planGraphicsTextBehavior(text, request, context);
  assert.equal(plan.accessibilityText, text.sourceText);
  assert.equal(plan.visualText, text.sourceText);
  assert.equal(plan.spec.reducedMotion.at, 1);
  assert.equal(planGraphicsTextBehavior(text, { ...request, technique: 'typewriter' }, context).code,
    'TEXT_TECHNIQUE_UNSUPPORTED');
});
