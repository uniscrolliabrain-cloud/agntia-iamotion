import { LocalProposalConfig } from './proposal-runner.js';

export function readLocalProposalConfig(env: Readonly<Record<string, string | undefined>>) {
  const mode = env.IAMOTION_PROPOSAL_MODE ?? 'off';
  const decimal = (raw: string | undefined, fallback: number) =>
    raw === undefined ? fallback : /^[0-9]+$/u.test(raw) ? Number(raw) : NaN;
  const repair = env.IAMOTION_PROPOSAL_REPAIR_ONCE ?? 'false';
  if (repair !== 'true' && repair !== 'false') throw new Error('INVALID_REPAIR_SETTING');
  return LocalProposalConfig.parse({
    mode, modelId: env.IAMOTION_PROPOSAL_MODEL ?? (mode === 'off' ? 'disabled' : ''),
    timeoutMs: decimal(env.IAMOTION_PROPOSAL_TIMEOUT_MS, 5000),
    maxInputCharacters: decimal(env.IAMOTION_PROPOSAL_MAX_INPUT_CHARS, 12000),
    maxOutputCharacters: decimal(env.IAMOTION_PROPOSAL_MAX_OUTPUT_CHARS, 4000),
    repairOnce: repair === 'true',
  });
}
