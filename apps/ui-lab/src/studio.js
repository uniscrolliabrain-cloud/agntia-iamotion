import { prepareBarChart } from '../../../src/factory/graphics/data.ts';
import { prepareGraphicsText } from '../../../src/factory/graphics/text.ts';
import { layerContainsFrame, validateCompositionProject } from '../../../src/factory/graphics/composition.ts';

const element = (id) => document.getElementById(id);
const rows = [
  { id: 'draft', label: 'Borrador', value: 28 },
  { id: 'review', label: 'Revisión', value: 42 },
  { id: 'delivery', label: 'Entrega', value: 16 },
];
const scope = 'lab-synthetic';
const request = { id: 'workflow', scope, revision: 1 };
const chart = await prepareBarChart(request, new Set([scope]), { read: async () =>
  ({ schemaVersion: 1, ...request, source: 'demo', synthetic: true, unit: 'tareas', rows }) }, { min: 0, max: 50 });
if (!chart.ok) throw new Error(chart.code);
element('graph-source').textContent = `Datos sintéticos · revisión ${chart.revision}`;
const nodes = chart.table.map((row, index) => {
  const node = document.createElement('button');
  node.type = 'button';
  node.textContent = row.label;
  const tr = element('graph-table').insertRow();
  const label = document.createElement('th');
  label.scope = 'row';
  label.textContent = row.label;
  tr.append(label);
  tr.insertCell().textContent = String(row.value);
  const item = document.createElement('li');
  const itemLabel = document.createElement('span');
  const amount = document.createElement('strong');
  itemLabel.textContent = row.label;
  amount.textContent = String(row.value);
  item.append(itemLabel, amount);
  item.style.setProperty('--filled', `${chart.marks[index].proportion * 100}%`);
  element('deck-data').append(item);
  node.onclick = () => selectNode(index);
  element('graph-nodes').append(node);
  return node;
});
function selectNode(index) {
  for (const [i, node] of nodes.entries()) node.setAttribute('aria-pressed', String(i === index));
  element('edge-first').dataset.active = String(index >= 1);
  element('edge-second').dataset.active = String(index >= 2);
  const row = chart.table[index];
  element('graph-selection').textContent = `${row.label}: ${row.value} tareas.`;
}
selectNode(0);

const stage = element('type-stage');
for (const run of stage.querySelectorAll('p')) {
  const validated = prepareGraphicsText({ schemaVersion: 1, sourceText: run.textContent,
    locale: run.lang, direction: run.dir, writingMode: 'horizontal-tb', spans: [] });
  if (!validated.ok) throw new Error(validated.code);
}
element('reveal').onclick = () => {
  stage.dataset.active = 'false';
  for (const run of stage.querySelectorAll('p')) for (const animation of run.getAnimations()) animation.cancel();
  void stage.offsetWidth;
  stage.dataset.active = 'true';
  stage.dataset.run = String(Number(stage.dataset.run) + 1);
};

const action = element('action');
let busy = false;
let handled = 0;
let timer;
const controls = {
  depth: (value) => `${value}px`,
  radius: (value) => `${value}px`,
  light: (value) => String(Number(value) / 100),
};
for (const [id, format] of Object.entries(controls)) {
  const input = element(id);
  const apply = () => action.style.setProperty(`--${id}`, format(input.value));
  input.oninput = apply;
  apply();
}
function syncAction() {
  action.disabled = busy || element('lock-button').checked;
  action.setAttribute('aria-busy', String(busy));
}
element('lock-button').onchange = syncAction;
action.onclick = () => {
  busy = true;
  action.dataset.activations = String(++handled);
  element('action-status').textContent = 'Preparando vista…';
  syncAction();
  timer = setTimeout(() => {
    busy = false;
    element('action-status').textContent = 'Vista preparada.';
    syncAction();
  }, 450);
};
window.addEventListener('pagehide', () => clearTimeout(timer), { once: true });

const fps = { numerator: 24, denominator: 1 };
const deck = element('deck');
const scenes = Array.from(deck.querySelectorAll('[data-scene]'));
const layers = scenes.map((scene, index) => ({ kind: 'group', id: scene.dataset.scene,
  inTick: index * 100, outTick: (index + 1) * 100 }));
const project = validateCompositionProject({
  schemaVersion: 1, rootId: 'presentation', timebase: 24, fps,
  compositions: [{ id: 'presentation', viewport: { width: 960, height: 540 }, durationTicks: 300, layers }],
});
if (!project.ok) throw new Error(project.code);
const mail = element('deck-mail');
mail.onerror = () => { mail.hidden = true; };
mail.src = `${import.meta.env.BASE_URL}ceramic-mail/ceramic-mail-studio.png`;
const seek = element('seek');
let current = 0;
function show(frame) {
  const active = layers.findIndex((layer) => layerContainsFrame(layer, frame, project.project));
  if (active < 0) return;
  current = active;
  for (const [index, scene] of scenes.entries()) scene.hidden = active !== index;
  seek.value = frame;
  seek.setAttribute('aria-valuetext', `Escena ${active + 1} de ${scenes.length}`);
  element('prev-scene').disabled = active === 0;
  element('next-scene').disabled = active === scenes.length - 1;
  element('deck-position').textContent = `Escena ${active + 1} de ${scenes.length}`;
}
seek.oninput = () => show(Number(seek.value));
element('prev-scene').onclick = () => show(100 * (current - 1));
element('next-scene').onclick = () => show(100 * (current + 1));
element('format').onchange = (event) => { deck.dataset.format = event.target.value; };
show(0);
