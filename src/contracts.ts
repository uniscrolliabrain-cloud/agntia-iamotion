import { z } from 'zod';
export const MotionSpec = z.object({schemaVersion:z.literal(1),title:z.string().min(1).max(160),assetIds:z.array(z.string().min(1)).max(32),durationMs:z.number().int().min(100).max(60000),behavior:z.enum(['breathe','float','settle','reveal','cascade','orbit','pulse','dissolve']),output:z.enum(['svg','webm','mp4','glb','webp'])}).strict();
export type MotionSpec = z.infer<typeof MotionSpec>;
export const capabilityNames = ['motion.status','motion.assets.read','motion.spec.propose','motion.preview.request','motion.render.request','motion.jobs.read'] as const;
export type Capability = typeof capabilityNames[number];
