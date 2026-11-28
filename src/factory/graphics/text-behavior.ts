import { z } from 'zod';
import { expandBehavior } from '../behaviors/grammar.js';
import type { BehaviorContext } from '../behaviors/spec.js';
import { prepareGraphicsText } from './text.js';

const Request = z.strictObject({
  technique: z.enum(['run-fade', 'glyph-morph', 'typewriter']),
  behaviorId: z.string().min(1).max(128),
  partId: z.string().min(1).max(128),
  durationMs: z.number().int().min(100).max(60000),
});

export function planGraphicsTextBehavior(text: unknown, input: unknown, context: BehaviorContext) {
  const source = prepareGraphicsText(text);
  if (!source.ok) return source;
  const request = Request.safeParse(input);
  if (!request.success) return { ok: false, code: 'INVALID_TEXT_BEHAVIOR' } as const;
  if (request.data.technique !== 'run-fade') {
    return { ok: false, code: 'TEXT_TECHNIQUE_UNSUPPORTED' } as const;
  }
  const { behaviorId, partId, durationMs } = request.data;
  const proposal = expandBehavior({
    schemaVersion: 1, behaviorId, visualId: context.visualId,
    target: { kind: 'part', partId }, primitive: 'reveal', trigger: 'manual', state: 'manual',
    intensity: 1, durationMs, loop: false, reducedMotion: { kind: 'static', at: 1 },
    bounds: { maxDurationMs: durationMs }, evidenceIds: [], status: 'proposed',
  }, context);
  if (!proposal.ok) return proposal;
  return { ok: true, spec: proposal.spec, visualText: source.text.sourceText,
    accessibilityText: source.accessibilityText, fallback: 'full-text' } as const;
}
