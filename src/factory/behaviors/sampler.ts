import { behaviorChannelKey } from './channel.js';
import type { BehaviorTimeline } from './grammar.js';

type TimelineTrack = BehaviorTimeline['tracks'][number];
type Keyframe = TimelineTrack['keyframes'][number];
function interpolate(ratio: number, easing: Keyframe['easing']) {
  switch (easing) {
    case 'linear': return ratio;
    case 'ease-in': return ratio ** 3;
    case 'ease-out': return 1 - (1 - ratio) ** 3;
    case 'ease-in-out': return ratio * ratio * (3 - 2 * ratio);
  }
}

export function sampleTrack(track: TimelineTrack, time: number) {
  const frames = track.keyframes;
  if (time <= frames[0].t) return frames[0].value;
  for (let index = 1; index < frames.length; index++) {
    const right = frames[index];
    if (time <= right.t) {
      const left = frames[index - 1];
      const ratio = interpolate((time - left.t) / (right.t - left.t), right.easing);
      return left.value + ratio * (right.value - left.value);
    }
  }
  return frames[frames.length - 1].value;
}

export function sampleBehaviorTimeline(timeline: BehaviorTimeline, timeMs: number, reducedMotion = false) {
  if (!Number.isFinite(timeMs)) throw new Error('INVALID_BEHAVIOR_SAMPLE_TIME');
  const time = Math.max(0, Math.min(timeline.durationMs, timeMs));
  const channels = new Map<string, TimelineTrack>();
  for (const track of timeline.tracks) {
    if (track.startMs > time) continue;
    const key = behaviorChannelKey(track.target, track.property);
    const last = channels.get(key);
    if (!last || track.startMs >= last.startMs) channels.set(key, track);
  }
  return [...channels.values()].map((track) => ({
    target: track.target, property: track.property, unit: track.unit,
    value: sampleTrack(track, reducedMotion ? track.fallbackAt :
      Math.min(1, (time - track.startMs) / (track.endMs - track.startMs))),
  }));
}
