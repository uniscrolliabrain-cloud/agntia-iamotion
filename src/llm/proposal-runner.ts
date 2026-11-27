import { z } from 'zod';
import { buildScopedVisualBrief, type ScopedBriefAccess } from '../factory/assets/proposal-context.js';
import type { ScopedLexicalIndex } from '../factory/assets/retrieval.js';
import { MotionSpec } from '../contracts.js';
import { boundedCall, sha256Text } from './bounded.js';
import { resolvePrompt } from './prompts/registry.js';

const Request = z.strictObject({
  query: z.string().min(1).max(512), promptVersion: z.literal(1),
});
const Response = z.strictObject({
  spec: MotionSpec, referenceIds: z.array(z.string().min(1).max(192)).min(1).max(20),
});
export const LocalProposalConfig = z.strictObject({
  mode: z.enum(['off', 'mock', 'host']),
  modelId: z.string().regex(/^[a-zA-Z0-9_.:/-]{1,96}$/u),
  timeoutMs: z.number().int().min(1).max(30000),
  maxInputCharacters: z.number().int().min(1).max(32768),
  maxOutputCharacters: z.number().int().min(1).max(32768),
  repairOnce: z.boolean(),
});
export type LocalProposalSettings = z.infer<typeof LocalProposalConfig>;

export interface DraftProvider {
  readonly mode: 'mock' | 'host';
  readonly modelId: string;
  generate(input: Readonly<{
    system: string; instruction: string; data: string; signal: AbortSignal;
  }>): Promise<unknown>;
}

export async function runMotionDraft(
  input: unknown,
  index: ScopedLexicalIndex,
  access: ScopedBriefAccess,
  configInput: unknown,
  provider?: DraftProvider,
  signal?: AbortSignal,
) {
  const request = Request.safeParse(input);
  const config = LocalProposalConfig.safeParse(configInput);
  if (!request.success || !config.success) return { status: 'invalid_input' } as const;
  const settings = config.data;
  if (settings.mode === 'off' || !provider) return { status: 'not_configured' } as const;
  if (settings.mode !== provider.mode || settings.modelId !== provider.modelId) {
    return { status: 'provider_mismatch' } as const;
  }
  if (!access.authorizedScopes.has(access.scope)) return { status: 'scope_denied' } as const;
  const brief = buildScopedVisualBrief(index, request.data.query, access);
  if (brief.status !== 'ready') return { status: 'insufficient_context' } as const;

  const prompt = resolvePrompt('motion', request.data.promptVersion);
  const data = JSON.stringify({ query: request.data.query, references: brief.candidates,
    approvedAssetIds: brief.approvedAssetIds });
  const references = new Set(brief.candidates.map(({ referenceId }) => referenceId));
  const approved = new Set(brief.approvedAssetIds);
  const deadline = performance.now() + settings.timeoutMs;
  const receipts: { promptHash: string; responseHash: string | null }[] = [];
  for (let attempt = 0; attempt < (settings.repairOnce ? 2 : 1); attempt++) {
    const instruction = prompt.instruction + (attempt ? ' Prior response did not match the schema. Return fresh JSON.' : '');
    if (data.length + prompt.system.length + instruction.length > settings.maxInputCharacters) {
      return { status: 'budget_exceeded', receipts } as const;
    }
    const promptHash = await sha256Text(JSON.stringify([prompt.promptId, prompt.version, prompt.system, instruction, data]));
    const remaining = Math.floor(deadline - performance.now());
    if (remaining < 1) return { status: 'timeout', receipts } as const;
    const output = await boundedCall(
      (abort) => provider.generate({ system: prompt.system, instruction, data, signal: abort }), remaining, signal,
    );
    if (!output.ok) {
      receipts.push({ promptHash, responseHash: null });
      return { status: output.code, receipts } as const;
    }
    const text = output.value;
    if (typeof text !== 'string') {
      receipts.push({ promptHash, responseHash: null });
      continue;
    }
    if (text.length > settings.maxOutputCharacters) {
      receipts.push({ promptHash, responseHash: null });
      return { status: 'budget_exceeded', receipts } as const;
    }
    receipts.push({ promptHash, responseHash: await sha256Text(text) });
    let candidate: unknown;
    try {
      candidate = JSON.parse(text);
    } catch {
      continue;
    }
    const parsed = Response.safeParse(candidate);
    if (!parsed.success) continue;
    if (new Set(parsed.data.referenceIds).size !== parsed.data.referenceIds.length ||
        parsed.data.referenceIds.some((id) => !references.has(id)) ||
        parsed.data.spec.assetIds.some((id) => !approved.has(id))) {
      return { status: 'unauthorized_reference', receipts } as const;
    }
    return { status: 'proposal_only', mode: provider.mode, promptVersion: prompt.version,
      draft: parsed.data, receipts } as const;
  }
  return { status: 'invalid_response', receipts } as const;
}
