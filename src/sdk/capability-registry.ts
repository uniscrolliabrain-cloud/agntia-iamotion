import {compileLivingSkill,type Capability} from './living-skill.js';
const common={revision:1,maturity:'implemented',environments:['browser','node'],requires:[],evidence:[],uxConstraints:['Preserve approved layout, text and data; respect reduced motion.']} as const;
export const capabilityRegistry:Capability[]=[
 ['aesthetic.scene','Aesthetic scene','Compile bounded visual layers','src/factory/graphics/aesthetic-runtime.ts','compileAestheticScene'],
 ['aesthetic.sample','Scene sampling','Sample a compiled scene at a given time','src/factory/graphics/aesthetic-runtime.ts','sampleAestheticScene'],
 ['cinematic.sequence','Cinematic sequence','Compile cinematic plans','src/factory/graphics/cinematic-sequence.ts','compileCinematicSequence'],
 ['cinematic.frame','Cinematic frame','Sample a cinematic frame','src/factory/graphics/cinematic-sequence.ts','sampleCinematicFrame'],
 ['aesthetic.session','Aesthetic session','Load, seek and dispose through a host adapter','src/sdk/aesthetic-session.ts','createAestheticSession']
].map(([id,title,description,source,symbol])=>({...common,id,title,description,source,symbol,environments:[...common.environments],requires:[],evidence:[],uxConstraints:[...common.uxConstraints]}));
export function buildMotionKnowledge(packageVersion:string,host?:unknown){return compileLivingSkill(capabilityRegistry,packageVersion,host);}
