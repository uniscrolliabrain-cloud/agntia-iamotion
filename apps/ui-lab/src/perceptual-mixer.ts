import {compileSpatialChoreography,sampleSpatialChoreography} from '../../../src/factory/graphics/spatial-choreography.js';
const root=document.querySelector<HTMLElement>('#perceptual-mixer');
if(root){
 const input=(id:string)=>root.querySelector<HTMLInputElement>('#mix-'+id)!;
 const focus=root.querySelector<HTMLSelectElement>('#mix-focus')!;
 const cards=Array.from(root.querySelectorAll<HTMLElement>('[data-mix-id]'));
 const media=matchMedia('(prefers-reduced-motion: reduce)');
 let frame=0;
 function spec(){
 const intensity=Number(input('intensity').value)/100;
 return compileSpatialChoreography({durationMs:Number(input('duration').value),staggerMs:Number(input('stagger').value),intensity,focusId:focus.value||undefined,reducedMotion:media.matches||input('reduced').checked,nodes:cards.map((el,i)=>({id:el.dataset.mixId!,group:'kpi',order:i,depth:i,relation:.5,visibility:'retain',from:{x:0,y:12*intensity,width:100,height:100},to:{x:0,y:0,width:100,height:100}}))});
 }
 function draw(ms:number){const s=spec();input('time').max=String(s.durationMs);input('time').value=String(Math.min(ms,s.durationMs));for(const pose of sampleSpatialChoreography(s,ms)){const el=cards.find(c=>c.dataset.mixId===pose.id)!;el.style.transform=pose.transform;el.style.transformOrigin=pose.transformOrigin;el.style.opacity=String(pose.opacity);el.style.zIndex=String(pose.zIndex);} }
 function stop(){cancelAnimationFrame(frame);frame=0;}
 function update(){stop();draw(Number(input('duration').value));}
 for(const id of ['intensity','stagger','duration','reduced'])input(id).oninput=update;
 focus.onchange=update;media.addEventListener('change',update);
 input('time').oninput=()=>{stop();draw(Number(input('time').value));};
 root.querySelector<HTMLButtonElement>('#mix-play')!.onclick=()=>{stop();const s=spec();if(s.reducedMotion){draw(s.durationMs);return;}const start=performance.now();function tick(now:number){const t=Math.min(s.durationMs,now-start);draw(t);if(t<s.durationMs)frame=requestAnimationFrame(tick);else frame=0;}frame=requestAnimationFrame(tick);};
 window.addEventListener('pagehide',stop);
 update();
}
