import {compileLivingSkill,type EngineCapability} from './living-skill.js';
const common={revision:1,maturity:'implemented',environments:['browser','node'],requires:[],evidence:[],uxConstraints:['Preserve approved layout, text and data; respect reduced motion.']} as const;
export const capabilityRegistry:EngineCapability[]=[
 ['aesthetic.scene','Aesthetic scene','Compile bounded visual layers','src/factory/graphics/aesthetic-runtime.ts','compileAestheticScene'],
 ['aesthetic.sample','Scene sampling','Sample a compiled scene at a given time','src/factory/graphics/aesthetic-runtime.ts','sampleAestheticScene'],
 ['cinematic.sequence','Cinematic sequence','Compile cinematic plans','src/factory/graphics/cinematic-sequence.ts','compileCinematicSequence'],
 ['cinematic.frame','Cinematic frame','Sample a cinematic frame','src/factory/graphics/cinematic-sequence.ts','sampleCinematicFrame'],
 ['spatial.compile','Spatial choreography','Compile bounded spatial transitions','src/factory/graphics/spatial-choreography.ts','compileSpatialChoreography'],
 ['spatial.sample','Spatial sampling','Sample spatial transitions','src/factory/graphics/spatial-choreography.ts','sampleSpatialChoreography'],
 ['spatial.gradient','Living gradient','Sample bounded gradient','src/factory/graphics/spatial-choreography.ts','sampleLivingGradient'],
 ['composition.bind','Behavior binding','Bind composition behavior tracks','src/factory/graphics/behavior-tracks.ts','bindCompositionBehaviors'],
 ['composition.sample','Composition frame','Sample composition frame','src/factory/graphics/behavior-tracks.ts','sampleCompositionFrame'],
 ['optical.resolve','Optical layers','Resolve optical layer policies','src/factory/materials/optical-layer.ts','resolveOpticalLayers'],
 ['optical.css','Optical CSS','Translate optical pose to CSS','src/factory/materials/optical-layer.ts','opticalCss'],
 ['aesthetic.session','Aesthetic session','Load, seek and dispose through a host adapter','src/sdk/aesthetic-session.ts','createAestheticSession']
].map(([id,title,description,source,symbol])=>({...common,id,title,description,source,symbol,environments:[...common.environments],requires:[],evidence:[],uxConstraints:[...common.uxConstraints]}));
export function buildMotionKnowledge(packageVersion:string,host?:unknown){return compileLivingSkill(capabilityRegistry,packageVersion,host);}
