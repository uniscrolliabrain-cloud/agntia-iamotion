import {z} from 'zod';
import {AestheticSceneSchema,compileAestheticScene,sampleAestheticScene} from './aesthetic-runtime.js';
import {AmbientFieldSchema,sampleAmbientField,blendAmbientFrames} from '../materials/ambient-field.js';
import {frameTime} from './composition.js';
const id=z.string().regex(/^[a-z][a-z0-9-]{0,63}$/);
const coord=z.number().finite().min(-100).max(100),vec=z.tuple([coord,coord,coord]);
const Camera=z.strictObject({position:vec,target:vec,fov:z.number().finite().min(20).max(75)});
const Shot=z.strictObject({id,scene:AestheticSceneSchema,ambient:AmbientFieldSchema,cameraFrom:Camera,cameraTo:Camera,overlapMs:z.number().int().min(0).max(1500)});
export const CinematicSequenceSchema=z.strictObject({version:z.literal(1),id,fps:z.union([z.literal(24),z.literal(25),z.literal(30),z.literal(60)]),shots:z.array(Shot).min(1).max(16)});
export function compileCinematicSequence(input:unknown,policy:unknown,lockedText:ReadonlyMap<string,unknown>,features:ReadonlySet<string>){
 const spec=CinematicSequenceSchema.parse(input);const ids=new Set<string>();let end=0;
 const shots=spec.shots.map((shot,i)=>{
 if(ids.has(shot.id))throw Error('DUPLICATE_SHOT');ids.add(shot.id);
 const previous=spec.shots[i-1];
 if((!previous&&shot.overlapMs!==0)||shot.overlapMs>=shot.scene.durationMs||previous&&shot.overlapMs+previous.overlapMs>=previous.scene.durationMs)throw Error('INVALID_SHOT_OVERLAP');
 for(const camera of [shot.cameraFrom,shot.cameraTo])if(Math.hypot(...camera.position.map((v,j)=>v-camera.target[j]))<.1)throw Error('DEGENERATE_CAMERA');
 if(!features.has('ambient')||!features.has('camera'))throw Error('CINEMATIC_CAPABILITY_UNAVAILABLE');
 const plan=compileAestheticScene(shot.scene,policy,lockedText,features),start=end-shot.overlapMs;end=start+shot.scene.durationMs;
 if(end>300000)throw Error('CINEMATIC_DURATION_BUDGET');
 return {...shot,plan,start,end};
 });
 return {spec,shots,durationMs:end};
}
export type CinematicPlan=ReturnType<typeof compileCinematicSequence>;
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
function cameraAt(shot:CinematicPlan['shots'][number],local:number){
 const t=shot.plan.policy.surface.reducedMotion?1:clamp(local/shot.scene.durationMs),e=t*t*(3-2*t),m=(a:number,b:number)=>a+(b-a)*e;
 const position=shot.cameraFrom.position.map((v,i)=>m(v,shot.cameraTo.position[i])),target=shot.cameraFrom.target.map((v,i)=>m(v,shot.cameraTo.target[i]));
 if(Math.hypot(...position.map((v,i)=>v-target[i]))<.1)throw Error('DEGENERATE_CAMERA_PATH');
 return {position,target,fov:m(shot.cameraFrom.fov,shot.cameraTo.fov)};
}
export function sampleCinematicFrame(plan:CinematicPlan,frame:number){
 const time=frameTime(frame,{fps:{numerator:plan.spec.fps,denominator:1},timebase:1000}),ms=Number(time.numerator)/Number(time.denominator);
 if(ms>=plan.durationMs)return {frame,ms,ended:true as const,shots:[],ambient:null};
 const active=plan.shots.filter(s=>s.start<=ms&&ms<s.end);
 const incoming=active[1],t=incoming?clamp((ms-incoming.start)/incoming.overlapMs):0,e=t*t*(3-2*t);
 const frames=active.map((s,i)=>{const localMs=ms-s.start;return {id:s.id,localMs,opacity:incoming?(i===0?1-e:e):1,camera:cameraAt(s,localMs),layers:sampleAestheticScene(s.plan,localMs),ambient:sampleAmbientField({...s.ambient,reducedMotion:s.ambient.reducedMotion||s.plan.policy.surface.reducedMotion},localMs)};});
 const ambient=frames.length===2?blendAmbientFrames(frames[0].ambient,frames[1].ambient,t):frames[0]?.ambient??null;
 return {frame,ms,ended:false as const,shots:frames,ambient};
}
export interface CinematicFrameSink {render(frame:ReturnType<typeof sampleCinematicFrame>):Promise<void>;close():Promise<void>}
export async function renderCinematicFrames(plan:CinematicPlan,sink:CinematicFrameSink,options:{signal?:AbortSignal;maxFrames:number}){
 const count=Math.ceil(plan.durationMs*plan.spec.fps/1000);
 if(!Number.isSafeInteger(options.maxFrames)||options.maxFrames<1||count>options.maxFrames||count>18000)throw Error('CINEMATIC_FRAME_BUDGET');
 let rendered=0;
 try{for(let i=0;i<count;i++){if(options.signal?.aborted)throw Error('CINEMATIC_ABORTED');await sink.render(sampleCinematicFrame(plan,i));rendered++;}return {rendered,fps:plan.spec.fps};}finally{await sink.close();}
}
