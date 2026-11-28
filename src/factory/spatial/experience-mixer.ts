import {z} from 'zod';
import {AestheticPolicySchema} from '../graphics/aesthetic-runtime.js';
import {AmbientFieldSchema,sampleAmbientField} from '../materials/ambient-field.js';
import {surfaceTarget} from '../materials/surface.js';
const Channel=z.enum(['motion','depth','glass','particles','illumination','background','camera']);
const Unit=z.number().finite().min(0).max(1);
const Values=z.strictObject({motion:Unit,depth:Unit,glass:Unit,particles:Unit,illumination:Unit,background:Unit,camera:Unit});
const Track=z.strictObject({channel:Channel,keys:z.array(z.strictObject({ms:z.number().int().min(0).max(600000),value:Unit,ease:z.enum(['linear','smooth','hold'])})).min(1).max(128)});
export const ExperienceMixerSchema=z.strictObject({version:z.literal(1),durationMs:z.number().int().min(120).max(600000),base:Values,tracks:z.array(Track).max(7)});
type Values=z.infer<typeof Values>;
export function compileExperienceMixer(input:unknown,policyInput:unknown,ambientInput:unknown){
 const spec=ExperienceMixerSchema.parse(input),policy=AestheticPolicySchema.parse(policyInput),ambient=AmbientFieldSchema.parse(ambientInput);
 const seen=new Set<string>();
 for(const t of spec.tracks){if(seen.has(t.channel))throw Error('DUPLICATE_MIXER_CHANNEL');seen.add(t.channel);let previous=-1;for(const k of t.keys){if(k.ms<=previous||k.ms>spec.durationMs)throw Error('INVALID_MIXER_KEY');previous=k.ms;}}
 function sample(ms:number){
 if(!Number.isFinite(ms))throw Error('INVALID_MIXER_TIME');
 const timeMs=Math.max(0,Math.min(spec.durationMs,ms)),values:Values={...spec.base};
 for(const t of spec.tracks){
 const i=t.keys.findIndex(k=>k.ms>timeMs);
 if(i===0){const b=t.keys[0];const p=timeMs/b.ms;values[t.channel]=spec.base[t.channel]+(b.value-spec.base[t.channel])*p;}
 else if(i===-1)values[t.channel]=t.keys[t.keys.length-1].value;
 else {const a=t.keys[i-1],b=t.keys[i],p=(timeMs-a.ms)/(b.ms-a.ms),e=a.ease==='hold'?0:a.ease==='smooth'?p*p*(3-2*p):p;values[t.channel]=a.value+(b.value-a.value)*e;}
 }
 const reduced=policy.surface.reducedMotion;
 const effective={...values,motion:reduced?0:values.motion,depth:policy.surface.spatial&&!reduced?values.depth:0,glass:policy.surface.glass?values.glass:0,particles:policy.particles&&!reduced?values.particles:0,camera:reduced?0:values.camera};
 const surface=surfaceTarget(3,{...policy.surface,spatial:effective.depth>0,intensity:policy.surface.intensity*effective.glass});
 const frame=sampleAmbientField({...ambient,intensity:ambient.intensity*effective.illumination,reducedMotion:ambient.reducedMotion||reduced,active:ambient.active&&effective.background>0,lights:ambient.lights.map(l=>({...l,drift:l.drift*effective.background}))},timeMs);
 return {timeMs,values,effective,surface,ambient:frame,particleBudget:Math.floor(policy.maxParticles*effective.particles),complete:timeMs===spec.durationMs};
 }
 return {spec,sample};
}
