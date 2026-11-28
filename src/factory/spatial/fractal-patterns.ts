import {z} from 'zod';
import {FractalCompositionSchema,compileFractalComposition} from './fractal-composition.js';
const Id=z.string().regex(/^[a-z0-9][a-z0-9-]{0,95}$/);
export const FractalPatternSchema=z.strictObject({kind:z.enum(['orbit','constellation','gallery','corridor','terrace','helix']),parentId:Id,spacing:z.number().finite().min(.1).max(20),phase:z.number().finite().min(-Math.PI).max(Math.PI),columns:z.number().int().min(1).max(16)});
type Spec=z.infer<typeof FractalCompositionSchema>;
type Authority=Parameters<typeof compileFractalComposition>[1];
export function applyFractalPattern(input:unknown,patternInput:unknown,authority:Authority){
 const spec=FractalCompositionSchema.parse(input),p=FractalPatternSchema.parse(patternInput);
 compileFractalComposition(spec,authority);
 if(!spec.nodes.some(n=>n.id===p.parentId))throw Error('PATTERN_PARENT_MISSING');
 const children=spec.nodes.filter(n=>n.parentId===p.parentId).sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0);
 const count=children.length,s=p.spacing;
 const positions=new Map<string,[number,number,number]>();
 const radius=count<=1?0:s/(2*Math.sin(Math.PI/count));
 children.forEach((n,i)=>{
 let x=0,y=0,z=0;
 const angle=p.phase+2*Math.PI*i/Math.max(1,count);
 switch(p.kind){
 case 'orbit':x=radius*Math.cos(angle);z=radius*Math.sin(angle);break;
 case 'constellation':{const r=s*Math.sqrt(i),a=p.phase+i*Math.PI*(3-Math.sqrt(5));x=r*Math.cos(a);z=r*Math.sin(a);break;}
 case 'gallery':x=(i%p.columns-(Math.min(count,p.columns)-1)/2)*s;z=(Math.floor(i/p.columns)-(Math.ceil(count/p.columns)-1)/2)*s;break;
 case 'corridor':x=(i%2===0?-1:1)*s;z=(Math.floor(i/2)-(Math.ceil(count/2)-1)/2)*s;break;
 case 'terrace':x=(i%p.columns-(Math.min(count,p.columns)-1)/2)*s;z=Math.floor(i/p.columns)*s;y=Math.floor(i/p.columns)*s*.25;break;
 case 'helix':{const a=p.phase+i*Math.PI/3;x=s*Math.cos(a);z=s*Math.sin(a);y=(i-(count-1)/2)*s*.5;break;}
 }
 positions.set(n.id,[x,y,z]);
 });
 const result:Spec={...spec,nodes:spec.nodes.map(n=>positions.has(n.id)?{...n,position:positions.get(n.id)!}:n)};
 return {spec:result,plan:compileFractalComposition(result,authority)};
}
