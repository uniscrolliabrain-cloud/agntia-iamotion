import {z} from 'zod';
const tau=2*Math.PI;
export const AnnularSpec=z.strictObject({inner:z.number().finite().min(.05).max(10),outer:z.number().finite().min(.1).max(12),depth:z.number().finite().min(.02).max(4),bevel:z.number().finite().min(.001).max(.5),start:z.number().finite().min(-tau*4).max(tau*4),sweep:z.number().finite().min(0).max(tau),segments:z.number().int().min(16).max(256)}).refine(s=>s.outer>s.inner&&s.bevel<Math.min((s.outer-s.inner)/2,s.depth/2));
export type AnnularSpec=z.infer<typeof AnnularSpec>;
export type AnnularBuffers={positions:Float32Array,normals:Float32Array,uv:Float32Array,indices:Uint32Array};
// Rounded rectangular radial cross-section, swept along the angular interval.
// Separate end caps preserve the sharp normal discontinuity at segment boundaries.
export function buildAnnularMesh(input:AnnularSpec):AnnularBuffers{
 const s=AnnularSpec.parse(input),profile:number[][]=[],steps=6;
 const corners=[[s.outer-s.bevel,s.depth/2-s.bevel,0],[s.inner+s.bevel,s.depth/2-s.bevel,Math.PI/2],[s.inner+s.bevel,-s.depth/2+s.bevel,Math.PI],[s.outer-s.bevel,-s.depth/2+s.bevel,3*Math.PI/2]];
 for(const [r,y,a] of corners)for(let k=0;k<=steps;k++){const t=a+k*Math.PI/(2*steps);profile.push([r+s.bevel*Math.cos(t),y+s.bevel*Math.sin(t),Math.cos(t),Math.sin(t)]);}
 const n=profile.length,positions:number[]=[],normals:number[]=[],uv:number[]=[],indices:number[]=[];
 const vertex=(r:number,y:number,a:number,nr:number,ny:number,u:number,v:number)=>{positions.push(r*Math.cos(a),y,r*Math.sin(a));normals.push(nr*Math.cos(a),ny,nr*Math.sin(a));uv.push(u,v);};
 for(let i=0;i<=s.segments;i++){const u=i/s.segments,a=s.start+s.sweep*u;for(let j=0;j<n;j++){const [r,y,nr,ny]=profile[j];vertex(r,y,a,nr,ny,u,j/n);}}
 for(let i=0;i<s.segments;i++)for(let j=0;j<n;j++){const a=i*n+j,b=i*n+(j+1)%n,c=a+n,d=b+n;indices.push(a,b,c,b,d,c);}
 for(const end of [0,1]){const a=s.start+end*s.sweep,base=positions.length/3,sign=end?1:-1;const cap=(r:number,y:number)=>{positions.push(r*Math.cos(a),y,r*Math.sin(a));normals.push(-Math.sin(a)*sign,0,Math.cos(a)*sign);uv.push((r-s.inner)/(s.outer-s.inner),y/s.depth+.5);};cap((s.inner+s.outer)/2,0);for(const [r,y] of profile)cap(r,y);if(s.sweep<tau-1e-8)for(let j=0;j<n;j++){const b=base+1+j,c=base+1+(j+1)%n;if(end)indices.push(base,b,c);else indices.push(base,c,b);}}
 return {positions:new Float32Array(positions),normals:new Float32Array(normals),uv:new Float32Array(uv),indices:new Uint32Array(indices)};
}
const Rows=z.array(z.strictObject({id:z.string().min(1).max(96),label:z.string().min(1).max(160),value:z.number().finite().min(0).max(1e12)})).min(1).max(16);
export type AnnularDatum=z.infer<typeof Rows>[number];
export type AnnularSegment=AnnularDatum&{start:number;sweep:number;fraction:number};
export function annularLayout(input:unknown):AnnularSegment[]{
 const rows=Rows.parse(input);if(new Set(rows.map(r=>r.id)).size!==rows.length)throw Error('DUPLICATE_SEGMENT');
 const total=rows.reduce((a,r)=>a+r.value,0);let angle=-Math.PI/2;
 return rows.map(r=>{const fraction=total?r.value/total:0,sweep=fraction*tau,start=angle;angle+=sweep;return {...r,start,sweep,fraction};});
}
// Interpolate weights, then recompute contiguous angular boundaries. Stable order required.
export function morphAnnular(from:AnnularSegment[],to:AnnularSegment[],progress:number):AnnularSegment[]{
 if(!Number.isFinite(progress)||from.length!==to.length||from.some((r,i)=>r.id!==to[i].id))throw Error('INCOMPATIBLE_ANNULAR_MORPH');
 const t=Math.max(0,Math.min(1,progress)),e=t*t*(3-2*t);
 const geometry=annularLayout(to.map((r,i)=>({id:r.id,label:r.label,value:from[i].fraction+(r.fraction-from[i].fraction)*e})));
 return geometry.map((g,i)=>({...g,value:to[i].value,fraction:to[i].fraction}));
}
