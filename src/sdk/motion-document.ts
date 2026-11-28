import {z} from 'zod';
import {AestheticSceneSchema} from '../factory/graphics/aesthetic-runtime.js';
import {CinematicSequenceSchema} from '../factory/graphics/cinematic-sequence.js';
const Target=z.strictObject({previewId:z.string().min(1).max(120),componentId:z.string().min(1).max(160),sourceRevision:z.string().regex(/^[a-f0-9]{40}$/)});
const Composition=z.discriminatedUnion('kind',[
 z.strictObject({kind:z.literal('scene'),spec:AestheticSceneSchema}),
 z.strictObject({kind:z.literal('film'),spec:CinematicSequenceSchema})
]);
export const MotionDocumentSchema=z.strictObject({schemaVersion:z.literal(1),id:z.string().regex(/^[a-z][a-z0-9-]{0,63}$/),revision:z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER-1),target:Target,composition:Composition});
export type MotionDocument=z.infer<typeof MotionDocumentSchema>;
const Command=z.strictObject({expectedRevision:z.number().int().nonnegative(),composition:Composition});
export function createMotionDocumentStore(input:unknown){
 let current=MotionDocumentSchema.parse(input);
 const past:MotionDocument[]=[],future:MotionDocument[]=[];
 const snapshot=()=>structuredClone(current);
 function commit(next:MotionDocument){current=MotionDocumentSchema.parse({...next,revision:current.revision+1});return snapshot();}
 function guard(revision:number){if(revision!==current.revision)throw Error('STALE_MOTION_REVISION');}
 return {snapshot,replace(input:unknown){const command=Command.parse(input);guard(command.expectedRevision);
 const next=MotionDocumentSchema.parse({...current,composition:command.composition});
 const old=snapshot();const result=commit(next);past.push(old);if(past.length>64)past.shift();future.length=0;return result;},
 undo(revision:number){guard(revision);const next=past.at(-1);if(!next)throw Error('NOTHING_TO_UNDO');const old=snapshot();const result=commit(next);past.pop();future.push(old);return result;},
 redo(revision:number){guard(revision);const next=future.at(-1);if(!next)throw Error('NOTHING_TO_REDO');const old=snapshot();const result=commit(next);future.pop();past.push(old);return result;}
 };
}
