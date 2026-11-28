import {z} from 'zod';
const unit=z.number().finite().min(0).max(1);
const id=z.string().min(1).max(96);
const tile=z.strictObject({id,group:id,weight:z.number().finite().min(.1).max(8),depth:z.number().int().min(0).max(8),relation:unit});
const Layout=z.strictObject({width:z.number().finite().min(120).max(8192),height:z.number().finite().min(120).max(8192),gap:z.number().finite().min(0).max(32),tiles:z.array(tile).min(1).max(32)});
export type SpatialTilePose={id:string;group:string;x:number;y:number;width:number;height:number;opacity:number;depth:number};
export function layoutSpatialTiles(input:unknown):SpatialTilePose[]{
 const s=Layout.parse(input);if(new Set(s.tiles.map(t=>t.id)).size!==s.tiles.length)throw Error('DUPLICATE_TILE');
 const out:SpatialTilePose[]=[];
 function split(tiles:typeof s.tiles,x:number,y:number,w:number,h:number){
 if(tiles.length===1){const t=tiles[0];out.push({id:t.id,group:t.group,x,y,width:w,height:h,opacity:1,depth:t.depth});return;}
 const total=tiles.reduce((a,t)=>a+t.weight,0);let cut=1,sum=tiles[0].weight;
 while(cut<tiles.length-1&&Math.abs(sum+tiles[cut].weight-total/2)<Math.abs(sum-total/2)){sum+=tiles[cut++].weight;}
 const horizontal=w>=h,available=(horizontal?w:h)-s.gap,a=available*sum/total,b=available-a;
 if(Math.min(a,b)<1)throw Error('TILE_LAYOUT_TOO_SMALL');
 if(horizontal){split(tiles.slice(0,cut),x,y,a,h);split(tiles.slice(cut),x+a+s.gap,y,b,h);}
 else{split(tiles.slice(0,cut),x,y,w,a);split(tiles.slice(cut),x,y+a+s.gap,w,b);}
 }
 split(s.tiles,0,0,s.width,s.height);return out;
}
const Pose=z.strictObject({id,group:id,x:z.number().finite(),y:z.number().finite(),width:z.number().finite().positive(),height:z.number().finite().positive(),opacity:unit,depth:z.number().int().min(0).max(8)});
const Poses=z.array(Pose).max(64);
export class SpatialTransition {
 #from:SpatialTilePose[]=[];#to:SpatialTilePose[]=[];#start=0;#duration=600;#stagger=45;
 retarget(input:unknown,now:number,duration=600,stagger=45){
 const next=Poses.parse(input);if(!Number.isFinite(now)||!Number.isFinite(duration)||duration<120||duration>1200||!Number.isFinite(stagger)||stagger<0||stagger>100||new Set(next.map(p=>p.id)).size!==next.length)throw Error('INVALID_SPATIAL_TARGET');
 const current=this.sample(now),old=new Map(current.map(p=>[p.id,p])),incoming=new Set(next.map(p=>p.id));
 const from=next.map(p=>old.get(p.id)??{...p,opacity:0});
 const to=[...next];for(const p of current)if(!incoming.has(p.id)&&p.opacity>0){from.push(p);to.push({...p,opacity:0});}
 if(to.length>64)throw Error('SPATIAL_TRANSITION_BUDGET');
 this.#from=from;this.#to=to;this.#start=now;this.#duration=duration;this.#stagger=stagger;
 }
 sample(now:number,reduced=false):SpatialTilePose[]{
 if(!Number.isFinite(now))throw Error('INVALID_SPATIAL_CLOCK');
 const groups=[...new Set(this.#to.map(p=>p.group))],delay=Math.min(this.#stagger,(this.#duration-100)/Math.max(1,groups.length-1)),span=this.#duration-delay*Math.max(0,groups.length-1);
 return this.#to.flatMap((p,i)=>{const a=this.#from[i],t=reduced?1:Math.max(0,Math.min(1,(now-this.#start-groups.indexOf(p.group)*delay)/span)),e=1-(1-t)**3,mix=(x:number,y:number)=>x+(y-x)*e;const opacity=mix(a.opacity,p.opacity);if(t===1&&opacity===0)return [];return [{...p,x:mix(a.x,p.x),y:mix(a.y,p.y),width:mix(a.width,p.width),height:mix(a.height,p.height),opacity}];});
 }
}
