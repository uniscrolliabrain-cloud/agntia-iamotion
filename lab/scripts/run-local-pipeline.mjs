import { z } from 'zod';
import { boundedCall } from '../../dist/llm/bounded.js';
import { canonical, hash } from './plan-library-migration.mjs';

const Id = z.string().regex(/^[a-z0-9-]{1,64}$/u);
const Json = z.json();
const Plan = z.strictObject({
  schemaVersion: z.literal(1),
  stages: z.array(z.strictObject({
    id: Id, handler: Id, version: Id,
    timeoutMs: z.number().int().min(1).max(30000),
    dependsOn: z.array(Id).max(32), input: Json,
  })).min(1).max(64),
});
const maxPayload = 2 * 1024 * 1024;
function encode(data) {
  if (!Json.safeParse(data).success) throw new Error('INVALID_STAGE_PAYLOAD');
  const bytes = canonical(data);
  if (Buffer.byteLength(bytes, 'utf8') > maxPayload) throw new Error('STAGE_PAYLOAD_LIMIT');
  return bytes;
}
const payloadHash = (data) => hash(encode(data));

function orderStages(stages, handlers) {
  const byId = new Map(stages.map((stage) => [stage.id, stage]));
  if (byId.size !== stages.length) throw new Error('DUPLICATE_STAGE');
  const ordered = [];
  const visiting = new Set();
  const visited = new Set();
  function visit(id) {
    if (visited.has(id)) return;
    if (visiting.has(id)) throw new Error('STAGE_CYCLE');
    visiting.add(id);
    const stage = byId.get(id);
    if (!stage) throw new Error('UNKNOWN_STAGE_DEPENDENCY');
    if (typeof handlers.get(stage.handler) !== 'function') throw new Error('UNREGISTERED_STAGE_HANDLER');
    if (new Set(stage.dependsOn).size !== stage.dependsOn.length) throw new Error('DUPLICATE_STAGE_DEPENDENCY');
    for (const dependency of [...stage.dependsOn].sort()) visit(dependency);
    visiting.delete(id);
    visited.add(id);
    ordered.push(stage);
  }
  for (const id of [...byId.keys()].sort()) visit(id);
  return ordered;
}

export async function runLocalPipeline(input, handlers, { cache = new Map(), signal } = {}) {
  const plan = Plan.parse(input);
  const ordered = orderStages(plan.stages, handlers);
  const planHash = payloadHash(plan);
  const events = [];
  const stages = [];
  const outputs = new Map();
  const statusById = new Map();
  const publish = (kind, details = {}) => events.push({ sequence: events.length + 1, kind, ...details });
  const finish = (stage, status, details = {}) => {
    stages.push({ id: stage.id, status, ...details });
    statusById.set(stage.id, status);
    publish('stage_terminal', { stage: stage.id, status, ...(details.code ? { code: details.code } : {}) });
  };
  publish('run_started');
  for (const stage of ordered) {
    if (signal?.aborted || stage.dependsOn.some((dep) => !outputs.has(dep))) {
      finish(stage, 'blocked', { code: signal?.aborted ? 'RUN_ABORTED' : 'DEPENDENCY_FAILED' });
      continue;
    }

    const deps = [...stage.dependsOn].sort().map((dep) => [dep, outputs.get(dep)]);
    const inputHash = payloadHash({
      id: stage.id, handler: stage.handler, version: stage.version, input: stage.input,
      dependencyHashes: deps.map(([dep, entry]) => [dep, entry.outputHash]),
    });
    publish('stage_started', { stage: stage.id, inputHash });
    try {
      const cached = await cache.get(inputHash);
      if (cached !== undefined) {
        if (payloadHash(cached.data) !== cached.outputHash) throw new Error('CACHE_MISMATCH');
        outputs.set(stage.id, structuredClone(cached));
        finish(stage, 'cached', { inputHash, outputHash: cached.outputHash });
        continue;
      }
    } catch {
      finish(stage, 'failed', { inputHash, code: 'CACHE_INTEGRITY_FAILED' });
      continue;
    }

    const call = await boundedCall((abort) => Promise.resolve(handlers.get(stage.handler)({
      input: structuredClone(stage.input),
      dependencies: new Map(deps.map(([dep, entry]) => [dep, structuredClone(entry.data)])),
      signal: abort,
    })), stage.timeoutMs, signal);
    if (!call.ok) {
      const code = { provider_error: 'STAGE_FAILED', timeout: 'STAGE_TIMEOUT', aborted: 'RUN_ABORTED' }[call.code];
      finish(stage, 'failed', { inputHash, code });
      continue;
    }
    try {
      const outputHash = payloadHash(call.value);
      const result = { data: structuredClone(call.value), outputHash };
      await cache.set(inputHash, structuredClone(result));
      outputs.set(stage.id, result);
      finish(stage, 'passed', { inputHash, outputHash });
    } catch {
      finish(stage, 'failed', { inputHash, code: 'OUTPUT_INTEGRITY_FAILED' });
    }
  }
  const passed = stages.filter(({ status }) => status === 'passed' || status === 'cached').length;
  const status = passed === stages.length ? 'success' : passed > 0 ? 'partial'
    : [...statusById.values()].includes('failed') ? 'failed' : 'blocked';
  publish('run_terminal', { status });
  return { receipt: { schemaVersion: 1, planHash, status,
    counts: { stages: stages.length, passed }, stages, events }, outputs };
}
