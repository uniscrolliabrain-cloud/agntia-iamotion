import { z } from 'zod';

const Coordinate = z.number().min(-16384).max(16384);
const Size = z.number().positive().max(16384);
const Color = z.string().regex(/^#[a-fA-F0-9]{6}$/u);
const NoneOrColor = z.union([z.literal('none'), Color]);
const Point = z.tuple([Coordinate, Coordinate]);
const PathCommand = z.discriminatedUnion('type', [
  z.strictObject({ type: z.literal('M'), to: Point }),
  z.strictObject({ type: z.literal('L'), to: Point }),
  z.strictObject({ type: z.literal('C'), control1: Point, control2: Point, to: Point }),
  z.strictObject({ type: z.literal('Q'), control: Point, to: Point }),
  z.strictObject({ type: z.literal('Z') }),
]);
const Geometry = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('rect'), x: Coordinate, y: Coordinate, width: Size, height: Size,
    radius: z.number().min(0).max(8192).default(0) }),
  z.strictObject({ kind: z.literal('ellipse'), center: Point, rx: Size, ry: Size }),
  z.strictObject({ kind: z.literal('line'), from: Point, to: Point }),
  z.strictObject({ kind: z.literal('polygon'), points: z.array(Point).min(3).max(512) }),
  z.strictObject({ kind: z.literal('path'), commands: z.array(PathCommand).min(2).max(512) }),
]);
const Gradient = z.strictObject({
  angle: z.number().min(0).max(360),
  stops: z.array(z.strictObject({ offset: z.number().min(0).max(1), color: Color })).min(2).max(16),
});
export const ShapeSpecSchema = z.strictObject({
  schemaVersion: z.literal(1),
  geometry: Geometry,
  fill: z.union([NoneOrColor, Gradient]),
  stroke: NoneOrColor,
  strokeWidth: z.number().min(0).max(256),
  label: z.string().min(1).max(160).optional(),
});
type Shape = z.infer<typeof ShapeSpecSchema>;
const Canvas = z.strictObject({ width: Size, height: Size });

export function validateShape(input: unknown) {
  const parsed = ShapeSpecSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: 'INVALID_SHAPE' } as const;
  const shape = parsed.data;
  const { geometry, fill } = shape;
  if (geometry.kind === 'rect' && geometry.radius > Math.min(geometry.width, geometry.height) / 2) {
    return { ok: false, code: 'SHAPE_RADIUS_OUT_OF_RANGE' } as const;
  }
  if (geometry.kind === 'path') {
    let open = false;
    let drawn = false;
    for (const command of geometry.commands) {
      if (command.type === 'M') { open = true; drawn = false; }
      else if (!open || (command.type === 'Z' && !drawn)) {
        return { ok: false, code: 'INVALID_PATH_TOPOLOGY' } as const;
      } else if (command.type === 'Z') open = false;
      else drawn = true;
    }
    if (open && !drawn) return { ok: false, code: 'INVALID_PATH_TOPOLOGY' } as const;
  }
  if (typeof fill !== 'string' && fill.stops.some((stop, index, stops) =>
    index > 0 && stop.offset <= stops[index - 1].offset)) {
    return { ok: false, code: 'UNORDERED_GRADIENT' } as const;
  }
  return { ok: true, shape } as const;
}

function topology(geometry: Shape['geometry']) {
  if (geometry.kind === 'path') return geometry.commands.map(({ type }) => type).join('');
  if (geometry.kind === 'polygon') return `polygon:${geometry.points.length}`;
  return geometry.kind;
}
export function negotiateShapeMorph(from: unknown, to: unknown) {
  const input = validateShape(from);
  const output = validateShape(to);
  if (!input.ok || !output.ok) return { mode: 'invalid' } as const;
  return { mode: topology(input.shape.geometry) === topology(output.shape.geometry) ? 'morph' : 'crossfade' } as const;
}

const escapeText = (text: string) => text.replace(/&/gu, '&amp;').replace(/</gu, '&lt;').replace(/>/gu, '&gt;');
const point = ([x, y]: [number, number]) => `${x} ${y}`;
function pathData(commands: z.infer<typeof PathCommand>[]) {
  return commands.map((command) => {
    switch (command.type) {
      case 'M':
      case 'L': return `${command.type}${point(command.to)}`;
      case 'C': return `C${point(command.control1)} ${point(command.control2)} ${point(command.to)}`;
      case 'Q': return `Q${point(command.control)} ${point(command.to)}`;
      case 'Z': return 'Z';
    }
  }).join(' ');
}

export function serializeShapeSvg(input: unknown, canvas: unknown) {
  const validated = validateShape(input);
  if (!validated.ok) return validated;
  const viewport = Canvas.safeParse(canvas);
  if (!viewport.success) return { ok: false, code: 'INVALID_SVG_VIEWPORT' } as const;
  const { shape: { geometry, label, fill, stroke, strokeWidth } } = validated;
  const { width, height } = viewport.data;
  const solid = typeof fill === 'string';
  const paint = `fill="${solid ? fill : 'url(#fill)'}" stroke="${stroke}" stroke-width="${strokeWidth}"`;
  let element: string;
  switch (geometry.kind) {
    case 'rect': {
      const { x, y, width, height, radius } = geometry;
      element = `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" ${paint}/>`;
      break;
    }
    case 'ellipse': {
      const { center: [x, y], rx, ry } = geometry;
      element = `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" ${paint}/>`;
      break;
    }
    case 'line': {
      const { from: [x1, y1], to: [x2, y2] } = geometry;
      element = `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${paint}/>`;
      break;
    }
    case 'polygon':
      element = `<polygon points="${geometry.points.map(point).join(' ')}" ${paint}/>`;
      break;
    case 'path':
      element = `<path d="${pathData(geometry.commands)}" ${paint}/>`;
      break;
  }
  const defs = solid ? '' : `<defs><linearGradient id="fill" gradientTransform="rotate(${fill.angle} .5 .5)">` +
    fill.stops.map(({ offset, color }) => `<stop offset="${offset}" stop-color="${color}"/>`).join('') +
    '</linearGradient></defs>';
  const title = label ? `<title>${escapeText(label)}</title>` : '';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">${title}${defs}${element}</svg>`;
  return { ok: true, svg } as const;
}
