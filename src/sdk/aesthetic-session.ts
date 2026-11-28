import {compileAestheticScene,sampleAestheticScene,retrieveAestheticTechniques,type AestheticPlan} from '../factory/graphics/aesthetic-runtime.js';
import {compileCinematicSequence,sampleCinematicFrame,type CinematicPlan} from '../factory/graphics/cinematic-sequence.js';
import {z} from 'zod';
const Features=z.array(z.enum(['surface','mesh','particles','editorial','blender','ambient','camera'])).max(7);
export type AestheticSessionPlan={kind:'scene';plan:AestheticPlan}|{kind:'film';plan:CinematicPlan};
export type AestheticSessionFrame={kind:'scene';timeMs:number;layers:ReturnType<typeof sampleAestheticScene>}|{kind:'film';timeMs:number;frame:ReturnType<typeof sampleCinematicFrame>};
export interface AestheticAdapter {
 capabilities():readonly string[];
 mount(plan:AestheticSessionPlan):void;
 draw(frame:AestheticSessionFrame):void;
 dispose():void;
}
export function createAestheticSession(adapter:AestheticAdapter,policy:unknown,lockedText:ReadonlyMap<string,unknown>,allowedFeatures:readonly string[]){
 const allowed=new Set(Features.parse(allowedFeatures)),features=new Set(Features.parse(adapter.capabilities()).filter(f=>allowed.has(f)));
 let current:AestheticSessionPlan|undefined,disposed=false,timeMs=0;
 const listeners=new Set<()=>void>();
 let snapshot:Readonly<{revision:number;timeMs:number;durationMs:number;kind:'scene'|'film'|null;disposed:boolean}>=Object.freeze({revision:0,timeMs:0,durationMs:0,kind:null,disposed:false});
 function publish(){snapshot=Object.freeze({revision:snapshot.revision+1,timeMs,durationMs:current?(current.kind==='scene'?current.plan.scene.durationMs:current.plan.durationMs):0,kind:current?.kind??null,disposed});for(const listener of [...listeners])listener();}
 function guard(){if(disposed)throw Error('AESTHETIC_SESSION_DISPOSED');}
 function seek(ms:number){guard();if(!current||!Number.isFinite(ms))throw Error('INVALID_SESSION_SEEK');const duration=current.kind==='scene'?current.plan.scene.durationMs:current.plan.durationMs;const t=Math.max(0,Math.min(duration,ms));const frame:AestheticSessionFrame=current.kind==='scene'?{kind:'scene',timeMs:t,layers:sampleAestheticScene(current.plan,t)}:{kind:'film',timeMs:t,frame:sampleCinematicFrame(current.plan,Math.floor(t*current.plan.spec.fps/1000))};adapter.draw(frame);timeMs=t;publish();return frame;}
 function load(kind:'scene'|'film',input:unknown){guard();const next:AestheticSessionPlan=kind==='scene'?{kind,plan:compileAestheticScene(input,policy,lockedText,features)}:{kind,plan:compileCinematicSequence(input,policy,lockedText,features)};adapter.mount(next);current=next;return seek(0);}
 return {load,seek,search(query:string){guard();return retrieveAestheticTechniques(query,features);},getSnapshot:()=>snapshot,subscribe(listener:()=>void){guard();listeners.add(listener);return ()=>{listeners.delete(listener);};},dispose(){if(disposed)return;disposed=true;current=undefined;timeMs=0;try{adapter.dispose();}finally{publish();listeners.clear();}}};
}
