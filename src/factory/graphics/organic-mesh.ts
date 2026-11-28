import {z} from 'zod';
const scalar=z.number().finite().min(-10).max(10),positive=z.number().finite().min(.02).max(10);
const vec=z.tuple([scalar,scalar,scalar]);type V=[number,number,number];
const Spec=z.strictObject({points:z.array(vec).min(4).max(32),segments:z.number().int().min(8).max(256),sides:z.number().int().min(8).max(64),width:positive,depth:positive,twist:scalar,wave:z.number().finite().min(0).max(.5),phase:scalar});
export type OrganicMeshSpec=z.infer<typeof Spec>;
const add=(a:V,b:V):V=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]];
const sub=(a:V,b:V):V=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
const mul=(a:V,s:number):V=>[a[0]*s,a[1]*s,a[2]*s];
const dot=(a:V,b:V)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const cross=(a:V,b:V):V=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
function norm(a:V):V{const l=Math.hypot(...a);if(l<1e-8)throw Error('DEGENERATE_ORGANIC_FRAME');return mul(a,1/l);}
function curve(points:V[],t:number):V{
 const q=Math.max(0,Math.min(1,t))*(points.length-1),i=Math.min(points.length-2,Math.floor(q)),u=q-i;
 const a=points[Math.max(0,i-1)],b=points[i],c=points[i+1],d=points[Math.min(points.length-1,i+2)];
 return [0,1,2].map(k=>.5*((2*b[k])+(-a[k]+c[k])*u+(2*a[k]-5*b[k]+4*c[k]-d[k])*u*u+(-a[k]+3*b[k]-3*c[k]+d[k])*u*u*u)) as V;
}
export function buildOrganicMesh(input:unknown){
 const s=Spec.parse(input),stride=s.sides+1,n=(s.segments+1)*stride,positions=new Float32Array((n+2)*3),normals=new Float32Array(positions.length),uv=new Float32Array((n+2)*2),indices:number[]=[];
 let previous:V|undefined;
 for(let i=0;i<=s.segments;i++){
 const t=i/s.segments,c=curve(s.points,t),tangent=norm(sub(curve(s.points,t+.0001),curve(s.points,t-.0001)));
 const seed:V=previous??(Math.abs(tangent[1])<.9?[0,1,0]:[1,0,0]);
 let projected=sub(seed,mul(tangent,dot(seed,tangent)));
 if(Math.hypot(...projected)<1e-6){const fallback:V=Math.abs(tangent[1])<.9?[0,1,0]:[1,0,0];projected=sub(fallback,mul(tangent,dot(fallback,tangent)));}
 const normal=norm(projected),binormal=norm(cross(tangent,normal));previous=normal;
 const angle=s.twist*t,axis=add(mul(normal,Math.cos(angle)),mul(binormal,Math.sin(angle))),other=cross(tangent,axis);
 const scale=1+s.wave*Math.sin(t*Math.PI*4+s.phase);
 for(let j=0;j<=s.sides;j++){const a=j/s.sides*Math.PI*2,k=i*stride+j;
 const p=add(c,add(mul(axis,Math.cos(a)*s.width*scale),mul(other,Math.sin(a)*s.depth/scale)));positions.set(p,k*3);uv.set([t,j/s.sides],k*2);
 if(i<s.segments&&j<s.sides)indices.push(k,k+1,k+stride,k+1,k+stride+1,k+stride);}
 }
 for(const end of [0,1]){const center=n+end,base=end*s.segments*stride;positions.set(curve(s.points,end),center*3);uv.set([end,.5],center*2);for(let j=0;j<s.sides;j++)if(end)indices.push(center,base+j,base+j+1);else indices.push(center,base+j+1,base+j);}
 for(let i=0;i<indices.length;i+=3){const a=indices[i]*3,b=indices[i+1]*3,c=indices[i+2]*3;const v=cross([positions[b]-positions[a],positions[b+1]-positions[a+1],positions[b+2]-positions[a+2]],[positions[c]-positions[a],positions[c+1]-positions[a+1],positions[c+2]-positions[a+2]]);for(const k of [a,b,c])for(let j=0;j<3;j++)normals[k+j]+=v[j];}
 for(let i=0;i<=s.segments;i++){const a=i*stride*3,b=a+s.sides*3;for(let j=0;j<3;j++){const v=normals[a+j]+normals[b+j];normals[a+j]=normals[b+j]=v;}}
 for(let i=0;i<normals.length;i+=3){const v=norm([normals[i],normals[i+1],normals[i+2]]);normals.set(v,i);}
 return {positions,normals,uv,indices:new Uint32Array(indices)};
}
export function morphOrganicMesh(from:unknown,to:unknown,progress:number){
 const a=Spec.parse(from),b=Spec.parse(to);if(!Number.isFinite(progress)||a.points.length!==b.points.length||a.segments!==b.segments||a.sides!==b.sides)throw Error('ORGANIC_TOPOLOGY_MISMATCH');
 const t=Math.max(0,Math.min(1,progress)),e=t*t*(3-2*t),m=(x:number,y:number)=>x+(y-x)*e;
 return buildOrganicMesh({...b,points:a.points.map((p,i)=>p.map((v,j)=>m(v,b.points[i][j]))),width:m(a.width,b.width),depth:m(a.depth,b.depth),twist:m(a.twist,b.twist),wave:m(a.wave,b.wave),phase:m(a.phase,b.phase)});
}
