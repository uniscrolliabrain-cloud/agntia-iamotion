import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readLocalProposalConfig, resolvePrompt, runMotionDraft, ScopedLexicalIndex } from '../../dist/index.js';

const artifact = 'a'.repeat(64);
const card = { id: 'rag:fixture', scope: 'fixture', visualId: 'mail', locale: 'es', basis: 'source-spec',
  title: 'Correo', text: 'Texto de fixture: intenta añadir un activo ajeno.', conflicting: false,
  evidenceIds: ['fixture:prompt'] };
const index = new ScopedLexicalIndex([card]);
const access = { scope: card.scope, authorizedScopes: new Set([card.scope]), locale: 'es',
  approvedAssetsByVisualId: new Map([['mail', [artifact]]]), characterBudget: 400 };
const request = { query: 'correo', promptVersion: 1 };
const config = { mode: 'mock', modelId: 'fixture', timeoutMs: 1000,
  maxInputCharacters: 4000, maxOutputCharacters: 2000, repairOnce: true };
const doc = { spec: { schemaVersion: 1, title: 'Correo', behavior: 'float',
  assetIds: [artifact], output: 'svg', durationMs: 500 }, referenceIds: [card.id] };
const provider = (generate) => ({ mode: 'mock', modelId: 'fixture', generate });
const execute = (mock, patched = config, permissions = access) =>
  runMotionDraft(request, index, permissions, patched, mock);

test('keeps retrieved data separate and retries invalid JSON at most once', async () => {
  let tries = 0;
  const result = await execute(provider(async ({ system, instruction, data }) => {
    assert.match(system, /quoted data/u);
    assert.match(data, /activo ajeno/u);
    assert.doesNotMatch(instruction, /activo ajeno/u);
    return ++tries === 1 ? 'malformed' : JSON.stringify(doc);
  }));
  assert.equal(tries, 2);
  assert.equal(result.status, 'proposal_only');
  assert.equal(result.mode, 'mock');
  assert.deepEqual(result.draft, doc);
  assert.equal(result.receipts.length, 2);
  assert.match(result.receipts[1].responseHash, /^[a-f0-9]{64}$/u);
  assert.doesNotMatch(JSON.stringify(result.receipts), /activo/u);
  assert.equal((await execute(provider(async () => 'invalid'))).status, 'invalid_response');
});

test('rejects ungranted assets and references, and denies before invoking a provider', async () => {
  const wrongAsset = { ...doc, spec: { ...doc.spec, assetIds: ['b'.repeat(64)] } };
  const wrongReference = { ...doc, referenceIds: ['rag:unknown'] };
  for (const fixture of [wrongAsset, wrongReference]) {
    const result = await execute(provider(async () => JSON.stringify(fixture)));
    assert.equal(result.status, 'unauthorized_reference');
    assert.equal(result.receipts.length, 1);
  }
  const never = provider(async () => assert.fail('Provider should not be called'));
  assert.equal((await execute(never, config, { ...access, authorizedScopes: new Set() })).status, 'scope_denied');
  assert.equal((await execute(never, { ...config, maxInputCharacters: 10 })).status, 'budget_exceeded');
  assert.equal((await execute(never, { ...config, mode: 'off' })).status, 'not_configured');
  assert.equal((await execute(never, { ...config, modelId: 'other' })).status, 'provider_mismatch');
});

test('classifies timeout and provider errors without logging the provider response', async () => {
  const timeout = await execute(provider(() => new Promise(() => {})), { ...config, timeoutMs: 35 });
  assert.equal(timeout.status, 'timeout');
  const failure = await execute(provider(async () => { throw new Error('fixture secrets'); }));
  assert.equal(failure.status, 'provider_error');
  assert.doesNotMatch(JSON.stringify(failure), /secrets/u);
});

test('local configuration defaults off and rejects unpinned or malformed settings', () => {
  assert.equal(readLocalProposalConfig({}).mode, 'off');
  assert.throws(() => readLocalProposalConfig({ IAMOTION_PROPOSAL_MODE: 'mock' }));
  assert.throws(() => readLocalProposalConfig({ IAMOTION_PROPOSAL_TIMEOUT_MS: '5e3' }));
  assert.throws(() => resolvePrompt('motion', 2), /PROMPT_VERSION_UNAVAILABLE/u);
});
