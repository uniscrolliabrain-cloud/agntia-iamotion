import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { setTimeout as wait } from 'node:timers/promises';
import { openFixtureBrowser, waitForBrowserCondition } from './browser-fixture-client.mjs';

const port = Number(process.argv[2] ?? 9228);
const url = 'http://127.0.0.1:4178/agntia-iamotion/particles.html';
const { send, inspect, close } = await openFixtureBrowser(port);
const ticks = () => inspect('Number(document.querySelector("#field")?.dataset.tick)');
const dimensions = (width, height) => send('Emulation.setDeviceMetricsOverride',
  { width, height, mobile: false, deviceScaleFactor: 1 });
const changeMotion = (value) => send('Emulation.setEmulatedMedia', {
  features: [{ name: 'prefers-reduced-motion', value }],
});
try {
  await dimensions(940, 850);
  await send('Page.navigate', { url });
  await waitForBrowserCondition(async () => await ticks() === 45);
  assert.equal(await inspect('Number(document.querySelector("#field").dataset.points)'), 180);
  const pick = (recipe) => inspect(`(() => {
    const select = document.querySelector('#recipe');
    select.value = '${recipe}'; select.dispatchEvent(new Event('change'));
  })()`);
  for (const [recipe, count] of [['flow', 150], ['attraction', 128], ['ambient', 180]]) {
    await pick(recipe);
    assert.equal(await inspect('document.querySelector("#field").dataset.recipe'), recipe);
    assert.equal(await inspect('Number(document.querySelector("#field").dataset.points)'), count);
    assert.equal(await ticks(), 45);
  }
  await inspect('document.querySelector("#toggle").click()');
  await waitForBrowserCondition(async () => await ticks() > 50);
  await inspect(`(() => {
    const canvas = document.querySelector('#field');
    const rect = canvas.getBoundingClientRect();
    canvas.dispatchEvent(new PointerEvent('pointermove', {
      clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2,
    }));
  })()`);
  assert.equal(await inspect('document.querySelector("#field").dataset.pointer'), 'active');
  await inspect('document.querySelector("#field").dispatchEvent(new PointerEvent("pointercancel"))');
  assert.equal(await inspect('document.querySelector("#field").dataset.pointer'), undefined);
  const timing = await inspect(`new Promise(done => {
    const times = []; let last;
    function frame(now) {
      if (last !== undefined) times.push(now - last);
      last = now;
      if (times.length < 90) requestAnimationFrame(frame);
      else done(times);
    }
    requestAnimationFrame(frame);
  })`);
  assert.equal(timing.length, 90);
  const sorted = [...timing].sort((a, b) => a - b);
  const quantile = (n) => sorted[Math.ceil(sorted.length * n) - 1];
  await inspect(`(() => {
    const spacer = document.createElement('div');
    spacer.id = 'smoke-spacer'; spacer.style.height = '2400px';
    document.body.append(spacer); window.scrollTo(0, 2400);
  })()`);
  await wait(300);
  const offscreenTick = await ticks();
  await wait(180);
  assert.equal(await ticks(), offscreenTick);
  await inspect('document.querySelector("#smoke-spacer").remove(); window.scrollTo(0, 0)');
  await waitForBrowserCondition(async () => await ticks() > offscreenTick);
  await dimensions(400, 860);
  await waitForBrowserCondition(async () => await inspect('Number(document.querySelector("#field").dataset.points)') === 96);
  await changeMotion('reduce');
  await waitForBrowserCondition(() => inspect('document.querySelector("#toggle").disabled'));
  const reducedTick = await ticks();
  await wait(180);
  assert.equal(await ticks(), reducedTick);
  const screenshot = await send('Page.captureScreenshot', { format: 'png' });
  await writeFile('lab/staging/graphics-fixture/particles-browser.png', Buffer.from(screenshot.data, 'base64'));
  const version = await send('Browser.getVersion', {});
  console.log(JSON.stringify({ status: 'passed', engine: version.product, viewport: [940, 850],
    framesMeasured: 90, frameIntervalMs: { p50: quantile(.5), p95: quantile(.95), p99: quantile(.99) },
    particleCounts: { standard: 180, compact: 96 }, recipes: ['ambient', 'flow', 'attraction'], offscreenPause: true, pointerCancel: true,
    reducedMotion: 'static', sampleKind: 'synthetic', device: 'headless-sandbox' }, null, 2));
} finally {
  close();
}
