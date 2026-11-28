interface ParticleSample {
  id: number;
  x: number;
  y: number;
  age: number;
}
export interface ParticleViewport {
  width: number;
  height: number;
  tier: 'compact' | 'standard';
}

export function layoutParticles(particles: readonly ParticleSample[], viewport: ParticleViewport) {
  const { width, height, tier } = viewport;
  if (![width, height].every((size) => Number.isFinite(size) && size > 0 && size <= 8192) ||
      !['compact', 'standard'].includes(tier)) return { ok: false, code: 'INVALID_PARTICLE_VIEWPORT' } as const;
  const cap = tier === 'compact' ? 96 : 180;
  if (particles.length > 512 ||
      particles.some(({ id, x, y, age }) => !Number.isSafeInteger(id) || id < 1 ||
        !Number.isInteger(age) || age < 0 || ![x, y].every((value) => value >= 0 && value <= 1))) {
    return { ok: false, code: 'INVALID_PARTICLE_SAMPLE' } as const;
  }
  const points = [...particles].sort((a, b) => a.id - b.id).slice(0, cap)
    .map(({ id, x, y, age }) => ({ id, x: x * width, y: y * height, age }));
  return { ok: true, viewport, points, omitted: particles.length - points.length } as const;
}
