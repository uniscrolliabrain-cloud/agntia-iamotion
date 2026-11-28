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
// Integrated spatial engines: implementation only, not certified or host-enabled.
capabilityRegistry.push(...[
  {
    "id": "museum.architecture",
    "title": "Spatial architecture",
    "description": "Compile bounded room and corridor geometry",
    "source": "src/factory/spatial/architecture.ts",
    "symbol": "compileSpatialArchitecture",
    "requires": []
  },
  {
    "id": "museum.expansion",
    "title": "Architecture expansion",
    "description": "Sample room expansion",
    "source": "src/factory/spatial/architecture.ts",
    "symbol": "sampleArchitectureExpansion",
    "requires": [
      "museum.architecture"
    ]
  },
  {
    "id": "museum.sculpture",
    "title": "Automation sculpture",
    "description": "Compile procedural automation sculpture recipes",
    "source": "src/factory/spatial/automation-sculpture.ts",
    "symbol": "automationSculpture",
    "requires": []
  },
  {
    "id": "museum.process",
    "title": "Process installation",
    "description": "Compile scoped acyclic process stations",
    "source": "src/factory/spatial/process-installation.ts",
    "symbol": "compileProcessInstallation",
    "requires": [
      "museum.sculpture"
    ]
  },
  {
    "id": "museum.catalog",
    "title": "Exhibit catalog",
    "description": "Read synthetic exhibit reference catalog",
    "source": "src/factory/spatial/exhibit-catalog.ts",
    "symbol": "museumExhibitCatalog",
    "requires": []
  },
  {
    "id": "museum.meta",
    "title": "Meta-app catalog",
    "description": "Read source-derived meta-app catalog",
    "source": "src/factory/spatial/meta-catalog.ts",
    "symbol": "museumMetaCatalog",
    "requires": []
  },
  {
    "id": "museum.view",
    "title": "Museum view",
    "description": "Generate synthetic meta-app spatial view",
    "source": "src/factory/spatial/meta-view.ts",
    "symbol": "museumMetaView",
    "requires": [
      "museum.meta"
    ]
  },
  {
    "id": "learning.tour",
    "title": "Spatial tour",
    "description": "Compile authorized guided tours",
    "source": "src/factory/spatial/learning-tour.ts",
    "symbol": "compileSpatialTour",
    "requires": []
  },
  {
    "id": "learning.sample",
    "title": "Tour sampling",
    "description": "Sample guided tour time",
    "source": "src/factory/spatial/learning-tour.ts",
    "symbol": "sampleSpatialTour",
    "requires": [
      "learning.tour"
    ]
  },
  {
    "id": "learning.sandbox",
    "title": "Synthetic experiment",
    "description": "Compile bounded arithmetic experiment",
    "source": "src/factory/spatial/learning-sandbox.ts",
    "symbol": "compileLearningSandbox",
    "requires": []
  },
  {
    "id": "learning.session",
    "title": "Learning session",
    "description": "Project explicit learning attempts",
    "source": "src/factory/spatial/learning-session.ts",
    "symbol": "projectLearningSession",
    "requires": []
  },
  {
    "id": "learning.review",
    "title": "Review schedule",
    "description": "Calculate due reviews at explicit time",
    "source": "src/factory/spatial/learning-session.ts",
    "symbol": "dueLearningReviews",
    "requires": [
      "learning.session"
    ]
  },
  {
    "id": "museum.constructor",
    "title": "Spatial constructor",
    "description": "Compile scoped installations and exhibits",
    "source": "src/factory/spatial/constructor.ts",
    "symbol": "compileSpatialConstructor",
    "requires": [
      "learning.tour",
      "learning.sandbox"
    ]
  },
  {
    "id": "museum.transition",
    "title": "Constructor transition",
    "description": "Compile revision-to-revision exhibit transitions",
    "source": "src/factory/spatial/constructor-transition.ts",
    "symbol": "compileConstructorTransition",
    "requires": [
      "museum.constructor"
    ]
  },
  {
    "id": "fractal.compile",
    "title": "Fractal composition",
    "description": "Compile scoped nested spatial units",
    "source": "src/factory/spatial/fractal-composition.ts",
    "symbol": "compileFractalComposition",
    "requires": []
  },
  {
    "id": "fractal.navigate",
    "title": "Fractal navigation",
    "description": "Navigate authorized units",
    "source": "src/factory/spatial/fractal-navigation.ts",
    "symbol": "navigateFractal",
    "requires": [
      "fractal.compile"
    ]
  },
  {
    "id": "fractal.project",
    "title": "Fractal projection",
    "description": "Project visible children in local coordinates",
    "source": "src/factory/spatial/fractal-navigation.ts",
    "symbol": "projectFractalNavigation",
    "requires": [
      "fractal.compile"
    ]
  },
  {
    "id": "fractal.pattern",
    "title": "Fractal patterns",
    "description": "Apply six deterministic geometric layouts",
    "source": "src/factory/spatial/fractal-patterns.ts",
    "symbol": "applyFractalPattern",
    "requires": [
      "fractal.compile"
    ]
  },
  {
    "id": "experience.compile",
    "title": "Immersive experience",
    "description": "Bind scoped installations and films",
    "source": "src/factory/spatial/immersive-experience.ts",
    "symbol": "compileImmersiveExperience",
    "requires": [
      "fractal.project",
      "museum.constructor",
      "cinematic.sequence"
    ]
  },
  {
    "id": "experience.direct",
    "title": "Experience director",
    "description": "Coordinate explicit playback clock and navigation",
    "source": "src/factory/spatial/experience-director.ts",
    "symbol": "createExperienceDirector",
    "requires": [
      "experience.compile",
      "learning.sample",
      "cinematic.frame",
      "fractal.navigate"
    ]
  },
  {
    "id": "experience.mix",
    "title": "Experience mixer",
    "description": "Sample seven keyframed visual channels",
    "source": "src/factory/spatial/experience-mixer.ts",
    "symbol": "compileExperienceMixer",
    "requires": []
  },
  {
    "id": "experience.edit",
    "title": "Mixer editor",
    "description": "Apply revisioned atomic timeline edits",
    "source": "src/factory/spatial/mixer-editor.ts",
    "symbol": "createMixerEditor",
    "requires": [
      "experience.mix"
    ]
  },
  {
    "id": "experience.record",
    "title": "Experience recording",
    "description": "Compile scoped recording and replay",
    "source": "src/factory/spatial/experience-recording.ts",
    "symbol": "compileExperienceRecording",
    "requires": [
      "experience.direct",
      "experience.edit"
    ]
  },
  {
    "id": "experience.capture",
    "title": "Experience recorder",
    "description": "Capture explicit visual commands",
    "source": "src/factory/spatial/experience-recording.ts",
    "symbol": "createExperienceRecorder",
    "requires": [
      "experience.record"
    ]
  }
].map(e=>({...common,...e,environments:[...common.environments],evidence:[],uxConstraints:[...common.uxConstraints,'Use scoped host authority; no operational writes or implicit certification.']})));
export function buildMotionKnowledge(packageVersion:string,host?:unknown){return compileLivingSkill(capabilityRegistry,packageVersion,host);}
