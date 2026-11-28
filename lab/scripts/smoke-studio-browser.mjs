import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { openFixtureBrowser, waitForBrowserCondition as until } from './browser-fixture-client.mjs';

const portal = 'http://127.0.0.1:4178/agntia-iamotion/studio.html';
const port = Number(process.argv[2] ?? 9228);
const { send, inspect, close } = await openFixtureBrowser(port);
const root = 'lab/staging/studio-fixture';
const size = (width, height) => send('Emulation.setDeviceMetricsOverride',
  { width, height, mobile: false, deviceScaleFactor: 1 });
const reduced = () => send('Emulation.setEmulatedMedia',
  { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
const activeScene = () => inspect('document.querySelector("#deck article:not([hidden])").dataset.scene');
try {
  await mkdir(root, { recursive: true });
  await send('Emulation.setEmulatedMedia',
    { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
  await size(1050, 1000);
  await send('Page.navigate', { url: portal });
  await until(() => inspect('document.querySelectorAll("#graph-nodes button").length === 3'));
  assert.deepEqual(await inspect('Array.from(document.querySelectorAll("#graph-table td"), el => el.textContent)'),
    ['28', '42', '16']);
  await inspect('document.querySelectorAll("#graph-nodes button")[1].click()');
  assert.equal(await inspect('document.querySelector("#edge-first").dataset.active'), 'true');
  assert.equal(await inspect('document.querySelector("#edge-second").dataset.active'), 'false');
  assert.equal(await inspect('document.querySelector("#graph-selection").textContent'), 'Revisión: 42 tareas.');
  await inspect('document.querySelector("#reveal").click()');
  assert.equal(await inspect('document.querySelector("#type-stage").dataset.run'), '1');
  assert.notEqual(await inspect('getComputedStyle(document.querySelector("#type-stage p")).animationName'), 'none');
  assert.deepEqual(await inspect('Array.from(document.querySelectorAll("#type-stage p"), node => node.textContent)'),
    ['De borrador a entrega.', 'من المسودة إلى التسليم.']);

  await inspect('document.querySelector("#action").focus()');
  assert.equal(await inspect('document.activeElement.id'), 'action');
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: ' ', code: 'Space',
    windowsVirtualKeyCode: 32, nativeVirtualKeyCode: 32, text: ' ' });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: ' ', code: 'Space',
    windowsVirtualKeyCode: 32, nativeVirtualKeyCode: 32 });
  assert.equal(await inspect('document.querySelector("#action").dataset.activations'), '1');
  await until(() => inspect('document.querySelector("#action-status").textContent === "Vista preparada."'));
  await inspect('document.querySelector("#lock-button").click(); document.querySelector("#action").click()');
  assert.equal(await inspect('document.querySelector("#action").disabled'), true);
  assert.equal(await inspect('document.querySelector("#action").dataset.activations'), '1');
  await inspect('document.querySelector("#lock-button").click()');

  await reduced();
  await inspect('document.querySelector("#reveal").click()');
  assert.equal(await inspect('getComputedStyle(document.querySelector("#type-stage p")).animationName'), 'none');
  await size(390, 820);
  assert.equal(await inspect('document.documentElement.scrollWidth <= window.innerWidth'), true);
  await size(1050, 1100);
  await until(() => inspect('document.querySelector("#deck-mail").naturalWidth > 0'));

  const scenes = [];
  for (const format of ['wide', 'tall']) {
    await inspect(`(() => {
      const select = document.querySelector('#format');
      select.value = '${format}'; select.dispatchEvent(new Event('change'));
    })()`);
    for (const [index, id] of ['mail', 'words', 'data'].entries()) {
      await inspect(`(() => {
        const input = document.querySelector('#seek');
        input.value = ${index * 100}; input.dispatchEvent(new Event('input'));
        document.querySelector('#deck').scrollIntoView({block:'center'});
      })()`);
      assert.equal(await activeScene(), id);
      const bounds = await inspect(`(() => {
        const r = document.querySelector('#deck').getBoundingClientRect();
        return {x:r.left+scrollX, y:r.top+scrollY, width:r.width, height:r.height, scale:1};
      })()`);
      assert.ok(Math.abs(bounds.width / bounds.height - (format === 'wide' ? 16 / 9 : 9 / 16)) < .01);
      const screenshot = await send('Page.captureScreenshot', { format: 'png', clip: bounds, captureBeyondViewport: true });
      await writeFile(`${root}/${format}-${index}.png`, Buffer.from(screenshot.data, 'base64'));
      scenes.push({ format, id, frame: index * 100, width: bounds.width, height: bounds.height });
    }
  }
  await inspect('document.querySelector("#prev-scene").click()');
  assert.equal(await activeScene(), 'words');
  const version = await send('Browser.getVersion', {});
  console.log(JSON.stringify({ status: 'passed', engine: version.product, synthetic: true,
    graphValues: [28, 42, 16], exactText: true, keyboardActivation: true, reducedMotion: true, scenes }, null, 2));
} finally {
  close();
}
