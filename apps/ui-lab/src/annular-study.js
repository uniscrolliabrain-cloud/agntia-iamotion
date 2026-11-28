import * as T from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {annularLayout,morphAnnular,buildAnnularMesh} from '../../../src/factory/graphics/annular-mesh.ts';
const canvas=document.querySelector('canvas'),body=document.querySelector('tbody'),center=document.querySelector('.center'),choices=document.querySelector('#choices');
const names=['Automatizado','Con agentes','Manual'],colors=[0x6550dd,0xf5ead6,0xbca8ed],sets=[[78,16,6],[49,35,16]];
let revision=0,selected=0,frame=0,disposed=false;
const layout=()=>annularLayout(names.map((label,i)=>({id:'s'+i,label,value:sets[revision][i]})));
let target=layout(),pose=target;
const buttons=names.map((name,i)=>{const b=document.createElement('button');b.textContent=name;b.onclick=()=>{selected=i;sync();animate(target);};choices.append(b);return b;});
function sync(){center.textContent=target[selected].value+' %';buttons.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===selected)));body.replaceChildren(...target.map(r=>{const tr=document.createElement('tr'),th=document.createElement('th'),td=document.createElement('td');th.scope='row';th.textContent=r.label;td.textContent=r.value+' %';tr.append(th,td);return tr;}));}
let renderer;try{renderer=new T.WebGLRenderer({canvas,alpha:true,antialias:true});}catch{canvas.hidden=true;}
let draw=()=>{},cleanup=()=>{};
if(renderer){
 renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;
 const scene=new T.Scene(),camera=new T.OrthographicCamera(-2.3,2.3,2.3,-2.3,.1,30);camera.position.set(0,8,3.4);camera.lookAt(0,0,0);
 const pmrem=new T.PMREMGenerator(renderer),room=new RoomEnvironment(),env=pmrem.fromScene(room,.04);scene.environment=env.texture;room.dispose();pmrem.dispose();
 const light=new T.DirectionalLight(0xfff3df,2.3);light.position.set(-3,6,4);scene.add(light);scene.add(new T.HemisphereLight(0xffffff,0xbba8dd,1));
 const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=128;const ctx=shadowCanvas.getContext('2d'),gradient=ctx.createRadialGradient(64,64,12,64,64,64);gradient.addColorStop(0,'rgba(50,30,70,.24)');gradient.addColorStop(1,'rgba(50,30,70,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,128,128);
 const shadowTex=new T.CanvasTexture(shadowCanvas),shadow=new T.Mesh(new T.PlaneGeometry(4.5,4.5),new T.MeshBasicMaterial({map:shadowTex,transparent:true,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=-.31;scene.add(shadow);
 const meshes=colors.map(color=>{const mesh=new T.Mesh(new T.BufferGeometry(),new T.MeshPhysicalMaterial({color,roughness:.27,metalness:0,clearcoat:.4,clearcoatRoughness:.22,envMapIntensity:1.2}));scene.add(mesh);return mesh;});
 draw=(segments,lift=1)=>{segments.forEach((s,i)=>{const mesh=meshes[i],gap=Math.min(.018,s.sweep*.12),data=buildAnnularMesh({inner:.84,outer:1.64,depth:.46,bevel:.095,start:s.start+gap/2,sweep:Math.max(0,s.sweep-gap),segments:96});mesh.visible=s.sweep>1e-6;const geo=mesh.geometry;for(const [name,array,size] of [['position',data.positions,3],['normal',data.normals,3],['uv',data.uv,2]]){const old=geo.getAttribute(name);if(old&&old.array.length===array.length){old.array.set(array);old.needsUpdate=true;}else geo.setAttribute(name,new T.BufferAttribute(array,size));}geo.setIndex(new T.BufferAttribute(data.indices,1));geo.computeBoundingSphere();mesh.position.y=i===selected?.10*lift:0;});renderer.render(scene,camera);};
 const resize=()=>{const w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);const half=Math.max(2.05,2.05*h/w);camera.left=-half*w/h;camera.right=half*w/h;camera.top=half;camera.bottom=-half;camera.updateProjectionMatrix();draw(pose);};const observer=new ResizeObserver(resize);observer.observe(canvas);resize();
 cleanup=()=>{observer.disconnect();meshes.forEach(m=>{m.geometry.dispose();m.material.dispose();});shadow.geometry.dispose();shadow.material.dispose();shadowTex.dispose();env.dispose();renderer.dispose();};
}
const media=matchMedia('(prefers-reduced-motion: reduce)');
function animate(next){cancelAnimationFrame(frame);const from=pose.map(s=>({...s,fraction:s.sweep/(2*Math.PI)})),start=performance.now();const tick=now=>{if(disposed)return;const t=media.matches?1:Math.min(1,(now-start)/620);pose=morphAnnular(from,next,t);draw(pose,t);if(t<1)frame=requestAnimationFrame(tick);};tick(start);}
document.querySelector('#change').onclick=()=>{revision=1-revision;target=layout();sync();animate(target);};sync();draw(pose);
window.addEventListener('pagehide',()=>{disposed=true;cancelAnimationFrame(frame);cleanup();},{once:true});
