import type { layoutParticles } from './layout.js';

type Plot = Extract<ReturnType<typeof layoutParticles>, { ok: true }>;

export function drawParticleField(context: CanvasRenderingContext2D, plot: Plot) {
  const { width, height } = plot.viewport;
  context.fillStyle = '#221832';
  context.fillRect(0, 0, width, height);
  context.fillStyle = '#f6d4a6';
  context.beginPath();
  for (const { x, y, age } of plot.points) {
    const radius = age < 15 ? 1.2 : 2.1;
    context.moveTo(x + radius, y);
    context.arc(x, y, radius, 0, 2 * Math.PI);
  }
  context.fill();
}
