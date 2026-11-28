import type { BehaviorTimeline } from '../behaviors/grammar.js';
import { sampleTrack } from '../behaviors/sampler.js';
import { frameTime, validateCompositionProject } from './composition.js';

type Track = BehaviorTimeline['tracks'][number];
type LayerTrack = {
  layerId: string;
  startTick: number;
  endTick: number;
  track: Track;
};

export function bindCompositionBehaviors(input: unknown, compositionId: string,
  timeline: BehaviorTimeline, targets: ReadonlyMap<string, string>) {
  const validated = validateCompositionProject(input);
  if (!validated.ok) return validated;
  const { project } = validated;
  const composition = project.compositions.find(({ id }) => id === compositionId);
  if (!composition) return { ok: false, code: 'UNKNOWN_TARGET_COMPOSITION' } as const;
  const layers = new Map(composition.layers.map((layer) => [layer.id, layer]));
  const tracks: LayerTrack[] = [];
  const byChannel = new Map<string, LayerTrack[]>();
  const exactTicks = (ms: number) => {
    if (!Number.isSafeInteger(ms) || ms < 0) return null;
    const numerator = BigInt(ms) * BigInt(project.timebase);
    const ticks = numerator / 1000n;
    return numerator % 1000n === 0n && ticks <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(ticks) : null;
  };

  for (const track of timeline.tracks) {
    const key = track.target.kind === 'visual' ? 'visual' : `part:${track.target.partId}`;
    const layer = layers.get(targets.get(key) ?? '');
    if (!layer) return { ok: false, code: 'UNBOUND_BEHAVIOR_LAYER' } as const;
    const start = exactTicks(track.startMs);
    const end = exactTicks(track.endMs);
    if (start === null || end === null || start >= end) return { ok: false, code: 'INEXACT_BEHAVIOR_TIME' } as const;
    if (end > layer.outTick - layer.inTick) return { ok: false, code: 'BEHAVIOR_OUTSIDE_LAYER' } as const;
    const bound = { layerId: layer.id, startTick: layer.inTick + start, endTick: layer.inTick + end, track };
    const channel = JSON.stringify([layer.id, track.property]);
    const previous = byChannel.get(channel) ?? [];
    if (previous.some((entry) => entry.startTick < bound.endTick && entry.endTick > bound.startTick)) {
      return { ok: false, code: 'COMPOSITION_TRACK_COLLISION' } as const;
    }
    previous.push(bound);
    byChannel.set(channel, previous);
    tracks.push(bound);
  }

  return { ok: true, composition, clock: { fps: project.fps, timebase: project.timebase },
    tracks: structuredClone(tracks) } as const;
}

type Binding = Extract<ReturnType<typeof bindCompositionBehaviors>, { ok: true }>;

export function sampleCompositionFrame(binding: Binding, frame: number, reducedMotion = false) {
  const time = frameTime(frame, binding.clock);
  const activeLayers = binding.composition.layers.filter(({ inTick, outTick }) =>
    BigInt(inTick) * time.denominator <= time.numerator &&
    time.numerator < BigInt(outTick) * time.denominator);
  const visible = new Set(activeLayers.map(({ id }) => id));
  const channels = new Map<string, LayerTrack>();
  for (const entry of binding.tracks) {
    if (!visible.has(entry.layerId) || BigInt(entry.startTick) * time.denominator > time.numerator) continue;
    const key = JSON.stringify([entry.layerId, entry.track.property]);
    if ((channels.get(key)?.startTick ?? -1) <= entry.startTick) channels.set(key, entry);
  }
  return { activeLayers: [...visible], properties: [...channels.values()].map(({ layerId, startTick, endTick, track }) => {
    const elapsed = time.numerator - BigInt(startTick) * time.denominator;
    const duration = BigInt(endTick - startTick) * time.denominator;
    const progress = reducedMotion ? track.fallbackAt : elapsed >= duration ? 1 : Number(elapsed) / Number(duration);
    return { layerId, property: track.property, unit: track.unit, value: sampleTrack(track, progress) };
  }) };
}
