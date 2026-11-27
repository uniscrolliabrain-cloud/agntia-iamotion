import type { BehaviorSpec } from './spec.js';

export const behaviorChannelKey = (target: BehaviorSpec['target'], property: BehaviorSpec['tracks'][number]['property']) =>
  JSON.stringify([target.kind, target.kind === 'part' ? target.partId : null, property]);
