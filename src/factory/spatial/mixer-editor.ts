import {z} from 'zod';
import {ExperienceMixerSchema,compileExperienceMixer} from './experience-mixer.js';
type Spec=z.infer<typeof ExperienceMixerSchema>;
const Channel=z.enum(['motion','depth','glass','particles','illumination','background','camera']);
const Ms=z.number().int().min(0).max(600000);
const Value=z.number().finite().min(0).max(1);
const Ease=z.enum(['linear','smooth','hold']);
const Edit=z.discriminatedUnion('kind',[
 z.strictObject({kind:z.literal('base'),channel:Channel,value:Value}),
 z.strictObject({kind:z.literal('insert'),channel:Channel,ms:Ms,value:Value,ease:Ease}),
 z.strictObject({kind:z.literal('move'),channel:Channel,from:Ms,to:Ms}),
 z.strictObject({kind:z.literal('update'),channel:Channel,ms:Ms,value:Value,ease:Ease}),
 z.strictObject({kind:z.literal('remove'),channel:Channel,ms:Ms}),
 z.strictObject({kind:z.literal('duration'),ms:Ms}),
 z.strictObject({kind:z.literal('clear'),channel:Channel})
]);
const Batch=z.strictObject({expectedRevision:z.number().int().nonnegative(),edits:z.array(Edit).min(1).max(128)});
export function createMixerEditor(input:unknown,policy:unknown,ambient:unknown){
 let spec=ExperienceMixerSchema.parse(input),revision=0;
 let compiled=compileExperienceMixer(spec,policy,ambient);
 const undo:Spec[]=[],redo:Spec[]=[];
 const check=(expected:number)=>{if(expected!==revision)throw Error('STALE_MIXER_REVISION');};
 const snapshot=()=>({revision,spec:structuredClone(spec),canUndo:undo.length>0,canRedo:redo.length>0});
 function install(next:Spec){const candidate=compileExperienceMixer(next,policy,ambient);spec=next;compiled=candidate;revision++;}
 function edit(input:unknown){
 const batch=Batch.parse(input);check(batch.expectedRevision);
 const next=structuredClone(spec);
 for(const e of batch.edits){
 if(e.kind==='duration'){next.durationMs=e.ms;continue;}
 if(e.kind==='base'){next.base[e.channel]=e.value;continue;}
 let track=next.tracks.find(t=>t.channel===e.channel);
 if(e.kind==='clear'){next.tracks=next.tracks.filter(t=>t.channel!==e.channel);continue;}
 if(e.kind==='insert'){
 if(!track){track={channel:e.channel,keys:[]};next.tracks.push(track);}
 if(track.keys.some(k=>k.ms===e.ms))throw Error('KEYFRAME_COLLISION');
 track.keys.push({ms:e.ms,value:e.value,ease:e.ease});
 }else{
 const at=e.kind==='move'?e.from:e.ms;
 const key=track?.keys.find(k=>k.ms===at);
 if(!track||!key)throw Error('KEYFRAME_NOT_FOUND');
 if(e.kind==='move'){if(e.to!==e.from&&track.keys.some(k=>k.ms===e.to))throw Error('KEYFRAME_COLLISION');key.ms=e.to;}
 else if(e.kind==='update'){key.value=e.value;key.ease=e.ease;}
 else track.keys=track.keys.filter(k=>k!==key);
 }
 track.keys.sort((a,b)=>a.ms-b.ms);
 if(!track.keys.length)next.tracks=next.tracks.filter(t=>t!==track);
 }
 const previous=spec;install(next);undo.push(previous);if(undo.length>64)undo.shift();redo.length=0;return snapshot();
 }
 function travel(expected:number,from:Spec[],to:Spec[]){check(expected);const next=from.at(-1);if(!next)return snapshot();const previous=spec;install(next);from.pop();to.push(previous);return snapshot();}
 return {snapshot,edit,undo:(expected:number)=>travel(expected,undo,redo),redo:(expected:number)=>travel(expected,redo,undo),sample:(ms:number)=>compiled.sample(ms),exportJSON:()=>JSON.stringify(spec,null,2)};
}
