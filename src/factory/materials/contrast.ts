export type Rgb = { r: number; g: number; b: number };

const HEX = /^#([0-9a-f]{6})$/iu;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/** Parses an opaque `#rrggbb` colour. Anything else is rejected, never guessed. */
export function parseHex(hex: string): Rgb {
  const match = HEX.exec(hex);
  if (!match) throw new Error('INVALID_HEX_COLOUR');
  const int = Number.parseInt(match[1], 16);
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
}

/** Source-over composite of an alpha-bearing surface on an opaque ground. */
export function composite(surface: Rgb, ground: Rgb, alpha: number): Rgb {
  if (!Number.isFinite(alpha) || alpha < 0 || alpha > 1) throw new Error('INVALID_ALPHA');
  const mix = (a: number, b: number) => a * alpha + b * (1 - alpha);
  return { r: mix(surface.r, ground.r), g: mix(surface.g, ground.g), b: mix(surface.b, ground.b) };
}

const channel = (value: number) => {
  const c = clamp01(value / 255);
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

/** WCAG 2.1 relative luminance in linear light. */
export function relativeLuminance(colour: Rgb): number {
  return 0.2126 * channel(colour.r) + 0.7152 * channel(colour.g) + 0.0722 * channel(colour.b);
}

/** WCAG 2.1 contrast ratio, always >= 1. */
export function contrastRatio(a: Rgb, b: Rgb): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Smallest surface alpha that still keeps `text` readable on `ground`.
 * A translucent material may reveal what is behind it; its content may not become
 * part of that reveal. The scan is linear so the result is deterministic and the
 * returned alpha is the exact one that satisfies the target, rounded up.
 */
export function minimumAlphaForContrast(
  surface: Rgb,
  ground: Rgb,
  text: Rgb,
  minimum = 4.5,
  steps = 200,
): number {
  if (!Number.isFinite(minimum) || minimum < 1) throw new Error('INVALID_CONTRAST_TARGET');
  if (!Number.isInteger(steps) || steps < 1 || steps > 10000) throw new Error('INVALID_CONTRAST_STEPS');
  for (let step = 0; step <= steps; step += 1) {
    const alpha = step / steps;
    if (contrastRatio(composite(surface, ground, alpha), text) >= minimum) return alpha;
  }
  return 1;
}

/** Contrast-aware surface alpha: never below the requested material opacity. */
export function readableSurfaceAlpha(
  requested: number,
  surface: Rgb,
  ground: Rgb,
  text: Rgb,
  minimum = 4.5,
): number {
  if (!Number.isFinite(requested) || requested < 0 || requested > 1) throw new Error('INVALID_ALPHA');
  return Math.max(requested, minimumAlphaForContrast(surface, ground, text, minimum));
}
