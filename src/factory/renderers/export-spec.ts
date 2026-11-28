import { z } from 'zod';

const Format = z.enum(['png', 'webp', 'svg', 'glb', 'webm', 'mp4']);
export type ExportFormat = z.infer<typeof Format>;
const StaticFormat = z.enum(['png', 'webp']);
const Dimension = z.number().int().min(1).max(8192);
const MaxBytes = z.number().int().min(1).max(95 * 1024 * 1024);
const base = {
  schemaVersion: z.literal(1), renderer: z.string().regex(/^[a-z0-9-]{1,64}$/u),
  sourceRevision: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  colorSpace: z.literal('srgb'), byteBudget: MaxBytes,
};
const image = {
  ...base, width: Dimension, height: Dimension, alpha: z.boolean(),
};
const video = {
  ...image, fps: z.number().int().min(1).max(120),
  durationMs: z.number().int().min(100).max(60000), fallback: StaticFormat,
};

export const ExportSpecSchema = z.discriminatedUnion('format', [
  z.strictObject({ ...image, format: z.literal('png') }),
  z.strictObject({ ...image, format: z.literal('webp') }),
  z.strictObject({ ...image, format: z.literal('svg'), fallback: StaticFormat }),
  z.strictObject({ ...base, format: z.literal('glb'), fallback: StaticFormat }),
  z.strictObject({ ...video, format: z.literal('webm') }),
  z.strictObject({ ...video, format: z.literal('mp4'), alpha: z.literal(false) }),
]);

export interface ExportCapabilities {
  renderer: string;
  formats: ReadonlySet<ExportFormat>;
  alphaFormats: ReadonlySet<ExportFormat>;
  sanitizedSvg: boolean;
  maxPixels: number;
  maxBytes: number;
  maxFrames: number;
}

export function validateExportSpec(input: unknown, capabilities: ExportCapabilities, currentRevision: number) {
  const parsed = ExportSpecSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: 'INVALID_EXPORT_SPEC' } as const;
  const spec = parsed.data;
  if (spec.sourceRevision !== currentRevision) return { ok: false, code: 'STALE_EXPORT_REVISION' } as const;
  if (spec.renderer !== capabilities.renderer || !capabilities.formats.has(spec.format) ||
      ('fallback' in spec && !capabilities.formats.has(spec.fallback))) {
    return { ok: false, code: 'EXPORT_FORMAT_UNSUPPORTED' } as const;
  }
  if (spec.format === 'svg' && !capabilities.sanitizedSvg) {
    return { ok: false, code: 'SVG_SANITIZATION_REQUIRED' } as const;
  }
  if ('alpha' in spec && spec.alpha && !capabilities.alphaFormats.has(spec.format)) {
    return { ok: false, code: 'EXPORT_ALPHA_UNSUPPORTED' } as const;
  }
  if (spec.byteBudget > capabilities.maxBytes ||
      ('width' in spec && spec.width * spec.height > capabilities.maxPixels) ||
      ('fps' in spec && Math.ceil(spec.fps * spec.durationMs / 1000) > capabilities.maxFrames)) {
    return { ok: false, code: 'EXPORT_BUDGET_EXCEEDED' } as const;
  }
  return { ok: true, spec } as const;
}
