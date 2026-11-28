import {z} from 'zod';
import {prepareGraphicsText} from './text.js';
const unit=z.number().finite().min(0).max(1);
export const EditorialMotionSpec=z.strictObject({
 durationMs:z.number().int().min(120).max(1800),staggerMs:z.number().int().min(0).max(120),
 groups:z.array(z.strictObject({start:z.number().int().nonnegative(),end:z.number().int().positive()})).min(1).max(5),
 displacementEm:z.number().finite().min(0).max(.8),blurPx:z.number().finite().min(0).max(8),
 opticalSize:z.tuple([z.number().min(9).max(144),z.number().min(9).max(144)]),
 weight:z.tuple([z.number().min(400).max(500),z.number().min(400).max(500)]),
 intensity:unit
});
export function compileEditorialMotion(text:unknown,input:unknown){
 const source=prepareGraphicsText(text);if(!source.ok)throw Error(source.code);
 const spec=EditorialMotionSpec.parse(input),boundaries=new Set([0,...source.graphemes.map(g=>g.end)]);
 let cursor=0;
 for(const g of spec.groups){if(g.start!==cursor||g.end<=g.start||!boundaries.has(g.end))throw Error('INVALID_EDITORIAL_GROUP');cursor=g.end;}
 if(cursor!==source.text.sourceText.length||spec.staggerMs*(spec.groups.length-1)>=spec.durationMs)throw Error('INVALID_EDITORIAL_TIMELINE');
 return {spec,text:source.text,groups:spec.groups.map(g=>source.text.sourceText.slice(g.start,g.end))};
}
export type EditorialPlan=ReturnType<typeof compileEditorialMotion>;
export function sampleEditorial(plan:EditorialPlan,ms:number,reduced=false){
 if(!Number.isFinite(ms))throw Error('INVALID_EDITORIAL_TIME');
 const s=plan.spec,span=s.durationMs-s.staggerMs*(s.groups.length-1);
 return plan.groups.map((text,i)=>{const t=reduced?1:Math.max(0,Math.min(1,(ms-i*s.staggerMs)/span)),e=1-(1-t)**3,k=(1-e)*s.intensity;
 return {text,opacity:1-k,translateEm:k*s.displacementEm,blurPx:k*s.blurPx,maskInset:k*100,opsz:s.opticalSize[1]+(s.opticalSize[0]-s.opticalSize[1])*k,weight:s.weight[1]+(s.weight[0]-s.weight[1])*k};});
}
export const ButtonPoseSchema=z.strictObject({hover:unit,press:unit,focus:unit,x:unit,y:unit});
export type ButtonPose=z.infer<typeof ButtonPoseSchema>;
export function sampleEditorialButton(from:ButtonPose,to:ButtonPose,t:number,reduced=false){
 const a=ButtonPoseSchema.parse(from),b=ButtonPoseSchema.parse(to);if(!Number.isFinite(t))throw Error('INVALID_BUTTON_TIME');
 const e=reduced?1:1-(1-Math.max(0,Math.min(1,t)))**3;
 const p={...a};for(const key of Object.keys(a) as (keyof ButtonPose)[])p[key]=a[key]+(b[key]-a[key])*e;
 return {pose:p,css:{'--ag-hover':String(p.hover),'--ag-press':String(p.press),'--ag-focus':String(p.focus),'--ag-light-x':(p.x*100)+'%','--ag-light-y':(p.y*100)+'%','--ag-lift':(reduced?0:p.press*2-p.hover*2)+'px'}};
}
