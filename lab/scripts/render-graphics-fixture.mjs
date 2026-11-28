import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { z } from 'zod';
import { canonical } from './plan-library-migration.mjs';
import {
  CompositionProjectSchema, bindCompositionBehaviors, composeBehaviors, expandBehavior, negotiateGraphicsRenderer,
  planGraphicsCues, planGraphicsTextBehavior, prepareBarChart, prepareGraphicsText, resolveGraphicsLayout,
  resolveGraphicsFont, sampleCompositionFrame, serializeShapeSvg,
} from '../../dist/index.js';

const root = 'lab/staging/graphics-fixture';
await mkdir(root, { recursive: true });
await writeFile(join(root, 'composition-schema.json'),
  JSON.stringify(z.toJSONSchema(CompositionProjectSchema), null, 2) + '\n');
const hash = (value) => createHash('sha256').update(value).digest('hex');
const write = (name, value) => writeFile(join(root, name), value);
function must(result) {
  if (!result.ok) throw new Error(result.code);
  return result;
}
const escape = (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const fixture = {
  schemaVersion: 1, id: 'work-demo', scope: 'lab-synthetic', revision: 1, source: 'lab-fixture',
  synthetic: true, unit: 'tareas',
  rows: [{ id: 'review', label: 'Revisión', value: 42 }, { id: 'draft', label: 'Borrador', value: 28 },
    { id: 'delivery', label: 'Entrega', value: 16 }],
};
const headline = { schemaVersion: 1, sourceText: 'Seguimiento del trabajo',
  locale: 'es', direction: 'ltr', writingMode: 'horizontal-tb', spans: [] };
const title = must(prepareGraphicsText(headline)).accessibilityText;
const chart = must(await prepareBarChart({ id: fixture.id, scope: fixture.scope, revision: fixture.revision }, new Set([fixture.scope]),
  { read: async () => fixture }, { min: 0, max: 50 }));
const cues = must(planGraphicsCues({ durationTicks: 1500, audio: [], captions: [
  { id: 'fixture', channel: 'text', locale: 'es', startTick: 0, endTick: 1500, text: 'Datos sintéticos de demostración.' },
] }, new Set(), false));
const fonts = JSON.parse(await readFile(join(root, 'font-cmap.json'), 'utf8'));
const fontBase = '/usr/share/fonts/truetype/dejavu/';
const licensePath = '/usr/share/doc/fonts-dejavu-core/copyright';
const regularPath = fontBase + 'DejaVuSans.ttf';
const boldPath = fontBase + 'DejaVuSans-Bold.ttf';
const faces = new Map(await Promise.all([regularPath, boldPath].map(async (path) => {
  const bytes = await readFile(path);
  return [hash(bytes), bytes];
})));
const fontPermissions = new Set([hash(await readFile(licensePath))]);
const store = { read: async (id) => faces.get(id) };
const fontReceipt = {
  regular: must(await resolveGraphicsFont(fonts,
    cues.captions[0].text + 'Escala 0–50 · tareas' + chart.table.map(({ label, value }) => label + value).join(''),
    fontPermissions, store, { style: 'regular', embedding: false })).font,
  bold: must(await resolveGraphicsFont(fonts, title, fontPermissions, store,
    { style: 'bold', embedding: false })).font,
};
const renderer = { id: 'local-svg-chart', version: '1', features: new Set(['shape', 'text']) };
const visualId = 'v_9d7cbaa0-c4c9-4f0e-a193-a97ad9f812c3';
const context = { visualId, partIds: new Set(['title']), properties: new Set(['opacity']) };
const { spec } = must(expandBehavior({ schemaVersion: 1, behaviorId: 'show-bars', visualId,
  target: { kind: 'visual' }, primitive: 'reveal', intensity: 1, trigger: 'manual', state: 'manual',
  durationMs: 1000, loop: false, reducedMotion: { kind: 'static', at: 1 }, bounds: { maxDurationMs: 1000 },
  evidenceIds: [], status: 'proposed' }, context));
const textBehavior = must(planGraphicsTextBehavior(headline, {
  technique: 'run-fade', behaviorId: 'show-title', partId: 'title', durationMs: 375,
}, context));
const { timeline } = must(composeBehaviors({
  mode: 'parallel', clips: [{ spec }, { spec: textBehavior.spec }],
}, context));
const palette = ['#754da1', '#946fba', '#ae8aca'];
const pad = { top: 36, right: 36, bottom: 36, left: 36 };
const frameCount = 36;
const artifacts = [];
for (const [id, viewport] of Object.entries({
  landscape: { width: 960, height: 540 },
  portrait: { width: 540, height: 960 },
})) {
  const project = { schemaVersion: 1, rootId: 'scene', timebase: 1000,
    fps: { numerator: 24, denominator: 1 }, compositions: [{ id: 'scene', viewport, durationTicks: 1500,
      layers: [{ id: 'title', kind: 'text', text: title, inTick: 0, outTick: 1500 },
        { id: 'bars', kind: 'shape', shapeId: 'chart', inTick: 0, outTick: 1500 }] }] };
  const capabilities = must(negotiateGraphicsRenderer(project, renderer));
  await write(`${id}-project.json`, canonical(project) + '\n');
  const binding = must(bindCompositionBehaviors(project, 'scene', timeline, new Map([['visual', 'bars'], ['part:title', 'title']])));
  const layout = must(resolveGraphicsLayout({
    viewport, safeArea: pad,
    layers: [{ id: 'plot', parentId: null, rule: {
      minWidth: 200, maxWidth: viewport.width, minHeight: 256, maxHeight: viewport.height,
      horizontal: 'center', vertical: 'center', overflow: 'reject', padding: { top: 0, left: 0, right: 0, bottom: 0 },
    } }],
  }, (_layer, limits) => ({ width: limits.width, height: 296 })));
  const { x, y, width } = layout.layers[0].bounds;
  const samples = [];
  const filename = (frame) => `frame-${String(frame).padStart(3, '0')}.svg`;
  await mkdir(join(root, id), { recursive: true });
  for (let frame = 0; frame < frameCount; frame++) {
    const sample = sampleCompositionFrame(binding, frame);
    const opacity = sample.properties.find(({ layerId }) => layerId === 'bars').value;
    const textOpacity = sample.properties.find(({ layerId }) => layerId === 'title').value;
    const bars = chart.marks.map(({ proportion }, index) => {
      const yBar = y + 26 + index * 95;
      const trackWidth = width - 55;
      const item = chart.table[index];
      const { svg } = must(serializeShapeSvg({ schemaVersion: 1,
        geometry: { kind: 'rect', x: 0, y: 0, width: trackWidth * proportion, height: 22, radius: 8 },
        fill: palette[index], stroke: 'none', strokeWidth: 0 }, { width: trackWidth, height: 22 }));
      return `<text x="${x}" y="${yBar - 9}" font-size="20">${escape(item.label)}</text>
        <rect x="${x}" y="${yBar}" width="${trackWidth}" height="22" rx="8" fill="#ece4f1"/>
        <g opacity="${opacity}"><svg x="${x}" y="${yBar}" width="${trackWidth}" height="22">${svg}</svg></g>
        <text x="${x + trackWidth + 12}" y="${yBar + 17}" font-size="18">${item.value}</text>`;
    }).join('');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${viewport.width}" height="${viewport.height}" viewBox="0 0 ${viewport.width} ${viewport.height}">
      <rect width="100%" height="100%" fill="#f9f4ed"/>
      <g font-family="DejaVu Sans" fill="#271a32">
      <text x="${x}" y="67" font-size="29" font-weight="bold" opacity="${textOpacity}">${escape(title)}</text>
      <text x="${x}" y="101" font-size="17">${escape(cues.captions[0].text)}</text>${bars}
      <text x="${x}" y="${viewport.height - 40}" font-size="16">Escala 0–50 · ${chart.unit}</text>
      </g></svg>\n`;
    await write(join(id, filename(frame)), svg);
    if (frame === frameCount - 1) {
      const chartSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${viewport.width}" height="280"
        viewBox="0 ${y - 10} ${viewport.width} 280"><g font-family="DejaVu Sans" fill="#271a32">${bars}</g></svg>\n`;
      await write(join(id, 'plot.svg'), chartSvg);
    }
    samples.push({ frame, opacity, textOpacity, sha256: hash(svg) });
  }
  artifacts.push({ id, viewport, projectHash: hash(canonical(project)), layout: layout.layers[0].bounds, capabilities, samples });
}
const rows = chart.table.map(({ label, value }) => `<tr><th scope="row">${escape(label)}</th><td>${value}</td></tr>`).join('');
await write('index.html', `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escape(title)}</title><style>
body {font: 1rem system-ui; background:#f9f4ed; color:#271a32; max-width:62rem; margin:auto; padding:1rem;}
figure {margin:1.5rem 0} figcaption {margin:.6rem 0} picture img {max-width:100%; height:auto; display:block} table {border-collapse:collapse; width:100%; max-width:30rem}
th,td {padding:.65rem; border-bottom:1px solid #998da0; text-align:left}
</style><main><h1>${escape(title)}</h1><p>${escape(cues.captions[0].text)}</p>
<figure><picture aria-hidden="true"><source media="(max-width: 600px)" srcset="portrait/plot.svg"><img src="landscape/plot.svg" alt=""></picture><figcaption>Escala 0–50 · tareas</figcaption></figure>
<table><caption>Tareas por estado</caption><thead><tr><th scope="col">Estado</th><th scope="col">Tareas</th></tr></thead>
<tbody>${rows}</tbody></table></main></html>\n`);
await write('captions.vtt', `WEBVTT\n\n00:00:00.000 --> 00:00:01.500\n${cues.captions[0].text}\n`);
await write('manifest.json', JSON.stringify({ schemaVersion: 1, sampleKind: 'synthetic',
  datasetHash: hash(JSON.stringify(fixture)), datasetRevision: chart.revision, title, font: fontReceipt,
  captions: cues.captions, mode: cues.mode, artifacts }, null, 2) + '\n');
