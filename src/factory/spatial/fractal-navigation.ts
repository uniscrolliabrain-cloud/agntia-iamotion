import {z} from 'zod';
import type {compileFractalComposition} from './fractal-composition.js';
type Plan=ReturnType<typeof compileFractalComposition>;
type Node=Plan['nodes'][number];
const Id=z.string().regex(/^[a-z0-9][a-z0-9-]{0,95}$/);
const State=z.strictObject({compositionId:Id,scope:z.strictObject({tenantId:Id,workspaceId:Id}),revision:z.number().int().nonnegative(),focusId:Id,history:z.array(Id).max(64)});
const Command=z.discriminatedUnion('kind',[z.strictObject({kind:z.literal('enter'),id:Id}),z.strictObject({kind:z.literal('related'),id:Id}),z.strictObject({kind:z.literal('up')}),z.strictObject({kind:z.literal('back')})]);
export type FractalNavigationState=z.infer<typeof State>;
const visible=(n:Node)=>n.effectiveCapabilities.includes('view');
const navigable=(n:Node)=>visible(n)&&n.effectiveCapabilities.includes('navigate');
function lookup(plan:Plan,id:string){const n=plan.nodes.find(n=>n.id===id);if(!n||!visible(n))throw Error('FRACTAL_NAVIGATION_DENIED');return n;}
function checked(plan:Plan,input:unknown){
 const s=State.parse(input);
 if(s.compositionId!==plan.id||s.scope.tenantId!==plan.scope.tenantId||s.scope.workspaceId!==plan.scope.workspaceId||s.revision!==plan.revision)throw Error('FRACTAL_NAVIGATION_SCOPE');
 lookup(plan,s.focusId);for(const id of s.history)lookup(plan,id);return s;
}
export function startFractalNavigation(plan:Plan):FractalNavigationState{
 const root=plan.nodes.find(n=>!n.parentId);if(!root||!visible(root))throw Error('FRACTAL_ROOT_DENIED');
 return {compositionId:plan.id,scope:{...plan.scope},revision:plan.revision,focusId:root.id,history:[]};
}
export function navigateFractal(plan:Plan,input:unknown,command:unknown):FractalNavigationState{
 const s=checked(plan,input),c=Command.parse(command),current=lookup(plan,s.focusId);
 if(c.kind==='back'){const id=s.history.at(-1);return id?{...s,focusId:id,history:s.history.slice(0,-1)}:s;}
 if(!navigable(current))throw Error('FRACTAL_NAVIGATION_DENIED');
 let target:Node;
 if(c.kind==='up'){if(!current.parentId)return s;target=lookup(plan,current.parentId);}
 else {target=lookup(plan,c.id);if(c.kind==='enter'&&target.parentId!==current.id)throw Error('NOT_DIRECT_CHILD');
 if(c.kind==='related'&&!plan.relations.some(r=>(r.from===current.id&&r.to===target.id)||(r.to===current.id&&r.from===target.id)))throw Error('NOT_RELATED');}
 if(target.id===current.id)return s;
 return {...s,focusId:target.id,history:[...s.history,current.id].slice(-64)};
}
export function projectFractalNavigation(plan:Plan,input:unknown){
 const s=checked(plan,input),focus=lookup(plan,s.focusId),canNavigate=navigable(focus);
 const children=plan.nodes.filter(n=>n.parentId===focus.id&&visible(n));
 const local=(n:Node)=>{const dx=n.worldPosition[0]-focus.worldPosition[0],dy=n.worldPosition[1]-focus.worldPosition[1],dz=n.worldPosition[2]-focus.worldPosition[2],c=Math.cos(focus.worldYaw),sin=Math.sin(focus.worldYaw),scale=focus.worldScale;
 return {id:n.id,label:n.label,kind:n.kind,recipeRef:n.recipeRef,position:[(dx*c-dz*sin)/scale,dy/scale,(dx*sin+dz*c)/scale],scale:n.worldScale/scale,yaw:n.worldYaw-focus.worldYaw,canEnter:canNavigate};};
 const related=canNavigate?plan.relations.flatMap(r=>{const id=r.from===focus.id?r.to:r.to===focus.id?r.from:undefined;if(!id)return [];const n=plan.nodes.find(n=>n.id===id);return n&&visible(n)?[{id:n.id,label:n.label,kind:r.kind}]:[];}):[];
 return {focus:{id:focus.id,label:focus.label,kind:focus.kind,capabilities:[...focus.effectiveCapabilities]},breadcrumbs:focus.path.map(id=>{const n=lookup(plan,id);return {id,label:n.label};}),children:children.map(local),related,canGoUp:canNavigate&&!!focus.parentId,canGoBack:s.history.length>0};
}
