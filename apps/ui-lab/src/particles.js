import { normalizeParticlePointer } from '../../../src/factory/graphics/particles/interaction.ts';
import { ParticleField } from '../../../src/factory/graphics/particles/simulate.ts';
import { layoutParticles } from '../../../src/factory/graphics/particles/layout.ts';
import { drawParticleField } from '../../../src/factory/graphics/particles/render.ts';

const canvas = document.querySelector('#field');
const button = document.querySelector('#toggle');
const label = document.querySelector('#field-status');
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const context = canvas.getContext('2d');
if (!context) {
  label.textContent = 'Vista gráfica no disponible.';
} else {
  const rate = 60;
  const spec = { schemaVersion: 1, seed: 941, capacity: 180, spawnPerTick: 5,
    lifetimeTicks: 110, tickRate: rate, maxSpeed: 9000, maxAcceleration: 400,
    gravity: [7, -11], attraction: 110, boundary: 'wrap' };
  const field = new ParticleField(spec);
  field.advance(45);
  let ticks = 45;
  let running = false;
  let visible = false;
  let stopped = false;
  let handle = 0;
  let previous;
  let remainder = 0;
  let pointer;
  function releasePointer() {
    pointer = undefined;
    delete canvas.dataset.pointer;
  }
  function setPointer(event) {
    pointer = normalizeParticlePointer(event, canvas.getBoundingClientRect(), motion.matches);
    if (pointer) canvas.dataset.pointer = 'active';
    else releasePointer();
  }
  const canAnimate = () => running && visible && !motion.matches && !document.hidden && !stopped;
  const draw = () => {
    if (stopped) return;
    const { width, height } = canvas.getBoundingClientRect();
    const layout = layoutParticles(field.sample(), { width, height, tier: width < 480 ? 'compact' : 'standard' });
    if (!layout.ok) return;
    const ratio = Math.min(devicePixelRatio, 2);
    const w = Math.round(width * ratio);
    const h = Math.round(height * ratio);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    drawParticleField(context, layout);
    canvas.dataset.tick = String(ticks);
    canvas.dataset.points = String(layout.points.length);
  };
  function update() {
    if (canAnimate()) {
      if (!handle) handle = requestAnimationFrame(frame);
    } else {
      cancelAnimationFrame(handle);
      handle = 0;
      previous = undefined;
    }
  }
  function frame(now) {
    handle = 0;
    if (!canAnimate()) return;
    if (previous !== undefined) remainder += Math.min(now - previous, 100) * rate / 1000;
    previous = now;
    const count = Math.floor(remainder);
    if (count) {
      field.advance(count, pointer);
      ticks += count;
      remainder -= count;
      draw();
    }
    update();
  }
  function syncStatus() {
    button.disabled = motion.matches || stopped;
    button.textContent = running ? 'Pausar' : 'Reproducir';
    label.textContent = stopped ? 'Vista gráfica no disponible.' : motion.matches ? 'Vista estática por preferencia de movimiento.' :
      running ? 'Simulación en reproducción.' : 'Vista pausada.';
    update();
  }
  function reduce() {
    if (motion.matches) {
      running = false;
      releasePointer();
    }
    syncStatus();
  }
  const resize = new ResizeObserver(draw);
  const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update(); });
  function dispose() {
    stopped = true;
    running = false;
    resize.disconnect();
    intersection.disconnect();
    button.onclick = null;
    canvas.removeEventListener('pointermove', setPointer);
    canvas.removeEventListener('pointerleave', releasePointer);
    canvas.removeEventListener('pointercancel', releasePointer);
    motion.removeEventListener('change', reduce);
    document.removeEventListener('visibilitychange', update);
    syncStatus();
  }
  canvas.addEventListener('pointermove', setPointer);
  canvas.addEventListener('pointerleave', releasePointer);
  canvas.addEventListener('pointercancel', releasePointer);
  button.onclick = () => { running = !running; syncStatus(); };
  motion.addEventListener('change', reduce);
  document.addEventListener('visibilitychange', update);
  canvas.addEventListener('contextlost', dispose, { once: true });
  window.addEventListener('pagehide', dispose, { once: true });
  resize.observe(canvas);
  intersection.observe(canvas);
  draw();
  syncStatus();
}
