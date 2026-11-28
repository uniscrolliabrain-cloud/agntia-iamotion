import * as T from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {createLiveSculpture} from './live-sculpture.js';
import {automationSculpture,sampleAutomationExhibit} from '../../../src/factory/spatial/automation-sculpture.ts';
import {museumExhibitCatalog} from '../../../src/factory/spatial/exhibit-catalog.ts';
const canvas=document.querySelector('canvas'),nav=document.querySelector('nav'),status=document.querySelector('#status'),state=document.querySelector('#state');
let renderer;try{renderer=new T.WebGLRenderer({canvas,antialias:true});}catch{status.textContent='WebGL no disponible';}
if(renderer){
 const scene=new T.Scene();scene.background=new T.Color(0xf0ecfc);renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.toneMapping=T.ACESFilmicToneMapping;
 const camera=new T.PerspectiveCamera(35,1,.1,50);camera.position.set(3,2.5,5);const controls=new OrbitControls(camera,canvas);controls.target.set(0,.9,0);controls.update();
 const pmrem=new T.PMREMGenerator(renderer),studio=new RoomEnvironment(),env=pmrem.fromScene(studio,.04);scene.environment=env.texture;studio.dispose();pmrem.dispose();
 const key=new T.DirectionalLight(0xfff2df,2.5);key.position.set(-3,5,4);scene.add(key,new T.HemisphereLight(0xffffff,0xc8b9de,1.2));
 const floor=new T.Mesh(new T.CylinderGeometry(1.25,1.3,.12,64),new T.MeshPhysicalMaterial({color:0xfaf5e9,roughness:.55}));floor.position.y=-.06;scene.add(floor);
 let sculpture,selected,frame=0,disposed=false,visible=true;const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 function draw(){if(disposed||!sculpture)return;const pose=sampleAutomationExhibit(state.value,performance.now()/1000,reduced.matches);sculpture.applyPose(pose);status.textContent=selected.label+' · '+state.options[state.selectedIndex].text;renderer.render(scene,camera);}
 function schedule(){cancelAnimationFrame(frame);draw();if(!disposed&&visible&&!document.hidden&&!reduced.matches&&state.value==='running')frame=requestAnimationFrame(schedule);}
 function choose(node){const next=createLiveSculpture(automationSculpture(node.id));if(sculpture){scene.remove(sculpture.group);sculpture.dispose();}sculpture=next;selected=node;scene.add(next.group);for(const b of nav.children)b.setAttribute('aria-pressed',String(b.dataset.kind===node.id));schedule();}
 for(const node of museumExhibitCatalog.nodes){const b=document.createElement('button');b.textContent=node.label;b.dataset.kind=node.id;b.onclick=()=>choose(node);nav.append(b);}
 const resize=new ResizeObserver(()=>{const w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();draw();});resize.observe(canvas);
 const intersection=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;schedule();});intersection.observe(canvas);
 controls.addEventListener('change',draw);state.addEventListener('change',schedule);reduced.addEventListener('change',schedule);document.addEventListener('visibilitychange',schedule);
 choose(museumExhibitCatalog.nodes[0]);
 window.addEventListener('pagehide',()=>{disposed=true;cancelAnimationFrame(frame);resize.disconnect();intersection.disconnect();controls.dispose();reduced.removeEventListener('change',schedule);document.removeEventListener('visibilitychange',schedule);sculpture?.dispose();floor.geometry.dispose();floor.material.dispose();env.dispose();renderer.dispose();},{once:true});
}
