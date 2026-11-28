import {z} from 'zod';
const u=z.number().finite().min(0).max(1);
const rgb=z.tuple([u,u,u]);
export const OpticalPolicy=z.strictObject({glass:z.boolean(),refraction:z.boolean(),reducedMotion:z.boolean(),intensity:u,maxGlassLayers:z.number().int().min(0).max(8)});
const Layer=z.strictObject({id:z.string().min(1).max(96),depth:z.number().int().min(0).max(8),focus:u,relation:u,press:u,base:rgb,ink:rgb,backdrop:rgb});
type RGB=z.infer<typeof rgb>;
const linear=(x:number)=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4;
const luminance=(c:RGB)=>.2126*linear(c[0])+.7152*linear(c[1])+.0722*linear(c[2]);
const contrast=(a:RGB,b:RGB)=>{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
const blend=(a:RGB,b:RGB,t:number):RGB=>[a[0]*t+b[0]*(1-t),a[1]*t+b[1]*(1-t),a[2]*t+b[2]*(1-t)];
export function resolveOpticalLayers(input:unknown,policyInput:unknown){
 const layers=z.array(Layer).max(64).parse(input),p=OpticalPolicy.parse(policyInput);
 if(new Set(layers.map(l=>l.id)).size!==layers.length)throw Error('DUPLICATE_OPTICAL_LAYER');
 const selected=new Set([...layers].filter(l=>l.focus+l.press+l.relation>0).sort((a,b)=>(b.focus*3+b.press*2+b.relation)-(a.focus*3+a.press*2+a.relation)||(a.id<b.id?-1:a.id>b.id?1:0)).slice(0,p.maxGlassLayers).map(l=>l.id));
 return layers.map(l=>{
 const strength=p.glass&&selected.has(l.id)?Math.min(1,l.focus*.5+l.press*.7+l.relation*.2)*p.intensity:0;
 let alpha=1-strength*.42;
 // Conservative contrast against supplied backdrop and both luminance extremes.
 const safe=(a:number)=>[l.backdrop,[0,0,0] as RGB,[1,1,1] as RGB].every(bg=>contrast(l.ink,blend(l.base,bg,a))>=4.5);
 while(alpha<1&&!safe(alpha))alpha=Math.min(1,alpha+.025);
 const readable=safe(alpha),glass=(1-alpha)/.42;
 return {id:l.id,alpha,contentOpacity:1,blurPx:glass*18,refractionPx:p.refraction&&!p.reducedMotion?glass*5:0,roughness:.48-glass*.27,edgeLight:.08+glass*.42,depth:l.depth,readable,base:l.base,ink:l.ink};
 });
}
export type OpticalPose=ReturnType<typeof resolveOpticalLayers>[number];
export function opticalCss(p:OpticalPose,supported:boolean){
 const rgb=p.base.map(v=>Math.round(v*255)).join(',');
 return {'--ag-optical-fill':`rgba(${rgb},${supported?p.alpha:1})`,'--ag-optical-blur':`${supported?p.blurPx:0}px`,'--ag-optical-edge':String(p.edgeLight),'--ag-optical-ink':`rgb(${p.ink.map(v=>Math.round(v*255)).join(',')})`};
}
// WebGL2 fragment shader for an explicitly supplied, linear-filtered scene texture.
// No DOM capture, external fetch or arbitrary shader source.
export const opticalFragmentShader=`#version 300 es
precision highp float;
uniform sampler2D uScene;
uniform vec2 uResolution;
uniform vec2 uPointer;
uniform vec3 uTint;
uniform float uAlpha;
uniform float uRefraction;
uniform float uEdge;
uniform float uRadius;
in vec2 vUv;
out vec4 fragColor;
void main(){
 vec2 size=max(uResolution,vec2(1.0));
 vec2 p=(vUv-.5)*size;
 float radius=clamp(uRadius,1.0,min(size.x,size.y)*.49);
 vec2 q=abs(p)-(size*.5-radius);
 float sdf=length(max(q,0.0))+min(max(q.x,q.y),0.0)-radius;
 float mask=1.0-smoothstep(-1.0,1.0,sdf);
 float rim=exp(-abs(sdf)*.18);
 vec2 normal=normalize(p+vec2(.0001));
 vec2 uv=clamp(vUv+normal*rim*clamp(uRefraction,0.0,8.0)/size,vec2(0.0),vec2(1.0));
 vec3 scene=texture(uScene,uv).rgb;
 vec3 color=mix(scene,uTint,clamp(uAlpha,0.0,1.0));
 float highlight=exp(-length((vUv-uPointer)*vec2(2.0,3.0))*3.0);
 color=mix(color,vec3(1.0),clamp(rim*uEdge*(.3+.7*highlight),0.0,.45));
 fragColor=vec4(color,mask);
}`;
