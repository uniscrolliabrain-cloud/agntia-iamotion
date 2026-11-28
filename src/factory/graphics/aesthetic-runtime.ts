import {z} from 'zod';
import {surfaceTarget,SurfacePolicySchema} from '../materials/surface.js';
import {AnnularSpec,buildAnnularMesh} from './annular-mesh.js';
import {OrganicFieldSpec,OrganicField,constellationTargets,ribbonTargets} from './particles/organic-field.js';
import {EditorialMotionSpec,compileEditorialMotion,sampleEditorial} from './editorial-motion.js';
import {SculptureRecipeSchema,compileSculpture} from '../renderers/blender/sculpture.js';
import {tokenizeSearchText} from '../assets/retrieval.js';
const id=z.string().regex(/^[a-z][a-z0-9-]{0,63}$/);
const common={id,startMs:z.number().int().min(0).max(60000),durationMs:z.number().int().min(120).max(60000)};
const Layer=z.discriminatedUnion('kind',[
 z.strictObject({...common,kind:z.literal('surface'),stage:z.number().int().min(0).max(3)}),
 z.strictObject({...common,kind:z.literal('annular'),geometry:AnnularSpec}),
 z.strictObject({...common,kind:z.literal('organic'),field:OrganicFieldSpec,form:z.enum(['constellation','ribbon'])}),
 z.strictObject({...common,kind:z.literal('editorial'),textId:id,motion:EditorialMotionSpec}),
 z.strictObject({...common,kind:z.literal('sculpture'),recipe:SculptureRecipeSchema})
]);
export const AestheticSceneSchema=z.strictObject({version:z.literal(1),id,durationMs:z.number().int().min(120).max(60000),layers:z.array(Layer).min(1).max(12)});
export const AestheticPolicySchema=z.strictObject({surface:SurfacePolicySchema,particles:z.boolean(),maxParticles:z.number().int().min(0).max(2048),maxVertices:z.number().int().min(0).max(100000),maxSculptureParts:z.number().int().min(0).max(64)});
type Kind=z.infer<typeof Layer>['kind'];
const cards:readonly {kind:Kind;title:string;terms:string;requires:string}[]=[
 {kind:'surface',title:'Óptica selectiva',terms:'cristal glass glassmorphism glassmorfismo material superficie foco profundidad',requires:'surface'},
 {kind:'annular',title:'Escultura anular deformable',terms:'queso anillo donut distribución volumen cerámica segmentos ring',requires:'mesh'},
 {kind:'organic',title:'Materia procedural',terms:'partículas particles constelación cinta flujo vórtice ensamblaje',requires:'particles'},
 {kind:'editorial',title:'Coreografía editorial',terms:'Fraunces Manrope tipografía texto titular máscara reveal cinematográfico',requires:'editorial'},
 {kind:'sculpture',title:'Fabricación escultórica',terms:'Blender icono cerámica esmalte oro volumen escultura PBR',requires:'blender'}
];
export function retrieveAestheticTechniques(query:string,features:ReadonlySet<string>){
 if(typeof query!=='string'||query.length>512)return [];
 const terms=new Set(tokenizeSearchText(query));
 return cards.filter(c=>features.has(c.requires)).map(c=>({...c,score:tokenizeSearchText(c.title+' '+c.terms).filter(t=>terms.has(t)).length})).filter(c=>c.score>0).sort((a,b)=>b.score-a.score||a.kind.localeCompare(b.kind)).map(c=>({...c,status:'experimental' as const}));
}
export function compileAestheticScene(input:unknown,policyInput:unknown,lockedText:ReadonlyMap<string,unknown>,features:ReadonlySet<string>){
 const scene=AestheticSceneSchema.parse(input),policy=AestheticPolicySchema.parse(policyInput);
 let particles=0,vertices=0,parts=0;const ids=new Set<string>();
 const layers=scene.layers.map(layer=>{
 if(ids.has(layer.id)||layer.startMs+layer.durationMs>scene.durationMs)throw Error('INVALID_AESTHETIC_INTERVAL');ids.add(layer.id);
 const capability=cards.find(c=>c.kind===layer.kind)!;
 if(!features.has(capability.requires))throw Error('AESTHETIC_CAPABILITY_UNAVAILABLE');
 switch(layer.kind){
 case 'surface':return {...layer,pose:surfaceTarget(layer.stage,policy.surface)};
 case 'annular':{vertices+=(layer.geometry.segments+1)*28+58;if(vertices>policy.maxVertices)throw Error('AESTHETIC_VERTEX_BUDGET');return {...layer,buffers:buildAnnularMesh(layer.geometry)};}
 case 'organic':{particles+=layer.field.count;if(!policy.particles||particles>policy.maxParticles)throw Error('AESTHETIC_PARTICLE_BUDGET');return {...layer,targets:layer.form==='ribbon'?ribbonTargets(layer.field.count):constellationTargets(layer.field.count)};}
 case 'editorial':{if(!lockedText.has(layer.textId)||layer.motion.durationMs>layer.durationMs)throw Error('AESTHETIC_TEXT_LOCK');return {...layer,plan:compileEditorialMotion(lockedText.get(layer.textId),layer.motion)};}
 case 'sculpture':{parts+=layer.recipe.parts.length;if(parts>policy.maxSculptureParts)throw Error('AESTHETIC_SCULPTURE_BUDGET');return {...layer,recipe:compileSculpture(layer.recipe)};}
 }
 });
 return {scene,policy,layers,status:'experimental' as const};
}
export type AestheticPlan=ReturnType<typeof compileAestheticScene>;
export function sampleAestheticScene(plan:AestheticPlan,timeMs:number){
 if(!Number.isFinite(timeMs))throw Error('INVALID_AESTHETIC_TIME');
 const t=Math.max(0,Math.min(plan.scene.durationMs,timeMs));
 return plan.layers.filter(l=>l.startMs<=t&&t<l.startMs+l.durationMs).map(l=>{
 const localMs=t-l.startMs;
 if(l.kind==='editorial')return {id:l.id,kind:l.kind,localMs,pose:sampleEditorial(l.plan,localMs,plan.policy.surface.reducedMotion)};
 if(l.kind==='surface')return {id:l.id,kind:l.kind,localMs,pose:l.pose};
 return {id:l.id,kind:l.kind,localMs};
 });
}
export function createAestheticField(layer:Extract<AestheticPlan['layers'][number],{kind:'organic'}>){
 const field=new OrganicField(layer.field);field.setTargets(layer.targets);return field;
}
