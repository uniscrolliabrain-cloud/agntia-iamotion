import { surfaceTarget,sampleSurface,surfaceCss } from '../../../src/factory/materials/surface.ts';
export function mountMaterialSurface(root){
 const panel=root.querySelector('[data-material-panel]');
 const button=root.querySelector('button');
 const status=root.querySelector('[data-material-status]');
 const media=matchMedia('(prefers-reduced-motion: reduce)');
 const glass=CSS.supports('backdrop-filter','blur(1px)');
 let stage=0,frame=0,disposed=false;
 const policy=()=>({glass,spatial:true,reducedMotion:media.matches,intensity:1});
 let pose=surfaceTarget(0,policy());
 const paint=()=>{for(const [key,value] of Object.entries(surfaceCss(pose,glass)))panel.style.setProperty(key,value);};
 const move=()=>{cancelAnimationFrame(frame);const from=pose,to=surfaceTarget(stage,policy()),start=performance.now();
 const tick=now=>{if(disposed)return;pose=sampleSurface(from,to,now-start,media.matches?0:320);paint();if(!media.matches&&now-start<320)frame=requestAnimationFrame(tick);};
 tick(start);status.textContent=['Papel editorial','Cristal suave','Cristal profundo','Profundidad espacial'][glass?stage:0]+(glass?'':' · fallback opaco');};
 const click=()=>{stage=(stage+1)%4;move();};
 button.addEventListener('click',click);media.addEventListener('change',move);paint();
 return ()=>{disposed=true;cancelAnimationFrame(frame);button.removeEventListener('click',click);media.removeEventListener('change',move);};
}
