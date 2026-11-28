import { z } from 'zod';

const Hash = z.string().regex(/^[a-f0-9]{64}$/u);
const Axis = z.strictObject({ tag: z.string().regex(/^[a-zA-Z0-9]{4}$/u),
  min: z.number(), default: z.number(), max: z.number() })
  .refine(({ min, default: initial, max }) => min <= initial && initial <= max);
const Font = z.strictObject({
  id: z.string().regex(/^[a-z0-9-]{1,96}$/u),
  family: z.string().min(1).max(128), style: z.enum(['regular', 'bold']),
  sha256: Hash, licenseSha256: Hash, embedding: z.boolean(),
  coverage: z.array(z.number().int().min(0).max(0x10ffff)).max(65536),
  axes: z.array(Axis).max(32),
});

export interface GraphicsFontStore {
  read(sha256: string): Promise<Uint8Array | undefined>;
}

export async function resolveGraphicsFont(references: readonly unknown[], text: string,
  approvedLicenseHashes: ReadonlySet<string>, store: GraphicsFontStore, options: {
    style: 'regular' | 'bold'; embedding: boolean; axes?: Readonly<Record<string, number>>;
  }) {
  const parsed = z.array(Font).min(1).max(16).safeParse(references);
  if (!parsed.success || typeof text !== 'string' || text.length > 12000) {
    return { ok: false, code: 'INVALID_FONT_INPUT' } as const;
  }
  const codepoints = Array.from(text).filter((letter) => !/[\r\n\t\u200d\ufe0f]/u.test(letter))
    .map((letter) => letter.codePointAt(0)!);
  for (const font of parsed.data) {
    if (font.style !== options.style || !approvedLicenseHashes.has(font.licenseSha256) ||
        (options.embedding && !font.embedding)) continue;
    const axes = new Map(font.axes.map((axis) => [axis.tag, axis]));
    if (axes.size !== font.axes.length || Object.entries(options.axes ?? {}).some(([tag, value]) => {
      const axis = axes.get(tag);
      return !axis || !Number.isFinite(value) || value < axis.min || value > axis.max;
    })) continue;
    const coverage = new Set(font.coverage);
    if (codepoints.some((point) => !coverage.has(point))) continue;
    const bytes = await store.read(font.sha256);
    if (!bytes || !bytes.length || bytes.length > 16 * 1024 * 1024) continue;
    const raw = new Uint8Array(bytes);
    const observed = [...new Uint8Array(await crypto.subtle.digest('SHA-256', raw))]
      .map((byte) => byte.toString(16).padStart(2, '0')).join('');
    if (observed !== font.sha256) continue;
    return { ok: true, font: { id: font.id, family: font.family, style: font.style,
      sha256: font.sha256, licenseSha256: font.licenseSha256, embedding: font.embedding } } as const;
  }
  return { ok: false, code: 'FONT_COVERAGE_OR_PERMISSION_UNAVAILABLE' } as const;
}
