import { z } from 'zod';

const Text = z.strictObject({
  schemaVersion: z.literal(1),
  sourceText: z.string().min(1).max(12000),
  locale: z.string().min(2).max(64),
  direction: z.enum(['auto', 'ltr', 'rtl']),
  writingMode: z.enum(['horizontal-tb', 'vertical-rl']),
  spans: z.array(z.strictObject({
    start: z.number().int().min(0), end: z.number().int().positive(),
    styleId: z.string().regex(/^[a-z0-9-]{1,96}$/u),
  })).max(128),
});
export type GraphicsText = z.infer<typeof Text>;

export function prepareGraphicsText(input: unknown) {
  const parsed = Text.safeParse(input);
  if (!parsed.success) return { ok: false, code: 'INVALID_GRAPHICS_TEXT' } as const;
  const text = parsed.data;
  let segmenter: Intl.Segmenter;
  try {
    segmenter = new Intl.Segmenter(text.locale, { granularity: 'grapheme' });
  } catch {
    return { ok: false, code: 'INVALID_TEXT_LOCALE' } as const;
  }
  const graphemes = [...segmenter.segment(text.sourceText)].map(({ segment, index }) =>
    ({ start: index, end: index + segment.length, text: segment }));
  const boundaries = new Set([0, ...graphemes.map(({ end }) => end)]);
  let previous = 0;
  for (const { start, end } of text.spans) {
    if (start < previous || start >= end || !boundaries.has(start) || !boundaries.has(end)) {
      return { ok: false, code: 'INVALID_TEXT_SPAN' } as const;
    }
    previous = end;
  }
  return { ok: true, text, graphemes, accessibilityText: text.sourceText } as const;
}
