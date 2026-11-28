import {z} from 'zod';
const u=z.number().finite().min(0).max(1),rgb=z.tuple([u,u,u]);
const light=z.strictObject({id:z.string().min(1).max(64),color:rgb,x:u,y:u,radius:z.number().finite().min(.08).max(2),strength:u,drift:z.number().finite().min(0).max(.25),phase:u});
export const AmbientFieldSchema=z.strictObject({base:rgb,lights:z.array(light).max(8),periodMs:z.number().int().min(8000).max(180000),intensity:u,reducedMotion:z.boolean(),active:z.boolean()});
export type AmbientFieldSpec=z.infer<typeof AmbientFieldSchema>;
type RGB=z.infer<typeof rgb>;
export type AmbientFrame={base:RGB;lights:{id:string;color:RGB;x:number;y:number;radius:number;strength:number}[]};
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
export function sampleAmbientField(input:unknown,ms:number):AmbientFrame{
 const s=AmbientFieldSchema.parse(input);if(!Number.isFinite(ms)||new Set(s.lights.map(l=>l.id)).size!==s.lights.length)throw Error('INVALID_AMBIENT_FIELD');
 const phase=s.active&&!s.reducedMotion?2*Math.PI*((ms%s.periodMs+s.periodMs)%s.periodMs)/s.periodMs:0;
 return {base:s.base,lights:s.lights.map(l=>{const a=phase+l.phase*2*Math.PI,d=s.reducedMotion?0:l.drift*s.intensity;return {id:l.id,color:l.color,x:clamp(l.x+d*Math.cos(a)),y:clamp(l.y+d*Math.sin(a)),radius:l.radius,strength:l.strength*s.intensity};})};
}
const lin=(x:number)=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4;
const srgb=(x:number)=>x<=.0031308?12.92*x:1.055*x**(1/2.4)-.055;
function mix(a:RGB,b:RGB,t:number):RGB{return [0,1,2].map(i=>srgb(lin(a[i])*(1-t)+lin(b[i])*t)) as RGB;}
export function blendAmbientFrames(a:AmbientFrame,b:AmbientFrame,progress:number):AmbientFrame{
 if(!Number.isFinite(progress))throw Error('INVALID_AMBIENT_PROGRESS');
 const t=clamp(progress),e=t*t*(3-2*t),old=new Map(a.lights.map(l=>[l.id,l])),next=new Map(b.lights.map(l=>[l.id,l]));
 const ids=[...new Set([...old.keys(),...next.keys()])];if(ids.length>16)throw Error('AMBIENT_BLEND_BUDGET');
 return {base:mix(a.base,b.base,e),lights:ids.map(id=>{const x=old.get(id),y=next.get(id),p=x??{...y!,strength:0},q=y??{...x!,strength:0},m=(a:number,b:number)=>a+(b-a)*e;return {id,color:mix(p.color,q.color,e),x:m(p.x,q.x),y:m(p.y,q.y),radius:m(p.radius,q.radius),strength:m(p.strength,q.strength)};}).filter(l=>l.strength>0)};
}
export function ambientCss(frame:AmbientFrame){
 const color=(c:RGB)=>c.map(v=>Math.round(clamp(v)*255)).join(',');
 return [...frame.lights.map(l=>`radial-gradient(ellipse at ${l.x*100}% ${l.y*100}%,rgba(${color(l.color)},${l.strength}) 0%,rgba(${color(l.color)},0) ${l.radius*100}%)`),`rgb(${color(frame.base)})`].join(',');
}
export const ambientFragmentShader=`#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform vec3 uBase;
uniform vec4 uLightGeometry[16];
uniform vec3 uLightColor[16];
uniform int uCount;
uniform float uAspect;
void main(){
 vec3 c=uBase;
 for(int i=15;i>=0;i--){
 if(i>=uCount)continue;
 vec4 g=uLightGeometry[i];
 vec2 d=(vUv-g.xy)*vec2(max(.1,uAspect),1.);
 float w=exp(-3.*dot(d,d)/max(.0064,g.z*g.z))*clamp(g.w,0.,1.);
 c=mix(c,uLightColor[i],w);
 }
 fragColor=vec4(clamp(c,0.,1.),1.);
}`;
