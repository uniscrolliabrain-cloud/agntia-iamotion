import { surfaceTarget, sampleSurface, surfaceCss } from '../../../src/factory/materials/surface.ts';
import { parseHex, readableSurfaceAlpha } from '../../../src/factory/materials/contrast.ts';

// Canonical Agntia colours. The surface may become translucent; the content on it
// may not, so the alpha is floored by a contrast guarantee instead of a taste call.
const SURFACE_HEX = '#fffaf5';
const INK_HEX = '#242421';
const LABEL_HEX = '#6e6c66';

// Inspection states. `disabled` and `reduced` are policy variants of the existing
// engine stages, not new poses: intensity attenuates the target and reduced motion
// zeroes elevation and tilt inside surfaceTarget.
const STATES = [
  { id: 'base', label: 'Base', stage: 0, intensity: 1, summary: 'Papel editorial' },
  { id: 'hover', label: 'Hover', stage: 1, intensity: 1, summary: 'Cerámica satinada' },
  { id: 'focus', label: 'Focus', stage: 2, intensity: 1, summary: 'Cristal suave' },
  { id: 'press', label: 'Press', stage: 3, intensity: 1, summary: 'Cristal profundo' },
  { id: 'selected', label: 'Selected', stage: 2, intensity: 0.8, summary: 'Esmalte violeta' },
  { id: 'disabled', label: 'Disabled', stage: 0, intensity: 0.45, summary: 'Papel atenuado' },
  { id: 'reduced', label: 'Reduced motion', stage: 1, intensity: 1, reducedMotion: true, summary: 'Cerámica sin movimiento' },
];

const GROUNDS = [
  { id: 'paper', label: 'Papel', hex: '#f2efe8' },
  { id: 'sand', label: 'Arena', hex: '#ece4d6' },
  { id: 'lavender', label: 'Lavanda', hex: '#f0ecfc' },
  { id: 'ink', label: 'Tinta', hex: '#211f1c' },
];

const LIGHTINGS = [
  { id: 'diffuse', label: 'Luz difusa' },
  { id: 'direct', label: 'Luz directa' },
];

const DURATION_MS = 320;
const round = (value) => Math.round(value * 1e4) / 1e4;

export function mountMaterialSurface(root) {
  const stage = root.querySelector('[data-stage]');
  const panel = root.querySelector('[data-material-panel]');
  const status = root.querySelector('[data-material-status]');
  const spec = root.querySelector('[data-material-spec]');
  const rack = root.querySelector('.rack');
  const grounds = root.querySelector('[data-grounds]');
  const lightings = root.querySelector('[data-lightings]');
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  const glass = CSS.supports('backdrop-filter', 'blur(1px)');

  let pinned = 'base';
  let preview = null;
  let pose = surfaceTarget(0, policyFor(STATES[0]));
  let frame = 0;
  let disposed = false;

  function stateOf(id) {
    return STATES.find((state) => state.id === id) ?? STATES[0];
  }

  function policyFor(state) {
    return {
      glass,
      spatial: true,
      reducedMotion: media.matches || Boolean(state.reducedMotion),
      intensity: state.intensity,
    };
  }

  function groundOf(id) {
    return (GROUNDS.find((ground) => ground.id === id) ?? GROUNDS[0]).hex;
  }

  function alphaGuard(groundHex) {
    const surface = parseHex(SURFACE_HEX);
    const ground = parseHex(groundHex);
    return Math.max(
      readableSurfaceAlpha(pose.opacity, surface, ground, parseHex(INK_HEX)),
      readableSurfaceAlpha(pose.opacity, surface, ground, parseHex(LABEL_HEX)),
    );
  }

  function paint() {
    const css = surfaceCss(pose, glass);
    css['--ag-motion-surface'] = `rgba(255,250,245,${alphaGuard(groundOf(stage.dataset.ground))})`;
    for (const [key, value] of Object.entries(css)) panel.style.setProperty(key, value);
  }

  function describe(state) {
    const policy = policyFor(state);
    return JSON.stringify({
      state: state.id,
      stage: state.stage,
      intensity: state.intensity,
      ground: stage.dataset.ground,
      lighting: stage.dataset.lighting,
      requestedOpacity: round(pose.opacity),
      effectiveAlpha: round(alphaGuard(groundOf(stage.dataset.ground))),
      policy,
      pose: Object.fromEntries(Object.entries(pose).map(([key, value]) => [key, round(value)])),
    }, null, 2);
  }

  function settle() {
    const state = stateOf(preview ?? pinned);
    const policy = policyFor(state);
    const target = surfaceTarget(state.stage, policy);
    const duration = policy.reducedMotion ? 0 : DURATION_MS;
    cancelAnimationFrame(frame);
    const from = pose;
    const start = performance.now();

    const tick = (now) => {
      if (disposed) return;
      pose = sampleSurface(from, target, now - start, duration);
      paint();
      if (now - start < duration) frame = requestAnimationFrame(tick);
      else pose = target;
      spec.textContent = describe(state);
    };

    if (duration === 0) {
      pose = target;
      paint();
      spec.textContent = describe(state);
    } else {
      tick(start);
    }
    status.textContent = state.summary + (glass ? '' : ' · fallback opaco') +
      (policy.reducedMotion ? ' · sin movimiento' : '');
    panel.setAttribute('aria-disabled', String(state.id === 'disabled'));
    panel.dataset.materialState = state.id;
    for (const button of rack.querySelectorAll('button')) {
      button.setAttribute('aria-pressed', String(button.dataset.state === pinned));
    }
  }

  function setPreview(id) {
    if (preview === id) return;
    preview = id;
    settle();
  }

  // Control racks: typed data, no evaluated strings.
  for (const state of STATES) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = state.label;
    button.dataset.state = state.id;
    button.setAttribute('aria-pressed', String(state.id === pinned));
    button.addEventListener('click', () => {
      pinned = state.id;
      preview = null;
      settle();
    });
    rack.append(button);
  }

  for (const ground of GROUNDS) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = ground.label;
    button.setAttribute('aria-pressed', String(stage.dataset.ground === ground.id));
    button.addEventListener('click', () => {
      stage.dataset.ground = ground.id;
      for (const other of grounds.querySelectorAll('button')) {
        other.setAttribute('aria-pressed', String(other === button));
      }
      settle();
    });
    grounds.append(button);
  }

  for (const lighting of LIGHTINGS) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = lighting.label;
    button.setAttribute('aria-pressed', String(stage.dataset.lighting === lighting.id));
    button.addEventListener('click', () => {
      stage.dataset.lighting = lighting.id;
      for (const other of lightings.querySelectorAll('button')) {
        other.setAttribute('aria-pressed', String(other === button));
      }
      settle();
    });
    lightings.append(button);
  }

  const onEnter = () => setPreview('hover');
  const onLeave = () => setPreview(null);
  const onFocus = () => setPreview('focus');
  const onBlur = () => setPreview(null);
  const onDown = () => setPreview('press');
  const onUp = () => setPreview(null);

  panel.addEventListener('pointerenter', onEnter);
  panel.addEventListener('pointerleave', onLeave);
  panel.addEventListener('focus', onFocus);
  panel.addEventListener('blur', onBlur);
  panel.addEventListener('pointerdown', onDown);
  panel.addEventListener('pointerup', onUp);
  panel.addEventListener('pointercancel', onUp);
  media.addEventListener('change', settle);

  paint();
  settle();

  return () => {
    disposed = true;
    cancelAnimationFrame(frame);
    panel.removeEventListener('pointerenter', onEnter);
    panel.removeEventListener('pointerleave', onLeave);
    panel.removeEventListener('focus', onFocus);
    panel.removeEventListener('blur', onBlur);
    panel.removeEventListener('pointerdown', onDown);
    panel.removeEventListener('pointerup', onUp);
    panel.removeEventListener('pointercancel', onUp);
    media.removeEventListener('change', settle);
    rack.replaceChildren();
    grounds.replaceChildren();
    lightings.replaceChildren();
  };
}
