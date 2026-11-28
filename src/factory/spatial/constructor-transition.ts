import {z} from 'zod';
import type {compileSpatialConstructor} from './constructor.js';
type Plan=ReturnType<typeof compileSpatialConstructor>;
type Exhibit=Plan['exhibits'][number];
const Policy=z.strictObject({durationMs:z.number().int().min(120).max(2400),staggerMs:z.number().int().min(0).max(100),lift:z.number().finite().min(0).max(2),reducedMotion:z.boolean()});
type Vec=[number,number,number];
const position=(e:Exhibit):Vec=>[e.position.x,e.position.y,e.position.z];
const relationKey=(r:Plan['world']['view']['relations'][number])=>JSON.stringify([r.from,r.to,r.kind]);
export function compileConstructorTransition(before:Plan,after:Plan,input:unknown){
 const policy=Policy.parse(input),a=before.world.view,b=after.world.view;
 if(a.scope.tenantId!==b.scope.tenantId||a.scope.workspaceId!==b.scope.workspaceId||before.id!==after.id||b.revision<=a.revision)throw Error('CONSTRUCTOR_TRANSITION_DENIED');
 const old=new Map(before.exhibits.map(e=>[e.entityId,e])),next=new Map(after.exhibits.map(e=>[e.entityId,e]));
 const ids=[...new Set([...old.keys(),...next.keys()])].sort();
 const tracks=ids.map(id=>{
 const from=old.get(id),to=next.get(id),p=position(from??to!),q=position(to??from!);
 const mode=!from?'enter':!to?'exit':from.recipeRef!==to.recipeRef||from.kind!==to.kind?'replace':p.some((v,i)=>v!==q[i])?'move':'retain';
 return {id,mode,from:p,to:q,fromRecipe:from?.recipeRef,toRecipe:to?.recipeRef,roomId:(to??from!).position.roomId};
 });
 const oldRelations=new Map(a.relations.map(r=>[relationKey(r),r])),newRelations=new Map(b.relations.map(r=>[relationKey(r),r]));
 const relations=[...new Set([...oldRelations.keys(),...newRelations.keys()])].sort().map(key=>({relation:(newRelations.get(key)??oldRelations.get(key))!,from:oldRelations.has(key)?1:0,to:newRelations.has(key)?1:0}));
 const groups=[...new Set(tracks.map(t=>t.roomId))].sort();
 const durationMs=policy.reducedMotion?0:policy.durationMs+Math.max(0,groups.length-1)*policy.staggerMs;
 return {tracks,relations,groups,policy,durationMs,revision:b.revision};
}
export function sampleConstructorTransition(plan:ReturnType<typeof compileConstructorTransition>,timeMs:number){
 if(!Number.isFinite(timeMs))throw Error('INVALID_TRANSITION_TIME');
 const clamp=(x:number)=>Math.max(0,Math.min(1,x)),ease=(x:number)=>x*x*(3-2*x);
 const tracks=plan.tracks.map(t=>{
 const delay=plan.groups.indexOf(t.roomId)*plan.policy.staggerMs;
 const p=plan.policy.reducedMotion?1:clamp((timeMs-delay)/plan.policy.durationMs),e=ease(p);
 const position:Vec=[t.from[0]+(t.to[0]-t.from[0])*e,t.from[1]+(t.to[1]-t.from[1])*e,t.from[2]+(t.to[2]-t.from[2])*e];
 if(t.mode==='move')position[1]+=plan.policy.lift*Math.sin(Math.PI*e);
 const opacity=t.mode==='enter'?e:t.mode==='exit'?1-e:1;
 return {id:t.id,mode:t.mode,position,opacity,scale:t.mode==='enter'?.85+.15*e:t.mode==='exit'?1-.15*e:1,fromRecipe:t.fromRecipe,toRecipe:t.toRecipe,recipeMix:t.mode==='replace'?e:t.mode==='exit'?0:1,interactive:t.mode!=='exit'&&p===1};
 });
 const e=plan.policy.reducedMotion?1:ease(clamp(timeMs/Math.max(1,plan.durationMs)));
 return {tracks,relations:plan.relations.map(r=>({...r.relation,opacity:r.from+(r.to-r.from)*e})),complete:plan.policy.reducedMotion||timeMs>=plan.durationMs};
}
