import { z } from 'zod';
const unit = z.number().finite().min(0).max(1);
export const SurfacePoseSchema = z.object({
  opacity:unit, blurPx:z.number().finite().min(0).max(24),
  elevationPx:z.number().finite().min(0).max(12), highlight:unit,
  shadow:unit, tiltDeg:z.number().finite().min(-6).max(6),
  tint:unit, radiusPx:z.number().finite().min(8).max(32)
}).strict();
export type SurfacePose = z.infer<typeof SurfacePoseSchema>;
export const SurfacePolicySchema = z.object({glass:z.boolean(), spatial:z.boolean(), reducedMotion:z.boolean(), intensity:unit}).strict();
export type SurfacePolicy = z.infer<typeof SurfacePolicySchema>;
const poses = [
 {opacity:1,blurPx:0,elevationPx:0,highlight:0.1,shadow:0.12,tiltDeg:0,tint:0,radiusPx:16},
 {opacity:.86,blurPx:8,elevationPx:2,highlight:.35,shadow:.18,tiltDeg:0,tint:.08,radiusPx:16},
 {opacity:.66,blurPx:16,elevationPx:5,highlight:.65,shadow:.24,tiltDeg:0,tint:.14,radiusPx:18},
 {opacity:.58,blurPx:22,elevationPx:8,highlight:.8,shadow:.3,tiltDeg:4,tint:.2,radiusPx:20}
] as const;
export function surfaceTarget(stage:number, input:SurfacePolicy):SurfacePose {
 const policy=SurfacePolicySchema.parse(input);
 if(!Number.isInteger(stage)||stage<0||stage>3) throw new Error('INVALID_SURFACE_STAGE');
 const target=poses[policy.glass ? policy.spatial ? stage : Math.min(stage,2) : 0];
 const base=poses[0]; const result={...base} as SurfacePose;
 for(const key of Object.keys(base) as (keyof SurfacePose)[]) result[key]=base[key]+(target[key]-base[key])*policy.intensity;
 if(policy.reducedMotion){result.elevationPx=0;result.tiltDeg=0;}
 return SurfacePoseSchema.parse(result);
}
export function sampleSurface(from:SurfacePose,to:SurfacePose,elapsedMs:number,durationMs:number):SurfacePose {
 SurfacePoseSchema.parse(from);SurfacePoseSchema.parse(to);
 if(!Number.isFinite(elapsedMs)||!Number.isFinite(durationMs)||durationMs<0||durationMs>1000) throw new Error('INVALID_SURFACE_TIME');
 const t=durationMs===0?1:Math.max(0,Math.min(1,elapsedMs/durationMs));
 const eased=1-(1-t)**3;
 const result={...from};
 for(const key of Object.keys(from) as (keyof SurfacePose)[]) result[key]=from[key]+(to[key]-from[key])*eased;
 return SurfacePoseSchema.parse(result);
}
export function surfaceCss(pose:SurfacePose, supportsGlass:boolean):Record<string,string>{
 const p=SurfacePoseSchema.parse(pose);
 const alpha=supportsGlass?p.opacity:1;
 return {'--ag-motion-surface':`rgba(255,250,245,${alpha})`,'--ag-motion-blur':`${supportsGlass?p.blurPx:0}px`,'--ag-motion-elevation':`${p.elevationPx}px`,'--ag-motion-tilt':`${p.tiltDeg}deg`,'--ag-motion-radius':`${p.radiusPx}px`,'--ag-motion-highlight':String(p.highlight),'--ag-motion-shadow':String(p.shadow),'--ag-motion-tint':String(p.tint)};
}
