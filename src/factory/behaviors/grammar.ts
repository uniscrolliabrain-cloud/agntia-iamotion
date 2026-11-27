import { z } from 'zod';
import {
  BehaviorSpecSchema, validateBehaviorSpec, type BehaviorContext, type BehaviorSpec,
} from './spec.js';

type Track = BehaviorSpec['tracks'][number];
type Primitive = BehaviorSpec['primitive'];
const Intensity = z.number().min(0).max(1);
const Request = BehaviorSpecSchema.omit({ tracks: true }).extend({ intensity: Intensity }).strict();

function track(property: Track['property'], unit: Track['unit'], ...values: [number, number, ...number[]]): Track {
  return {
    property, unit,
    keyframes: values.map((value, index) => ({ t: index / (values.length - 1), value, easing: 'ease-in-out' })),
  };
}

const primitives: Record<Primitive, (intensity: number) => Track[]> = {
  breathe: (n) => [track('scale', 'ratio', 1, 1 + 0.06 * n, 1)],
  float: (n) => [track('translateY', 'px', 0, -12 * n, 0)],
  drift: (n) => [track('translateX', 'px', 0, 10 * n)],
  settle: (n) => [track('translateY', 'px', -8 * n, 2 * n, 0)],
  focus: (n) => [track('scale', 'ratio', 1, 1 + 0.08 * n)],
  orbit: (n) => [track('rotateZ', 'deg', 0, 360 * n)],
  pulse: (n) => [track('opacity', 'ratio', 1, 1 - 0.24 * n, 1)],
  reveal: (n) => [track('opacity', 'ratio', 1 - n, 1)],
  cascade: (n) => [track('opacity', 'ratio', 1 - n, 1 - n, 1)],
  fold: (n) => [track('rotateX', 'deg', 0, -110 * n)],
  emerge: (n) => [track('translateZ', 'px', -20 * n, 0), track('opacity', 'ratio', 1 - n, 1)],
  dissolve: (n) => [track('opacity', 'ratio', 1, 1 - n)],
};

export function expandBehavior(input: unknown, context: BehaviorContext) {
  const parsed = Request.safeParse(input);
  if (!parsed.success) return { ok: false, code: 'INVALID_PRIMITIVE_REQUEST' } as const;
  const { intensity, ...request } = parsed.data;
  return validateBehaviorSpec({ ...request, tracks: primitives[request.primitive](intensity) }, context);
}

const Composition = z.strictObject({
  mode: z.enum(['serial', 'parallel']),
  clips: z.array(z.strictObject({
    spec: z.unknown(),
    repeat: z.number().int().min(1).max(16).default(1),
    delayMs: z.number().int().min(0).max(60000).default(0),
  })).min(1).max(32),
});

type TimelineTrack = Track & {
  behaviorId: string;
  target: BehaviorSpec['target'];
  startMs: number;
  endMs: number;
  fallbackAt: number;
};
const channelKey = (target: BehaviorSpec['target'], property: Track['property']) =>
  JSON.stringify([target.kind, target.kind === 'part' ? target.partId : null, property]);

export function composeBehaviors(input: unknown, context: BehaviorContext) {
  const parsed = Composition.safeParse(input);
  if (!parsed.success) return { ok: false, code: 'INVALID_COMPOSITION' } as const;
  const { mode, clips } = parsed.data;
  const channels = new Map<string, TimelineTrack[]>();
  const tracks: TimelineTrack[] = [];
  let durationMs = 0;
  for (const [index, clip] of clips.entries()) {
    const validated = validateBehaviorSpec(clip.spec, context);
    if (!validated.ok) return { ...validated, clip: index };
    const { spec } = validated;
    if (clip.repeat > 1 && !spec.loop) return { ok: false, code: 'REPEAT_NOT_ALLOWED', clip: index } as const;
    const start = (mode === 'serial' ? durationMs : 0) + clip.delayMs;
    const end = start + spec.durationMs * clip.repeat;
    if (end > Math.min(context.maxDurationMs ?? 60000, 60000)) {
      return { ok: false, code: 'TIMELINE_DURATION_EXCEEDED', clip: index } as const;
    }
    for (let cycle = 0; cycle < clip.repeat; cycle++) {
      const startMs = start + cycle * spec.durationMs;
      const endMs = startMs + spec.durationMs;
      for (const track of spec.tracks) {
        const key = channelKey(spec.target, track.property);
        const channel = channels.get(key) ?? [];
        const conflict = channel.find((item) => startMs < item.endMs && endMs > item.startMs);
        if (conflict) return { ok: false, code: 'TRACK_CONFLICT', clip: index,
          behaviorId: conflict.behaviorId, property: track.property } as const;
        const item = { ...track, behaviorId: spec.behaviorId, target: spec.target,
          startMs, endMs, fallbackAt: spec.reducedMotion.at };
        channel.push(item);
        channels.set(key, channel);
        tracks.push(item);
      }
    }
    durationMs = Math.max(durationMs, end);
  }
  tracks.sort((a, b) => a.startMs - b.startMs || a.endMs - b.endMs);
  return { ok: true, timeline: { schemaVersion: 1, visualId: context.visualId,
    durationMs, tracks, status: 'proposed' } } as const;
}
