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
const LayerId=z.string().regex(/^[a-z][a-z0-9-]{0,63}$/);
const Edit=z.discriminatedUnion('op',[
 z.strictObject({op:z.literal('move'),id:LayerId,startMs:z.number().int().nonnegative()}),
 z.strictObject({op:z.literal('resize'),id:LayerId,durationMs:z.number().int().min(120)}),
 z.strictObject({op:z.literal('remove'),id:LayerId}),
 z.strictObject({op:z.literal('add'),layer:z.unknown()}),
 z.strictObject({op:z.literal('replace-layer'),id:LayerId,layer:z.unknown()})
]);
export const MotionEditSchema=z.strictObject({expectedRevision:z.number().int().nonnegative(),edits:z.array(Edit).min(1).max(64)});
function validateIntervals(doc:MotionDocument){
 if(doc.composition.kind!=='scene')return;
 const {layers,durationMs}=doc.composition.spec;
 const ids=new Set<string>();
 for(const layer of layers){if(ids.has(layer.id)||layer.startMs+layer.durationMs>durationMs)throw Error('INVALID_AESTHETIC_INTERVAL');ids.add(layer.id);}
}
export function createMotionDocumentStore(input:unknown){
 let current=MotionDocumentSchema.parse(input);
 validateIntervals(current);
 const past:MotionDocument[]=[],future:MotionDocument[]=[];
 const snapshot=()=>structuredClone(current);
 function commit(next:MotionDocument){validateIntervals(next);current=MotionDocumentSchema.parse({...next,revision:current.revision+1});return snapshot();}
 function guard(revision:number){if(revision!==current.revision)throw Error('STALE_MOTION_REVISION');}
 return {snapshot,edit(input:unknown){
 const command=MotionEditSchema.parse(input);guard(command.expectedRevision);
 if(current.composition.kind!=='scene')throw Error('SCENE_EDIT_REQUIRED');
 const spec=structuredClone(current.composition.spec);
 let layers:unknown[]=spec.layers;
 for(const edit of command.edits){
 if(edit.op==='add'){layers.push(edit.layer);continue;}
 const index=layers.findIndex(l=>typeof l==='object'&&l!==null&&'id' in l&&l.id===edit.id);
 if(index<0)throw Error('LAYER_NOT_FOUND');
 if(edit.op==='remove')layers.splice(index,1);
 else if(edit.op==='replace-layer'){
 const layer=edit.layer;if(typeof layer!=='object'||layer===null||!('id' in layer)||layer.id!==edit.id)throw Error('LAYER_ID_MISMATCH');
 layers[index]=layer;
 }else layers[index]={...(layers[index] as object),...(edit.op==='move'?{startMs:edit.startMs}:{durationMs:edit.durationMs})};
 }
 const next=MotionDocumentSchema.parse({...current,composition:{kind:'scene',spec:{...spec,layers}}});
 const old=snapshot();const result=commit(next);past.push(old);if(past.length>64)past.shift();future.length=0;return result;
 },replace(input:unknown){const command=Command.parse(input);guard(command.expectedRevision);
 const next=MotionDocumentSchema.parse({...current,composition:command.composition});
 const old=snapshot();const result=commit(next);past.push(old);if(past.length>64)past.shift();future.length=0;return result;},
 undo(revision:number){guard(revision);const next=past.at(-1);if(!next)throw Error('NOTHING_TO_UNDO');const old=snapshot();const result=commit(next);past.pop();future.push(old);return result;},
 redo(revision:number){guard(revision);const next=future.at(-1);if(!next)throw Error('NOTHING_TO_REDO');const old=snapshot();const result=commit(next);future.pop();past.push(old);return result;}
 };
}
