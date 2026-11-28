import { z } from 'zod';

const Id = z.string().regex(/^[a-zA-Z0-9_.:-]{1,96}$/u);
const Tick = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);
const interval = { id: Id, startTick: Tick, endTick: Tick };
const Caption = z.strictObject({ ...interval, channel: Id, locale: z.string().min(2).max(64),
  text: z.string().min(1).max(4000) });
const Audio = z.strictObject({ ...interval, binaryId: z.string().regex(/^[a-f0-9]{64}$/u),
  gain: z.number().min(0).max(1), fadeIn: Tick, fadeOut: Tick });
const Cues = z.strictObject({ durationTicks: Tick.positive(), captions: z.array(Caption).max(500),
  audio: z.array(Audio).max(100) });

export function planGraphicsCues(input: unknown, approvedAudio: ReadonlySet<string>, supportsAudio: boolean) {
  const parsed = Cues.safeParse(input);
  if (!parsed.success) return { ok: false, code: 'INVALID_CUES' } as const;
  const { durationTicks, captions, audio } = parsed.data;
  const all = [...captions, ...audio];
  if (new Set(all.map(({ id }) => id)).size !== all.length ||
      all.some(({ startTick, endTick }) => startTick >= endTick || endTick > durationTicks)) {
    return { ok: false, code: 'INVALID_CUE_INTERVAL' } as const;
  }
  if (audio.some((cue) => !approvedAudio.has(cue.binaryId))) return { ok: false, code: 'AUDIO_RIGHTS_REQUIRED' } as const;
  if (audio.some((cue) => cue.fadeIn > cue.endTick - cue.startTick - cue.fadeOut)) {
    return { ok: false, code: 'AUDIO_FADE_EXCEEDS_INTERVAL' } as const;
  }
  const endByChannel = new Map<string, number>();
  for (const cue of [...captions].sort((a, b) => a.startTick - b.startTick)) {
    if ((endByChannel.get(cue.channel) ?? 0) > cue.startTick) {
      return { ok: false, code: 'CAPTION_CHANNEL_OVERLAP' } as const;
    }
    endByChannel.set(cue.channel, cue.endTick);
  }
  return { ok: true, captions, audio: supportsAudio ? audio : [],
    mode: supportsAudio && audio.length ? 'audio' : 'silent' } as const;
}
