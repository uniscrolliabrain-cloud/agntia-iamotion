import { z } from 'zod';

export const ParticlePointer = z.strictObject({
  x: z.number().min(0).max(1), y: z.number().min(0).max(1),
  strength: z.number().int().min(0).max(2000),
  radius: z.number().min(.01).max(1),
});

export function normalizeParticlePointer(point: { clientX: number; clientY: number },
  rect: { left: number; top: number; width: number; height: number }, reducedMotion: boolean) {
  if (reducedMotion || !Number.isFinite(rect.width) || !Number.isFinite(rect.height) ||
      rect.width <= 0 || rect.height <= 0) return undefined;
  const parsed = ParticlePointer.safeParse({
    x: (point.clientX - rect.left) / rect.width, y: (point.clientY - rect.top) / rect.height,
    strength: 220, radius: .3,
  });
  return parsed.success ? parsed.data : undefined;
}
