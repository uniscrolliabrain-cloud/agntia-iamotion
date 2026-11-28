import {z} from 'zod';
const unit=z.number().finite().min(0).max(1);
const rect=z.strictObject({x:z.number().finite().min(-8192).max(8192),y:z.number().finite().min(-8192).max(8192),width:z.number().finite().min(1).max(8192),height:z.number().finite().min(1).max(8192)});
const node=z.strictObject({id:z.string().min(1).max(96),group:z.string().min(1).max(96),order:z.number().int().min(0).max(64),depth:z.number().int().min(0).max(8),from:rect,to:rect,relation:unit,visibility:z.enum(['enter','exit','retain'])});
export const SpatialChoreographySchema=z.strictObject({nodes:z.array(node).min(1).max(64),durationMs:z.number().int().min(120).max(1200),staggerMs:z.number().int().min(0).max(100),intensity:unit,focusId:z.string().optional(),reducedMotion:z.boolean()});
export function compileSpatialChoreography(input:unknown){
 const s=SpatialChoreographySchema.parse(input);
 if(new Set(s.nodes.map(n=>n.id)).size!==s.nodes.length||s.focusId&&!s.nodes.some(n=>n.id===s.focusId))throw Error('INVALID_SPATIAL_ID');
 const maxOrder=Math.max(...s.nodes.map(n=>n.order));
 if(maxOrder*s.staggerMs>=s.durationMs-100)throw Error('SPATIAL_CASCADE_BUDGET');
 return s;
}
export function sampleSpatialChoreography(input:unknown,ms:number){
 const s=compileSpatialChoreography(input);if(!Number.isFinite(ms))throw Error('INVALID_SPATIAL_TIME');
 const span=s.durationMs-Math.max(...s.nodes.map(n=>n.order))*s.staggerMs;
 return s.nodes.map(n=>{
 const t=s.reducedMotion?1:Math.max(0,Math.min(1,(ms-n.order*s.staggerMs)/span)),e=1-(1-t)**3;
 const mix=(a:number,b:number)=>a+(b-a)*e;
 const visibility=n.visibility==='enter'?e:n.visibility==='exit'?1-e:1;
 const dim=s.focusId&&s.focusId!==n.id?(1-n.relation)*s.intensity*.18:0;
 const x=mix(n.from.x,n.to.x),y=mix(n.from.y,n.to.y),w=mix(n.from.width,n.to.width),h=mix(n.from.height,n.to.height);
 return {id:n.id,group:n.group,opacity:visibility*(1-dim*e),zIndex:n.depth,interactive:n.visibility!=='exit'&&visibility>=.99,
 transform:s.reducedMotion?'none':`translate(${x-n.to.x}px,${y-n.to.y}px) scale(${w/n.to.width},${h/n.to.height})`,transformOrigin:'top left',backdropBlurPx:s.reducedMotion?0:Math.min(12,n.depth*1.5*s.intensity*e)};
 });
}
const rgb=z.tuple([unit,unit,unit]);
export const LivingGradientSchema=z.strictObject({colors:z.array(rgb).min(2).max(4),periodMs:z.number().int().min(4000).max(120000),amplitude:unit,reducedMotion:z.boolean(),active:z.boolean()});
export function sampleLivingGradient(input:unknown,ms:number){
 const s=LivingGradientSchema.parse(input);if(!Number.isFinite(ms))throw Error('INVALID_GRADIENT_TIME');
 const phase=s.active&&!s.reducedMotion?2*Math.PI*((ms%s.periodMs+s.periodMs)%s.periodMs)/s.periodMs:0;
 return s.colors.map((color,i)=>({color:color.map(v=>Math.round(v*255)),x:50+Math.cos(phase+i*2.399963)*30*s.amplitude,y:50+Math.sin(phase+i*2.399963)*30*s.amplitude,radius:55}));
}
