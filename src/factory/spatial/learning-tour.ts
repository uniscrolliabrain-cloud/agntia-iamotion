import {z} from 'zod';
import type {compileSpatialView} from './topography.js';
import {spatialBookmark,interpolateSpatialCamera,type SpatialCameraPose} from './navigation.js';
type World=ReturnType<typeof compileSpatialView>;
const Id=z.string().regex(/^[a-z0-9][a-z0-9-]{0,95}$/);
const Scope=z.strictObject({tenantId:Id,workspaceId:Id});
const Focus=z.discriminatedUnion('kind',[z.strictObject({kind:z.literal('overview')}),z.strictObject({kind:z.literal('room'),id:Id}),z.strictObject({kind:z.literal('entity'),id:Id})]);
export const TourSpecSchema=z.strictObject({schemaVersion:z.literal(1),id:Id,scope:Scope,revision:z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),steps:z.array(z.strictObject({id:Id,focus:Focus,phase:z.enum(['orientation','explanation','observation','prediction','practice','recall','transfer']),narrationRef:Id.optional(),exerciseRef:Id.optional(),travelMs:z.number().int().min(0).max(10000),holdMs:z.number().int().min(500).max(120000)})).min(1).max(64)});
export type TourSpec=z.infer<typeof TourSpecSchema>;
type Authority={scope:z.infer<typeof Scope>;revision:number;narrationRefs:ReadonlySet<string>;exerciseRefs:ReadonlySet<string>};
const same=(a:z.infer<typeof Scope>,b:z.infer<typeof Scope>)=>a.tenantId===b.tenantId&&a.workspaceId===b.workspaceId;
export function compileSpatialTour(input:unknown,world:World,authority:Authority){
 const spec=TourSpecSchema.parse(input);
 if(!same(spec.scope,authority.scope)||!same(spec.scope,world.view.scope)||spec.revision!==world.view.revision||spec.revision!==authority.revision)throw Error('TOUR_SCOPE_OR_REVISION_DENIED');
 const ids=new Set<string>();let cursor=0,previous=spatialBookmark(world,{kind:'overview'});
 const steps=spec.steps.map(step=>{
 if(ids.has(step.id))throw Error('DUPLICATE_TOUR_STEP');ids.add(step.id);
 if(step.narrationRef&&!authority.narrationRefs.has(step.narrationRef)||step.exerciseRef&&!authority.exerciseRefs.has(step.exerciseRef))throw Error('TOUR_REFERENCE_DENIED');
 if(['prediction','practice','recall','transfer'].includes(step.phase)&&!step.exerciseRef)throw Error('EXERCISE_REQUIRED');
 const target=spatialBookmark(world,step.focus),startMs=cursor,endMs=cursor+step.travelMs+step.holdMs,from=previous;
 cursor=endMs;previous=target;return {...step,startMs,endMs,from,target};
 });
 if(cursor>1800000)throw Error('TOUR_DURATION_BUDGET');
 return {spec,steps,durationMs:cursor};
}
export type SpatialTourPlan=ReturnType<typeof compileSpatialTour>;
export function sampleSpatialTour(plan:SpatialTourPlan,timeMs:number,reduced=false){
 if(!Number.isFinite(timeMs))throw Error('INVALID_TOUR_TIME');
 const t=Math.max(0,Math.min(plan.durationMs,timeMs)),step=plan.steps.find(s=>t<s.endMs)??plan.steps[plan.steps.length-1]!;
 const local=t-step.startMs,progress=step.travelMs===0?1:Math.min(1,local/step.travelMs);
 const camera:SpatialCameraPose=interpolateSpatialCamera(step.from,step.target,progress,reduced);
 return {timeMs:t,stepId:step.id,phase:step.phase,focus:step.focus,camera,arrived:progress===1,narrationRef:progress===1?step.narrationRef:undefined,exerciseRef:progress===1?step.exerciseRef:undefined,complete:t===plan.durationMs};
}
