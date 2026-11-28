import { z } from 'zod';

const Scalar = z.number().min(0).max(8192);
const Positive = Scalar.positive();
const Id = z.string().regex(/^[a-z0-9-]{1,96}$/u);
const Box = z.strictObject({ width: Positive, height: Positive });
const Padding = z.strictObject({ top: Scalar, right: Scalar, bottom: Scalar, left: Scalar });
const Rule = z.strictObject({
  minWidth: Positive, maxWidth: Positive, minHeight: Positive, maxHeight: Positive,
  horizontal: z.enum(['start', 'center', 'end']),
  vertical: z.enum(['start', 'center', 'end']),
  overflow: z.enum(['wrap', 'reflow', 'reject']),
  padding: Padding,
});
const Layout = z.strictObject({
  viewport: Box,
  safeArea: Padding,
  layers: z.array(z.strictObject({
    id: Id, parentId: Id.nullable(), rule: Rule,
    compact: z.strictObject({ maxViewportWidth: Positive, rule: Rule }).optional(),
  })).max(256),
});

type Rect = z.infer<typeof Box> & { x: number; y: number };
type Rule = z.infer<typeof Rule>;
export type LayoutMeasure = (
  id: string, limits: Readonly<{ width: number; height: number; overflow: Rule['overflow'] }>,
) => { width: number; height: number } | undefined;

function inset(rect: Rect, padding: z.infer<typeof Padding>): Rect {
  return { x: rect.x + padding.left, y: rect.y + padding.top,
    width: rect.width - padding.left - padding.right, height: rect.height - padding.top - padding.bottom };
}

export const graphicsViewports = Object.freeze({
  landscape: Object.freeze({ width: 1920, height: 1080 }),
  portrait: Object.freeze({ width: 1080, height: 1920 }),
  square: Object.freeze({ width: 1080, height: 1080 }),
});

export function resolveGraphicsLayout(input: unknown, measure: LayoutMeasure) {
  const parsed = Layout.safeParse(input);
  if (!parsed.success) return { ok: false, code: 'INVALID_LAYOUT' } as const;
  const { viewport, safeArea, layers } = parsed.data;
  const safe = inset({ x: 0, y: 0, ...viewport }, safeArea);
  if (safe.width <= 0 || safe.height <= 0) {
    return { ok: false, code: 'EMPTY_SAFE_AREA' } as const;
  }
  const nodes = new Map(layers.map((layer) => [layer.id, layer]));
  if (nodes.size !== layers.length) return { ok: false, code: 'DUPLICATE_LAYOUT_LAYER' } as const;
  const visiting = new Set<string>();
  const resolved = new Map<string, { id: string; bounds: Rect; content: Rect }>();
  function evaluate(id: string): string | undefined {
    if (resolved.has(id)) return;
    if (visiting.has(id)) return 'LAYOUT_CYCLE';
    const node = nodes.get(id);
    if (!node) return 'UNKNOWN_LAYOUT_PARENT';
    visiting.add(id);
    if (node.parentId) {
      const error = evaluate(node.parentId);
      if (error) return error;
    }

    const parent = node.parentId ? resolved.get(node.parentId)!.content : safe;
    const rule = node.compact && viewport.width <= node.compact.maxViewportWidth ? node.compact.rule : node.rule;
    const widthLimit = Math.min(parent.width, rule.maxWidth);
    const heightLimit = Math.min(parent.height, rule.maxHeight);
    const horizontalPadding = rule.padding.left + rule.padding.right;
    const verticalPadding = rule.padding.top + rule.padding.bottom;
    if (widthLimit < rule.minWidth || heightLimit < rule.minHeight ||
        widthLimit <= horizontalPadding || heightLimit <= verticalPadding) return 'LAYOUT_CONSTRAINTS_UNSATISFIED';
    const size = measure(id, { width: widthLimit - horizontalPadding,
      height: heightLimit - verticalPadding, overflow: rule.overflow });
    const measured = Box.safeParse(size);
    if (!measured.success) return 'LAYOUT_MEASUREMENT_REQUIRED';
    const width = Math.max(rule.minWidth, measured.data.width + horizontalPadding);
    const height = Math.max(rule.minHeight, measured.data.height + verticalPadding);
    if (width > widthLimit || height > heightLimit) return 'LAYOUT_CONTENT_OVERFLOW';
    const offset = (available: number, align: Rule['horizontal']) =>
      align === 'center' ? available / 2 : align === 'end' ? available : 0;
    const bounds = { x: parent.x + offset(parent.width - width, rule.horizontal),
      y: parent.y + offset(parent.height - height, rule.vertical), width, height };
    resolved.set(id, { id, bounds, content: inset(bounds, rule.padding) });
    visiting.delete(id);
  }
  for (const { id } of layers) {
    const code = evaluate(id);
    if (code) return { ok: false, code, layerId: id } as const;
  }
  return { ok: true, safeArea: safe, layers: [...resolved.values()] } as const;
}
