import {z} from 'zod';
import {createMixerEditor} from './mixer-editor.js';
import {ExperienceMixerSchema} from './experience-mixer.js';
import {createExperienceDirector} from './experience-director.js';
type Experience=Parameters<typeof createExperienceDirector>[0];
const Id=z.string().regex(/^[a-z0-9][a-z0-9-]{0,95}$/);
const Time=z.number().int().min(0).max(600000);
const Nav=z.discriminatedUnion('kind',[z.strictObject({kind:z.literal('enter'),id:Id}),z.strictObject({kind:z.literal('related'),id:Id}),z.strictObject({kind:z.literal('up')}),z.strictObject({kind:z.literal('back')})]);
const Director=z.discriminatedUnion('kind',[z.strictObject({kind:z.literal('navigate'),command:Nav}),z.strictObject({kind:z.literal('film')}),z.strictObject({kind:z.literal('tour'),id:Id}),z.strictObject({kind:z.literal('pause')}),z.strictObject({kind:z.literal('resume')}),z.strictObject({kind:z.literal('stop')}),z.strictObject({kind:z.literal('seek'),ms:Time})]);
const Event=z.discriminatedUnion('kind',[z.strictObject({kind:z.literal('director'),atMs:Time,command:Director}),z.strictObject({kind:z.literal('mix'),atMs:Time,spec:ExperienceMixerSchema})]);
export const ExperienceRecordingSchema=z.strictObject({version:z.literal(1),experienceId:Id,scope:z.strictObject({tenantId:Id,workspaceId:Id}),revision:z.number().int().nonnegative(),durationMs:Time,initialMix:ExperienceMixerSchema,events:z.array(Event).max(256)});
type Recording=z.infer<typeof ExperienceRecordingSchema>;
type Event=z.infer<typeof Event>;
type Context={experience:Experience;policy:unknown;ambient:unknown;reducedMotion:boolean};
function checkSize(input:Recording){if(JSON.stringify(input).length>2_000_000)throw Error('RECORDING_SIZE_LIMIT');}
export function compileExperienceRecording(input:unknown,ctx:Context){
 const r=ExperienceRecordingSchema.parse(input);checkSize(r);
 const c=ctx.experience.composition;
 if(r.experienceId!==ctx.experience.id||r.scope.tenantId!==c.scope.tenantId||r.scope.workspaceId!==c.scope.workspaceId||r.revision!==c.revision)throw Error('RECORDING_SCOPE_DENIED');
 let last=0;for(const e of r.events){if(e.atMs<last||e.atMs>r.durationMs)throw Error('RECORDING_TIME_ORDER');last=e.atMs;}
 function replay(ms:number){
 if(!Number.isFinite(ms))throw Error('RECORDING_TIME_INVALID');
 const target=Math.max(0,Math.min(r.durationMs,ms));
 const d=createExperienceDirector(ctx.experience,{reducedMotion:ctx.reducedMotion});
 let editor=createMixerEditor(r.initialMix,ctx.policy,ctx.ambient),cursor=0;
 function advance(to:number){while(cursor<to){const delta=Math.min(1000,to-cursor);d.dispatch({kind:'advance',ms:delta});cursor+=delta;}}
 try{for(const e of r.events){if(e.atMs>target)break;advance(e.atMs);if(e.kind==='director')d.dispatch(e.command);else editor=createMixerEditor(e.spec,ctx.policy,ctx.ambient);}
 advance(target);return {timeMs:target,director:d.snapshot(),mix:editor.sample(target),mixSpec:editor.snapshot().spec};}finally{d.dispose();}
 }
 replay(r.durationMs);
 return {snapshot:()=>structuredClone(r),sample:replay,exportJSON:()=>JSON.stringify(r,null,2)};
}
export function createExperienceRecorder(ctx:Context,initialMix:unknown){
 const c=ctx.experience.composition;
 let recording:Recording={version:1,experienceId:ctx.experience.id,scope:{...c.scope},revision:c.revision,durationMs:0,initialMix:ExperienceMixerSchema.parse(initialMix),events:[]};
 compileExperienceRecording(recording,ctx);
 let closed=false;
 return {append(input:unknown){if(closed)throw Error('RECORDER_CLOSED');const e:Event=Event.parse(input);if(e.atMs<recording.durationMs)throw Error('RECORDING_TIME_ORDER');const next={...recording,durationMs:e.atMs,events:[...recording.events,e]};compileExperienceRecording(next,ctx);recording=next;return recording.events.length;},finish(durationMs:number){if(closed)throw Error('RECORDER_CLOSED');if(durationMs<recording.durationMs)throw Error('RECORDING_TIME_ORDER');const result=compileExperienceRecording({...recording,durationMs},ctx);closed=true;return result.snapshot();},snapshot:()=>structuredClone(recording)};
}
