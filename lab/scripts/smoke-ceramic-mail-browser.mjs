import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';

const [, , port = '9222', url = 'http://127.0.0.1:4173/agntia-iamotion/'] = process.argv;
const deadline = Date.now() + 15_000;
async function until(check) {
  while (Date.now() < deadline) {
    if (await check()) return;
    await delay(150);
  }
  throw new Error('Timed out waiting for Chromium preview');
}

let tab;
await until(async () => {
  try {
    const tabs = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
    tab = tabs.find(({ type }) => type === 'page');
    return Boolean(tab);
  } catch {
    return false;
  }
});
const socket = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true });
  socket.addEventListener('error', reject, { once: true });
});
let sequence = 0;
const pending = new Map();
socket.addEventListener('message', ({ data }) => {
  const { id, result, error } = JSON.parse(data);
  if (!pending.has(id)) return;
  const { resolve, reject } = pending.get(id);
  pending.delete(id);
  if (error) reject(new Error(error.message));
  else resolve(result);
});
function send(method, params = {}) {
  const id = ++sequence;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
}
async function evaluate(expression) {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
}

try {
  await send('Page.navigate', { url });
  await until(async () => {
    const state = await evaluate('document.querySelector("#stage")?.dataset.preview');
    if (state && state !== 'pending' && state !== 'ready') {
      throw new Error(`Model failed to initialize: ${state}`);
    }
    return state === 'ready';
  });
  assert.equal(await evaluate('document.querySelectorAll("#stage canvas").length'), 1);
  const clip = await evaluate(`JSON.parse(JSON.stringify(
    document.querySelector('#stage').getBoundingClientRect()
  ))`);
  const screenshot = () => send('Page.captureScreenshot', {
    format: 'png',
    clip: { x: clip.x, y: clip.y, width: clip.width, height: clip.height, scale: 1 },
  });
  const closed = await screenshot();
  assert.equal(await evaluate(`
    document.querySelector('[data-clip="open"]').click();
    document.querySelector('#stage').dataset.clip;
  `), 'open');
  await delay(1150);
  const opened = await screenshot();
  assert.notEqual(opened.data, closed.data, 'Opening must change the pixels rendered inside the stage');

  await evaluate(`document.querySelector('[data-clip="float"]').click()`);
  await until(async () => {
    const style = await evaluate('document.querySelector("#stage canvas").style.transform');
    return style && style !== 'translateY(0px)';
  });

  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await until(async () => await evaluate('document.querySelector("#stage").dataset.preview') === 'static');
  assert.equal(await evaluate('document.querySelector("#stage img").naturalWidth'), 420);
  assert.equal(await evaluate('document.querySelectorAll("button:disabled").length'), 4);
  console.log('Chromium: GLB loaded in WebGL, opening clip and composed float timeline verified, reduced-motion PNG displayed.');
} finally {
  socket.close();
}
