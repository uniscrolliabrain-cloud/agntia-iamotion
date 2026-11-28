import {z} from 'zod';
const unit=z.number().finite().min(0).max(1), bounded=z.number().finite().min(-8).max(8);
const point=z.tuple([unit,unit,unit]);
export const OrganicFieldSpec=z.strictObject({seed:z.number().int().min(1).max(0xffffffff),count:z.number().int().min(1).max(2048),drag:z.number().finite().min(.1).max(12),speed:z.number().finite().min(.01).max(2),spring:z.number().finite().min(0).max(20),flow:z.number().finite().min(0).max(4),vortex:bounded,frequency:z.number().finite().min(1).max(16)});
export type OrganicFieldSpec=z.infer<typeof OrganicFieldSpec>;
const Pointer=z.strictObject({position:point,strength:bounded,radius:z.number().finite().min(.01).max(2)});
export class OrganicField {
 readonly spec:Readonly<OrganicFieldSpec>;
 readonly #p:Float32Array;readonly #v:Float32Array;readonly #targets:Float32Array;
 #tick=0;#random:number;
 constructor(input:unknown){this.spec=Object.freeze(OrganicFieldSpec.parse(input));this.#random=this.spec.seed;this.#p=new Float32Array(this.spec.count*3);this.#v=new Float32Array(this.#p.length);this.#targets=new Float32Array(this.#p.length);for(let i=0;i<this.#p.length;i++){this.#p[i]=this.#next();this.#targets[i]=this.#p[i];}}
 #next(){let x=this.#random;x^=x<<13;x^=x>>>17;x^=x<<5;this.#random=x>>>0;return this.#random/4294967296;}
 setTargets(input:unknown){const points=z.array(point).length(this.spec.count).parse(input);for(let i=0;i<points.length;i++)this.#targets.set(points[i],i*3);}
 advance(ticks:number,assembly:number,pointerInput?:unknown){
 if(!Number.isInteger(ticks)||ticks<0||ticks>240||this.#tick+ticks>1e7)throw Error('ORGANIC_TICK_LIMIT');
 const blend=unit.parse(assembly),pointer=pointerInput===undefined?undefined:Pointer.parse(pointerInput),s=this.spec,dt=1/120,decay=Math.exp(-s.drag*dt);
 for(let k=0;k<ticks;k++){const phase=this.#tick*dt*.35;for(let i=0;i<this.#p.length;i+=3){
 const x=this.#p[i],y=this.#p[i+1],zz=this.#p[i+2],f=s.frequency;
 // Analytic curl of a periodic vector potential: divergence-free in the interior.
 let ax=(Math.cos(f*y+phase)-Math.cos(f*zz-phase))*s.flow*(1-blend);
 let ay=(Math.cos(f*zz+phase)-Math.cos(f*x-phase))*s.flow*(1-blend);
 let az=(Math.cos(f*x+phase)-Math.cos(f*y-phase))*s.flow*(1-blend);
 const dx=x-.5,dy=y-.5,rad=Math.hypot(dx,dy),swirl=s.vortex*(1-blend)*Math.exp(-rad*rad*6);
 ax-=dy*swirl;ay+=dx*swirl;
 ax+=(this.#targets[i]-x)*s.spring*blend;ay+=(this.#targets[i+1]-y)*s.spring*blend;az+=(this.#targets[i+2]-zz)*s.spring*blend;
 if(pointer){const px=pointer.position[0]-x,py=pointer.position[1]-y,pz=pointer.position[2]-zz,d=Math.hypot(px,py,pz);if(d>1e-6&&d<pointer.radius){const w=pointer.strength*(1-d/pointer.radius)**2/d;ax+=px*w;ay+=py*w;az+=pz*w;}}
 let vx=(this.#v[i]+ax*dt)*decay,vy=(this.#v[i+1]+ay*dt)*decay,vz=(this.#v[i+2]+az*dt)*decay;const scale=Math.min(1,s.speed/Math.max(1e-9,Math.hypot(vx,vy,vz)));vx*=scale;vy*=scale;vz*=scale;
 for(const [j,v] of [[0,vx],[1,vy],[2,vz]]){const p=this.#p[i+j]+v*dt;this.#p[i+j]=Math.max(0,Math.min(1,p));this.#v[i+j]=p<0||p>1?-v*.5:v;}
 }this.#tick++;}
 }
 sample(){return this.#p.slice();}
 copyInto(out:Float32Array){if(out.length!==this.#p.length)throw Error('ORGANIC_BUFFER_SIZE');out.set(this.#p);}
}
export function constellationTargets(count:number):[number,number,number][]{
 if(!Number.isInteger(count)||count<1||count>2048)throw Error('TARGET_COUNT');
 const golden=Math.PI*(3-Math.sqrt(5));return Array.from({length:count},(_,i)=>{const y=1-2*(i+.5)/count,r=Math.sqrt(1-y*y),a=i*golden;return [.5+.32*r*Math.cos(a),.5+.32*y,.5+.32*r*Math.sin(a)];});
}
export function ribbonTargets(count:number):[number,number,number][]{
 if(!Number.isInteger(count)||count<1||count>2048)throw Error('TARGET_COUNT');
 return Array.from({length:count},(_,i)=>{const t=i/Math.max(1,count-1),a=t*Math.PI*4;return [.12+.76*t,.5+.22*Math.sin(a),.5+.18*Math.cos(a)];});
}
