import assert from 'node:assert/strict';
import { test } from 'node:test';
import { runLocalPipeline } from '../../lab/scripts/run-local-pipeline.mjs';

const stage = (id, handler, dependsOn = []) => ({ id, handler, dependsOn,
  version: 'v1', timeoutMs: 50, input: { value: 3 } });
const plan = (...stages) => ({ schemaVersion: 1, stages });
const handlers = new Map([
  ['value', ({ input }) => input.value],
  ['double', ({ dependencies }) => 2 * dependencies.get('first')],
  ['failure', () => { throw new Error('synthetic confidential marker'); }],
  ['sleep', () => new Promise(() => {})],
]);

test('runs registered stages in dependency order and verifies cached output hashes', async () => {
  const cache = new Map();
  const spec = plan(stage('second', 'double', ['first']), stage('first', 'value'));
  const a = await runLocalPipeline(spec, handlers, { cache });
  assert.equal(a.receipt.status, 'success');
  assert.equal(a.outputs.get('second').data, 6);
  assert.deepEqual(a.receipt.stages.map(({ id }) => id), ['first', 'second']);
  const b = await runLocalPipeline(spec, handlers, { cache });
  assert.deepEqual(b.receipt.stages.map(({ status }) => status), ['cached', 'cached']);
  cache.values().next().value.data = 17;
  const c = await runLocalPipeline(spec, handlers, { cache });
  assert.deepEqual(c.receipt.stages.map(({ code }) => code), ['CACHE_INTEGRITY_FAILED', 'DEPENDENCY_FAILED']);
});

test('fails cycles before running, isolates failures and never records thrown content', async () => {
  await assert.rejects(runLocalPipeline(plan(stage('a', 'value', ['b']), stage('b', 'value', ['a'])),
    handlers), /STAGE_CYCLE/u);
  const a = await runLocalPipeline(plan(stage('broken', 'failure'), stage('blocked', 'value', ['broken']),
    stage('timeout', 'sleep'), stage('independent', 'value')), handlers);
  assert.equal(a.receipt.status, 'partial');
  assert.deepEqual(a.receipt.stages.map(({ status }) => status), ['failed', 'blocked', 'passed', 'failed']);
  assert.equal(a.receipt.stages.at(-1).code, 'STAGE_TIMEOUT');
  assert.equal(a.receipt.events.at(-1).kind, 'run_terminal');
  assert.doesNotMatch(JSON.stringify(a.receipt), /confidential/u);
});
