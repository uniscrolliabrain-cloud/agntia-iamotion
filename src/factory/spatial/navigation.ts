import type {compileSpatialView} from './topography.js';
type World=ReturnType<typeof compileSpatialView>;
export type SpatialCameraPose={target:[number,number,number];distance:number;yaw:number;pitch:number};
export type SpatialFocus={kind:'overview'}|{kind:'room'|'entity';id:string};
export function spatialBookmark(world:World,focus:SpatialFocus):SpatialCameraPose{
 if(focus.kind==='overview'){const xs=world.view.rooms.map(r=>r.slot%4*24),zs=world.view.rooms.map(r=>Math.floor(r.slot/4)*24);return {target:[(Math.min(...xs)+Math.max(...xs))/2,0,(Math.min(...zs)+Math.max(...zs))/2],distance:Math.max(38,Math.hypot(Math.max(...xs)-Math.min(...xs)+22,Math.max(...zs)-Math.min(...zs)+22)*1.5),yaw:.65,pitch:.85};}
 if(focus.kind==='room'){const r=world.view.rooms.find(r=>r.id===focus.id);if(!r)throw Error('UNKNOWN_ROOM');return {target:[r.slot%4*24,0,Math.floor(r.slot/4)*24],distance:32,yaw:.65,pitch:.85};}
 const p=world.positions.find(p=>p.id===focus.id);if(!p)throw Error('UNKNOWN_ENTITY');return {target:[p.x,1,p.z],distance:7,yaw:.65,pitch:.45};
}
export function interpolateSpatialCamera(a:SpatialCameraPose,b:SpatialCameraPose,progress:number,reduced=false):SpatialCameraPose{
 if(!Number.isFinite(progress))throw Error('INVALID_CAMERA_PROGRESS');const t=reduced?1:Math.max(0,Math.min(1,progress)),e=t*t*(3-2*t),mix=(x:number,y:number)=>x+(y-x)*e,delta=Math.atan2(Math.sin(b.yaw-a.yaw),Math.cos(b.yaw-a.yaw));
 return {target:[mix(a.target[0],b.target[0]),mix(a.target[1],b.target[1]),mix(a.target[2],b.target[2])],distance:Math.exp(mix(Math.log(a.distance),Math.log(b.distance))),yaw:a.yaw+delta*e,pitch:mix(a.pitch,b.pitch)};
}
export function spatialSemanticLevel(distance:number){if(!Number.isFinite(distance)||distance<=0)throw Error('INVALID_CAMERA_DISTANCE');return distance>45?'overview':distance>12?'room':'entity';}
