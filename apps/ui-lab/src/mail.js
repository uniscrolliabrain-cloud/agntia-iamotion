import {
  AmbientLight, AnimationMixer, DirectionalLight, LoopOnce, OrthographicCamera, Scene,
  WebGLRenderer,
} from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const stage = document.querySelector('#stage');
const status = document.querySelector('#status');
const buttons = [...document.querySelectorAll('[data-clip]')];
const base = import.meta.env.BASE_URL;
const motion = matchMedia('(prefers-reduced-motion: reduce)');

function useFallback(message) {
  const image = new Image();
  image.alt = '';
  image.onload = () => { stage.replaceChildren(image); stage.dataset.preview = 'static'; };
  image.onerror = () => { stage.replaceChildren(); stage.dataset.preview = 'unavailable'; };
  image.src = `${base}ceramic-mail/ceramic-mail.png`;
  status.textContent = message;
  for (const button of buttons) button.disabled = true;
}

async function start() {
  if (motion.matches) {
    useFallback('Vista estática. Movimiento reducido activo.');
    return;
  }

  const model = await new GLTFLoader().loadAsync(`${base}ceramic-mail/ceramic-mail.glb`);
  const actions = new Map();
  const mixer = new AnimationMixer(model.scene);
  for (const clip of model.animations) actions.set(clip.name, mixer.clipAction(clip));
  if (buttons.some((button) => !actions.has(button.dataset.clip))) throw new Error('Faltan clips');

  const renderer = new WebGLRenderer({ antialias: true, alpha: true });
  const scene = new Scene();
  scene.add(model.scene, new AmbientLight(0xffede1, 2));
  const key = new DirectionalLight(0xfff0e3, 2.5);
  key.position.set(3, 5, 4);
  scene.add(key);
  const camera = new OrthographicCamera(-1, 1, 1, -1, .1, 30);
  camera.position.set(3.1, 2.6, 6.5);
  camera.lookAt(0, 0, 0);

  let frame = 0;
  let active;
  let previous;
  let visible = true;
  function stopFrame() {
    cancelAnimationFrame(frame);
    frame = 0;
    previous = undefined;
  }
  function schedule() {
    if (!frame && active?.isRunning() && visible && !document.hidden) {
      frame = requestAnimationFrame(tick);
    }
  }
  function tick(now) {
    frame = 0;
    mixer.update(previous === undefined ? 0 : Math.min((now - previous) / 1000, .05));
    previous = now;
    renderer.render(scene, camera);
    schedule();
  }
  function resize() {
    const { clientWidth: width, clientHeight: height } = stage;
    if (!width || !height) return;
    camera.left = -1.75 * width / height;
    camera.right = -camera.left;
    camera.top = 1.75;
    camera.bottom = -camera.top;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(2, devicePixelRatio));
    renderer.setSize(width, height, false);
    renderer.render(scene, camera);
  }
  function visibility() {
    if (!visible || document.hidden) stopFrame();
    else schedule();
  }
  const sizes = new ResizeObserver(resize);
  const intersection = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    visibility();
  });
  function dispose() {
    stopFrame();
    sizes.disconnect();
    intersection.disconnect();
    motion.removeEventListener('change', reduceMotion);
    document.removeEventListener('visibilitychange', visibility);
    renderer.domElement.removeEventListener('webglcontextlost', contextLost);
    window.removeEventListener('pagehide', dispose);
    mixer.stopAllAction();
    model.scene.traverse((object) => {
      object.geometry?.dispose();
      for (const material of [object.material].flat()) material?.dispose();
    });
    renderer.dispose();
    for (const button of buttons) button.onclick = null;
  }
  function contextLost() {
    dispose();
    useFallback('Vista estática. El navegador perdió el contexto 3D.');
  }
  function reduceMotion(event) {
    if (!event.matches) return;
    dispose();
    useFallback('Vista estática. Movimiento reducido activo.');
  }
  if (motion.matches) {
    reduceMotion(motion);
    return;
  }

  stage.replaceChildren(renderer.domElement);
  resize();
  sizes.observe(stage);
  intersection.observe(stage);
  document.addEventListener('visibilitychange', visibility);
  motion.addEventListener('change', reduceMotion);
  window.addEventListener('pagehide', dispose, { once: true });
  renderer.domElement.addEventListener('webglcontextlost', contextLost, { once: true });
  for (const button of buttons) {
    button.disabled = false;
    button.onclick = () => {
      active?.stop();
      stopFrame();
      active = actions.get(button.dataset.clip);
      active.reset().setLoop(LoopOnce, 1);
      active.clampWhenFinished = true;
      active.play();
      stage.dataset.clip = button.dataset.clip;
      schedule();
    };
  }
  stage.dataset.preview = 'ready';
  status.textContent = 'Modelo 3D listo.';
}

start().catch(() => useFallback('Modelo 3D no disponible. Genera la muestra local para previsualizarla.'));
