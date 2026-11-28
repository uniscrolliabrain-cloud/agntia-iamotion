import {z} from 'zod';
import type {compileSpatialView} from './topography.js';
type World=ReturnType<typeof compileSpatialView>;
const Policy=z.strictObject({minSize:z.number().min(4).max(20),padding:z.number().min(1).max(2),thickness:z.number().min(.1).max(1),corridorWidth:z.number().min(.8).max(2),reducedMotion:z.boolean()});
type Point=[number,number,number];
export function compileSpatialArchitecture(world:World,input:unknown){
 const policy=Policy.parse(input);
 const rooms=world.view.rooms.map(r=>{
 const x=r.slot%4*24,z=Math.floor(r.slot/4)*24;
 const positions=world.positions.filter(p=>p.roomId===r.id);
 const width=Math.max(policy.minSize,...positions.map(p=>2*(Math.abs(p.x-x)+policy.padding)));
 const depth=Math.max(policy.minSize,...positions.map(p=>2*(Math.abs(p.z-z)+policy.padding)));
 if(width>22||depth>22)throw Error('ARCHITECTURE_ROOM_BUDGET');
 return {id:r.id,slot:r.slot,center:[x,-policy.thickness/2,z] as Point,width,depth,thickness:policy.thickness,radius:Math.min(.8,width/8,depth/8)};
 });
 const bySlot=new Map(rooms.map(r=>[r.slot,r]));
 const corridors=rooms.flatMap(a=>[a.slot%4<3?a.slot+1:-1,a.slot+4].flatMap(slot=>{
 const b=bySlot.get(slot);if(!b)return [];
 const horizontal=a.slot%4!==b.slot%4;
 const start:Point=horizontal?[a.center[0]+a.width/2,0,a.center[2]]:[a.center[0],0,a.center[2]+a.depth/2];
 const end:Point=horizontal?[b.center[0]-b.width/2,0,b.center[2]]:[b.center[0],0,b.center[2]-b.depth/2];
 return [{id:JSON.stringify([a.id,b.id]),from:a.id,to:b.id,start,end,width:policy.corridorWidth,length:Math.hypot(end[0]-start[0],end[2]-start[2])}];
 }));
 return {scope:world.view.scope,revision:world.view.revision,rooms,corridors,policy};
}
type Architecture=ReturnType<typeof compileSpatialArchitecture>;
export function sampleArchitectureExpansion(before:Architecture,after:Architecture,progress:number){
 if(!Number.isFinite(progress)||before.scope.tenantId!==after.scope.tenantId||before.scope.workspaceId!==after.scope.workspaceId||after.revision<=before.revision)throw Error('ARCHITECTURE_TRANSITION_DENIED');
 const t=after.policy.reducedMotion?1:Math.max(0,Math.min(1,progress)),e=t*t*(3-2*t);
 const old=new Map(before.rooms.map(r=>[r.id,r]));
 const rooms=after.rooms.map(r=>{const a=old.get(r.id);if(a&&a.slot!==r.slot)throw Error('ARCHITECTURE_RELAYOUT_REQUIRED');return {...r,width:a?a.width+(r.width-a.width)*e:r.width,depth:a?a.depth+(r.depth-a.depth)*e:r.depth,opacity:a?1:e};});
 const byId=new Map(rooms.map(r=>[r.id,r]));
 const corridors=after.corridors.map(c=>{const a=byId.get(c.from)!,b=byId.get(c.to)!,horizontal=a.slot%4!==b.slot%4;
 const start:Point=horizontal?[a.center[0]+a.width/2,0,a.center[2]]:[a.center[0],0,a.center[2]+a.depth/2];
 const end:Point=horizontal?[b.center[0]-b.width/2,0,b.center[2]]:[b.center[0],0,b.center[2]-b.depth/2];
 return {...c,start,end,length:Math.hypot(end[0]-start[0],end[2]-start[2]),opacity:Math.min(a.opacity,b.opacity)};});
 return {rooms,corridors,complete:t===1};
}
