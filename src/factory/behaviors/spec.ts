import { z } from 'zod';

const Id = z.string().min(1).max(192).regex(/^[a-zA-Z0-9_.:/-]+$/u);
const Normalized = z.number().min(0).max(1);
const Property = z.enum(['translateX', 'translateY', 'translateZ', 'rotateX', 'rotateY', 'rotateZ',
  'scale', 'opacity']);
export type BehaviorProperty = z.infer<typeof Property>;
const unitRules = {
  translateX: { unit: 'px', min: -2048, max: 2048 },
  translateY: { unit: 'px', min: -2048, max: 2048 },
  translateZ: { unit: 'px', min: -2048, max: 2048 },
  rotateX: { unit: 'deg', min: -360, max: 360 },
  rotateY: { unit: 'deg', min: -360, max: 360 },
  rotateZ: { unit: 'deg', min: -360, max: 360 },
  scale: { unit: 'ratio', min: 0.01, max: 8 },
  opacity: { unit: 'ratio', min: 0, max: 1 },
} as const;
const Track = z.strictObject({
  property: Property,
  unit: z.enum(['px', 'deg', 'ratio']),
  keyframes: z.array(z.strictObject({
    t: Normalized,
    value: z.number(),
    easing: z.enum(['linear', 'ease-in', 'ease-out', 'ease-in-out']),
  })).min(2).max(128),
});

export const BehaviorSpecSchema = z.strictObject({
  schemaVersion: z.literal(1),
  behaviorId: Id,
  visualId: Id.regex(/^v_[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/u),
  target: z.discriminatedUnion('kind', [
    z.strictObject({ kind: z.literal('visual') }),
    z.strictObject({ kind: z.literal('part'), partId: Id }),
  ]),
  primitive: z.enum(['breathe', 'float', 'drift', 'settle', 'focus', 'orbit', 'pulse',
    'reveal', 'cascade', 'fold', 'emerge', 'dissolve']),
  trigger: z.enum(['idle', 'hover', 'focus', 'press', 'host-event', 'manual']),
  state: z.enum(['idle', 'hover', 'focus', 'working', 'success', 'error', 'manual']),
  tracks: z.array(Track).min(1).max(32),
  durationMs: z.number().int().min(100).max(60000),
  loop: z.boolean(),
  reducedMotion: z.strictObject({ kind: z.literal('static'), at: Normalized }),
  bounds: z.strictObject({ maxDurationMs: z.number().int().min(100).max(60000) }),
  evidenceIds: z.array(Id).max(64),
  status: z.literal('proposed'),
});
export type BehaviorSpec = z.infer<typeof BehaviorSpecSchema>;

export interface BehaviorContext {
  visualId: string;
  partIds: ReadonlySet<string>;
  properties: ReadonlySet<BehaviorProperty>;
  allowIdleLoop?: boolean;
  maxDurationMs?: number;
}

type ErrorCode = 'INVALID_SPEC' | 'TARGET_NOT_FOUND' | 'CAPABILITY_UNSUPPORTED' |
  'DURATION_EXCEEDED' | 'LOOP_NOT_ALLOWED' | 'DUPLICATE_PROPERTY' | 'UNIT_MISMATCH' |
  'KEYFRAME_VALUE_OUT_OF_BOUNDS' | 'KEYFRAME_ORDER';
export type BehaviorValidation =
  | { ok: true; spec: BehaviorSpec }
  | { ok: false; code: ErrorCode; track?: number };
const reject = (code: ErrorCode, track?: number): BehaviorValidation => ({ ok: false, code, track });

export function validateBehaviorSpec(input: unknown, context: BehaviorContext): BehaviorValidation {
  const parsed = BehaviorSpecSchema.safeParse(input);
  if (!parsed.success) return reject('INVALID_SPEC');
  const spec = parsed.data;
  if (spec.visualId !== context.visualId ||
      (spec.target.kind === 'part' && !context.partIds.has(spec.target.partId))) {
    return reject('TARGET_NOT_FOUND');
  }
  const maxDuration = Math.min(spec.bounds.maxDurationMs, context.maxDurationMs ?? 60000);
  if (spec.durationMs > maxDuration) return reject('DURATION_EXCEEDED');
  if (spec.loop && !(context.allowIdleLoop && spec.trigger === 'idle' && spec.state === 'idle')) {
    return reject('LOOP_NOT_ALLOWED');
  }
  if ((spec.primitive === 'fold' || spec.primitive === 'emerge') && spec.target.kind !== 'part') {
    return reject('CAPABILITY_UNSUPPORTED');
  }

  const assigned = new Set<BehaviorProperty>();
  for (const [index, track] of spec.tracks.entries()) {
    const { property, unit, keyframes } = track;
    if (!context.properties.has(property)) return reject('CAPABILITY_UNSUPPORTED', index);
    if (assigned.has(property)) return reject('DUPLICATE_PROPERTY', index);
    assigned.add(property);

    const expected = unitRules[property];
    if (unit !== expected.unit) return reject('UNIT_MISMATCH', index);
    let previous = -1;
    for (const { t, value } of keyframes) {
      if (t <= previous) return reject('KEYFRAME_ORDER', index);
      if (value < expected.min || value > expected.max) return reject('KEYFRAME_VALUE_OUT_OF_BOUNDS', index);
      previous = t;
    }
  }
  return { ok: true, spec };
}
