import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { openFixtureBrowser, waitForBrowserCondition as until } from './browser-fixture-client.mjs';

const port = Number(process.argv[2] ?? 9227);
const url = 'http://127.0.0.1:4177/index.html';
const root = resolve('lab/staging/graphics-fixture');
const { send, inspect, close } = await openFixtureBrowser(port);

const checks = [];
try {
  for (const [width, height, layout] of [[960, 1030, 'landscape'], [400, 1120, 'portrait']]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height, mobile: false, deviceScaleFactor: 1 });
    await send('Page.navigate', { url: url });
    await until(() => inspect(`document.querySelector('img')?.complete &&
      document.querySelector('img')?.currentSrc.endsWith('/${layout}/plot.svg')`));
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
  const version = await send('Browser.getVersion', {});
  console.log(JSON.stringify({ status: 'passed', engine: version.product, checks }, null, 2));
} catch (error) {
  const page = await inspect(`({ url: location.href, title: document.title,
    image: document.querySelector('img')?.currentSrc, width: window.innerWidth })`);
  throw new Error(JSON.stringify(page), { cause: error });
} finally {
  close();
}
