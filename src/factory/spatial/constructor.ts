import {z} from 'zod';
import {compileSpatialView,SpatialViewSpecSchema} from './topography.js';
import {compileSpatialTour,TourSpecSchema} from './learning-tour.js';
import {compileLearningSandbox,LearningSandboxSchema} from './learning-sandbox.js';
const Id=z.string().regex(/^[a-z0-9][a-z0-9-]{0,95}$/);
const Exhibit=z.strictObject({entityId:Id,kind:z.enum(['sculpture','chart','process','document','experiment']),recipeRef:Id,exerciseRef:Id.optional()});
export const ConstructorSpecSchema=z.strictObject({schemaVersion:z.literal(1),id:Id,view:SpatialViewSpecSchema,exhibits:z.array(Exhibit).max(256),tours:z.array(TourSpecSchema).max(16),experiments:z.array(LearningSandboxSchema).max(32)});
export type ConstructorSpec=z.infer<typeof ConstructorSpecSchema>;
type Authority=Parameters<typeof compileSpatialView>[1]&{revision:number;narrationRefs:ReadonlySet<string>;exerciseRefs:ReadonlySet<string>;recipes:ReadonlyMap<string,z.infer<typeof Exhibit>['kind']>};
export function compileSpatialConstructor(input:unknown,authority:Authority,previousLayout?:unknown){
 const spec=ConstructorSpecSchema.parse(input);
 if(spec.view.revision!==authority.revision)throw Error('CONSTRUCTOR_REVISION_DENIED');
 const world=compileSpatialView(spec.view,authority,previousLayout);
 const entities=new Set(world.view.entities.map(e=>e.id));
 const experiments=new Map<string,ReturnType<typeof compileLearningSandbox>>();
 for(const e of spec.experiments){
 if(experiments.has(e.id))throw Error('DUPLICATE_EXPERIMENT');
 experiments.set(e.id,compileLearningSandbox(e,authority));
 }
 const exhibitIds=new Set<string>();
 const exhibits=spec.exhibits.map(e=>{
 if(!entities.has(e.entityId)||exhibitIds.has(e.entityId)||authority.recipes.get(e.recipeRef)!==e.kind)throw Error('EXHIBIT_DENIED');
 if(e.kind==='experiment'?!e.exerciseRef||!experiments.has(e.exerciseRef):e.exerciseRef!==undefined)throw Error('INVALID_EXHIBIT_EXERCISE');
 exhibitIds.add(e.entityId);
 return {...e,position:world.positions.find(p=>p.id===e.entityId)!};
 });
 const tourIds=new Set<string>();
 const tours=spec.tours.map(t=>{
 if(tourIds.has(t.id))throw Error('DUPLICATE_TOUR');tourIds.add(t.id);
 for(const s of t.steps)if(s.exerciseRef&&!experiments.has(s.exerciseRef))throw Error('UNBOUND_TOUR_EXERCISE');
 return compileSpatialTour(t,world,authority);
 });
 if(tours.reduce((n,t)=>n+t.steps.length,0)>256)throw Error('CONSTRUCTOR_STEP_BUDGET');
 return {id:spec.id,world,exhibits,tours,evaluateExperiment(id:string,overrides:unknown={}){
 const lab=experiments.get(id);if(!lab)throw Error('UNKNOWN_EXPERIMENT');return lab.evaluate(overrides);
 }};
}
