import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { setTimeout as wait } from 'node:timers/promises';

const port = Number(process.argv[2] ?? 9227);
const url = 'http://127.0.0.1:4177/index.html';
const root = resolve('lab/staging/graphics-fixture');
const until = async (fn) => {
  for (let i = 0; i < 60; i++) {
    try {
      const value = await fn();
      if (value) return value;
    } catch {
      // Chromium may still be starting or navigating.
    }
    await wait(100);
  }
  throw new Error('GRAPHICS_BROWSER_TIMEOUT');
};
const tab = await until(async () =>
  (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(({ type }) => type === 'page'));
const socket = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((open, reject) => {
  socket.addEventListener('open', open, { once: true });
  socket.addEventListener('error', reject, { once: true });
});
let sequence = 0;
const pending = new Map();
socket.addEventListener('message', ({ data }) => {
  const { id, result, error } = JSON.parse(data);
  const match = pending.get(id);
  if (!match) return;
  pending.delete(id);
  if (error) match.reject(new Error(error.message));
  else match.accept(result);
});
const send = (method, params) => new Promise((accept, reject) => {
  const id = ++sequence;
  pending.set(id, { accept, reject });
  socket.send(JSON.stringify({ id, method, params }));
});
const inspect = async (expression) =>
  (await send('Runtime.evaluate', { expression, returnByValue: true })).result.value;

const checks = [];
try {
  for (const [width, height, layout] of [[960, 1030, 'landscape'], [400, 1120, 'portrait']]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height, mobile: false, deviceScaleFactor: 1 });
    await send('Page.navigate', { url: url });
    await until(() => inspect(`document.querySelector('img')?.complete &&
      document.querySelector('img')?.currentSrc.endsWith('/${layout}/frame-035.svg')`));
    const result = await inspect(`({
      title: document.querySelector('h1').textContent,
      values: Array.from(document.querySelectorAll('tbody td'), item => item.textContent),
      noHorizontalOverflow: document.documentElement.scrollWidth <= window.innerWidth,
      naturalWidth: document.querySelector('img').naturalWidth,
      caption: document.querySelector('main p').textContent,
    })`);
    assert.deepEqual(result.values, ['42', '28', '16']);
    assert.equal(result.noHorizontalOverflow, true);
    assert.equal(result.naturalWidth, layout === 'landscape' ? 960 : 540);
    assert.equal(result.title, 'Seguimiento del trabajo');
    assert.equal(result.caption, 'Datos sintéticos de demostración.');
    const screenshot = await send('Page.captureScreenshot', { format: 'png' });
    await writeFile(resolve(root, `browser-${layout}.png`), Buffer.from(screenshot.data, 'base64'));
    checks.push({ layout, viewport: { width, height }, ...result });
  }
  console.log(JSON.stringify({ status: 'passed', checks }, null, 2));
} catch (error) {
  const page = await inspect(`({ url: location.href, title: document.title,
    image: document.querySelector('img')?.currentSrc, width: window.innerWidth })`);
  throw new Error(JSON.stringify(page), { cause: error });
} finally {
  socket.close();
}
