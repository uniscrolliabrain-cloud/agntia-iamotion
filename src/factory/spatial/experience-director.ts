import {z} from 'zod';
import type {compileImmersiveExperience} from './immersive-experience.js';
import {navigateFractal,type FractalNavigationState} from './fractal-navigation.js';
import {sampleSpatialTour,type SpatialTourPlan} from './learning-tour.js';
import {sampleCinematicFrame,type CinematicPlan} from '../graphics/cinematic-sequence.js';
type Experience=ReturnType<typeof compileImmersiveExperience>;
const Id=z.string().regex(/^[a-z0-9][a-z0-9-]{0,95}$/);
const Command=z.discriminatedUnion('kind',[
 z.strictObject({kind:z.literal('navigate'),command:z.unknown()}),
 z.strictObject({kind:z.literal('film')}),
 z.strictObject({kind:z.literal('tour'),id:Id}),
 z.strictObject({kind:z.literal('pause')}),
 z.strictObject({kind:z.literal('resume')}),
 z.strictObject({kind:z.literal('stop')}),
 z.strictObject({kind:z.literal('seek'),ms:z.number().finite().nonnegative()}),
 z.strictObject({kind:z.literal('advance'),ms:z.number().finite().min(0).max(1000)})
]);
type Playback={kind:'film';plan:CinematicPlan}|{kind:'tour';plan:SpatialTourPlan};
export function createExperienceDirector(experience:Experience,options:{reducedMotion:boolean}){
 let navigation:FractalNavigationState=structuredClone(experience.initial),playback:Playback|null=null,timeMs=0,paused=false,disposed=false;
 const ensure=()=>{if(disposed)throw Error('DIRECTOR_DISPOSED');};
 function stop(){playback=null;timeMs=0;paused=false;}
 function snapshot(){
 ensure();
 const durationMs=playback?.plan.durationMs??0;
 const complete=!!playback&&timeMs>=durationMs;
 const frame=playback?.kind==='film'?sampleCinematicFrame(playback.plan,Math.min(Math.ceil(durationMs*playback.plan.spec.fps/1000)-1,Math.floor(timeMs*playback.plan.spec.fps/1000))):playback?.kind==='tour'?sampleSpatialTour(playback.plan,timeMs,options.reducedMotion):null;
 return {mode:playback?.kind??'explore',navigation:structuredClone(navigation),projection:experience.project(navigation),timeMs,durationMs,status:!playback?'idle':complete?'complete':paused?'paused':'playing',frame};
 }
 function dispatch(input:unknown){
 ensure();const c=Command.parse(input);
 switch(c.kind){
 case 'navigate':{const next=navigateFractal(experience.composition,navigation,c.command);navigation=next;stop();break;}
 case 'film':{const plan=experience.resolveFilm(navigation);if(options.reducedMotion&&plan.shots.some(s=>!s.plan.policy.surface.reducedMotion))throw Error('REDUCED_MOTION_FILM_REQUIRED');playback={kind:'film',plan};timeMs=0;paused=false;break;}
 case 'tour':{const plan=experience.resolveInstallation(navigation).tours.find(t=>t.spec.id===c.id);if(!plan)throw Error('DIRECTOR_TOUR_DENIED');playback={kind:'tour',plan};timeMs=0;paused=false;break;}
 case 'stop':stop();break;
 case 'pause':if(playback)paused=true;break;
 case 'resume':if(playback&&timeMs<playback.plan.durationMs)paused=false;break;
 case 'seek':if(!playback)throw Error('DIRECTOR_NO_PLAYBACK');timeMs=Math.min(c.ms,playback.plan.durationMs);break;
 case 'advance':if(playback&&!paused)timeMs=Math.min(playback.plan.durationMs,timeMs+c.ms);break;
 }
 return snapshot();
 }
 return {snapshot,dispatch,dispose(){if(!disposed){stop();disposed=true;}}};
}
