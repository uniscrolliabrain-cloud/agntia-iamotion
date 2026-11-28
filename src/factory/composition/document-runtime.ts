import { z } from 'zod';
import { MotionDocumentSchema, type MotionDocument } from '../../sdk/motion-document.js';
import {
  AestheticPolicySchema,
  compileAestheticScene,
  sampleAestheticScene,
  type AestheticPlan,
} from '../graphics/aesthetic-runtime.js';
import {
  compileCinematicSequence,
  sampleCinematicFrame,
  type CinematicPlan,
} from '../graphics/cinematic-sequence.js';

// The authoring document (sdk/motion-document) can be edited but had no execution path:
// the store validated and versioned a spec that nothing could turn into frames. This module
// is that path and nothing more. It owns no animation math of its own: scene work is
// delegated to compileAestheticScene/sampleAestheticScene and film work to
// compileCinematicSequence/sampleCinematicFrame, so there is still one sampler per medium
// (P39) and no second runtime to keep in sync (P13).
//
// Two rules make a sample reproducible, which is what receipts and export need:
//   1. time is an argument, never a clock reading inside this module;
//   2. time is quantized to integer milliseconds and clamped to the composition duration,
//      so 12.4 and 12.1 are the same sample and never straddle a layer boundary differently.

export const MotionRuntimeOptionsSchema = z.strictObject({
  policy: AestheticPolicySchema,
  lockedText: z.record(z.string(), z.unknown()).default({}),
  features: z.array(z.string().min(1).max(64)).max(64),
});

export type MotionRuntimeOptions = z.infer<typeof MotionRuntimeOptionsSchema>;

export interface CompiledSceneMotion {
  readonly kind: 'scene';
  readonly document: MotionDocument;
  readonly plan: AestheticPlan;
  readonly durationMs: number;
  readonly fps: null;
  readonly frameCount: null;
}

export interface CompiledFilmMotion {
  readonly kind: 'film';
  readonly document: MotionDocument;
  readonly plan: CinematicPlan;
  readonly durationMs: number;
  readonly fps: number;
  readonly frameCount: number;
}

export type CompiledMotion = CompiledSceneMotion | CompiledFilmMotion;

export type MotionSceneSample = {
  readonly kind: 'scene';
  readonly timeMs: number;
  readonly layers: ReturnType<typeof sampleAestheticScene>;
};

export type MotionFilmSample = {
  readonly kind: 'film';
  readonly timeMs: number;
  readonly frame: ReturnType<typeof sampleCinematicFrame>;
};

export type MotionSample = MotionSceneSample | MotionFilmSample;

// Frame count of a film is derived from its own rate, never from a wall clock.
function filmFrameCount(durationMs: number, fps: number) {
  return Math.ceil((durationMs * fps) / 1000);
}

export function compileMotionDocument(input: unknown, options: unknown): CompiledMotion {
  const document = MotionDocumentSchema.parse(input);
  const runtime = MotionRuntimeOptionsSchema.parse(options);
  const features: ReadonlySet<string> = new Set(runtime.features);
  const lockedText: ReadonlyMap<string, unknown> = new Map(Object.entries(runtime.lockedText));

  if (document.composition.kind === 'scene') {
    const plan = compileAestheticScene(
      document.composition.spec,
      runtime.policy,
      lockedText,
      features,
    );
    return Object.freeze({
      kind: 'scene' as const,
      document,
      plan,
      durationMs: plan.scene.durationMs,
      fps: null,
      frameCount: null,
    });
  }

  const plan = compileCinematicSequence(
    document.composition.spec,
    runtime.policy,
    lockedText,
    features,
  );
  const fps = plan.spec.fps;
  return Object.freeze({
    kind: 'film' as const,
    document,
    plan,
    durationMs: plan.durationMs,
    fps,
    frameCount: filmFrameCount(plan.durationMs, fps),
  });
}

function quantize(timeMs: number, durationMs: number) {
  if (!Number.isFinite(timeMs)) throw new Error('INVALID_MOTION_TIME');
  return Math.max(0, Math.min(durationMs, Math.round(timeMs)));
}

export function sampleMotion(compiled: CompiledMotion, timeMs: number): MotionSample {
  const ms = quantize(timeMs, compiled.durationMs);
  if (compiled.kind === 'scene') {
    return Object.freeze({
      kind: 'scene' as const,
      timeMs: ms,
      layers: sampleAestheticScene(compiled.plan, ms),
    });
  }
  // A film renders whole frames. The frame shown at a given instant is the last one whose
  // start does not exceed it, so sampling is monotonic and never runs past the last frame.
  const frame = Math.min(
    compiled.frameCount - 1,
    Math.floor((ms * compiled.fps) / 1000),
  );
  return Object.freeze({
    kind: 'film' as const,
    timeMs: ms,
    frame: sampleCinematicFrame(compiled.plan, Math.max(0, frame)),
  });
}

export function sampleMotionFrame(compiled: CompiledMotion, frame: number): MotionSample {
  if (!Number.isSafeInteger(frame) || frame < 0) throw new Error('INVALID_MOTION_FRAME');
  if (compiled.kind !== 'film') throw new Error('MOTION_KIND_MISMATCH');
  const bounded = Math.min(compiled.frameCount - 1, frame);
  return Object.freeze({
    kind: 'film' as const,
    timeMs: Math.round((bounded * 1000) / compiled.fps),
    frame: sampleCinematicFrame(compiled.plan, bounded),
  });
}

// A receipt-friendly summary: enough to identify what was compiled and prove later that it
// was the same thing, without serializing buffers, plans or textures.
export function describeMotion(compiled: CompiledMotion) {
  const layerCount =
    compiled.kind === 'scene'
      ? compiled.plan.layers.length
      : compiled.plan.shots.reduce((total, shot) => total + shot.plan.layers.length, 0);
  return Object.freeze({
    kind: compiled.kind,
    id: compiled.document.id,
    revision: compiled.document.revision,
    target: compiled.document.target,
    compositionId:
      compiled.kind === 'scene' ? compiled.plan.scene.id : compiled.plan.spec.id,
    durationMs: compiled.durationMs,
    fps: compiled.fps,
    frameCount: compiled.frameCount,
    layerCount,
    status: compiled.kind === 'scene' ? compiled.plan.status : ('experimental' as const),
  });
}
