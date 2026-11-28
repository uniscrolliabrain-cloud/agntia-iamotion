import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {museumDemo} from '../../../src/factory/spatial/demo.ts';
import {compileSpatialView} from '../../../src/factory/spatial/topography.ts';
import {spatialBookmark,interpolateSpatialCamera,spatialSemanticLevel} from '../../../src/factory/spatial/navigation.ts';
const view=museumDemo(),world=compileSpatialView(view,{scope:view.scope,sourceRefs:new Set(view.entities.map(e=>e.sourceRef)),visualRefs:new Set()});
const canvas=document.querySelector('canvas'),nav=document.querySelector('nav'),detail=document.querySelector('#detail');
let focus=()=>{},cleanup=()=>{};
function select(kind,id){const entity=view.entities.find(e=>e.id===id),room=view.rooms.find(r=>r.id===id);detail.textContent=entity?entity.label+(entity.value===undefined?'':' · '+new Intl.NumberFormat('es-ES').format(entity.value)+' '+(entity.unit??'')):room?.label??'Vista general';focus(kind==='overview'?{kind}:{kind,id});}
function button(label,kind,id){const b=document.createElement('button');b.textContent=label;b.onclick=()=>select(kind,id);nav.append(b);}
for(const room of view.rooms){button(room.label,'room',room.id);for(const e of view.entities.filter(e=>e.roomId===room.id))button('↳ '+e.label,'entity',e.id);}
document.querySelector('#overview').onclick=()=>select('overview');
let renderer;try{renderer=new T.WebGLRenderer({canvas,antialias:true});}catch{canvas.hidden=true;detail.textContent='Vista 2D disponible mediante el menú.';}
if(renderer){
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.toneMapping=T.ACESFilmicToneMapping;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
 const scene=new T.Scene();scene.background=new T.Color(0xf0ecfc);const camera=new T.PerspectiveCamera(42,1,.1,500),controls=new OrbitControls(camera,canvas);controls.minDistance=4;controls.maxDistance=180;controls.maxPolarAngle=Math.PI*.47;controls.enableDamping=false;
 const pmrem=new T.PMREMGenerator(renderer),studio=new RoomEnvironment(),env=pmrem.fromScene(studio,.04);scene.environment=env.texture;studio.dispose();pmrem.dispose();
 const light=new T.DirectionalLight(0xfff3df,2.8);light.position.set(-20,45,25);scene.add(light,new T.HemisphereLight(0xffffff,0xc2b2e0,1.4));
 const paper=new T.MeshPhysicalMaterial({color:0xfaf5e9,roughness:.55}),violet=new T.MeshPhysicalMaterial({color:0x8c72cf,roughness:.29,clearcoat:.4}),gold=new T.MeshPhysicalMaterial({color:0xb49665,metalness:.65,roughness:.35});
 const meshes=[],pickables=[];
 function mesh(geometry,material,x,y,z){const m=new T.Mesh(geometry,material);m.position.set(x,y,z);scene.add(m);meshes.push(m);return m;}
 for(const r of view.rooms){const m=mesh(new RoundedBoxGeometry(21,.65,21,3,.3),paper,r.slot%4*24,-.35,Math.floor(r.slot/4)*24);m.userData={kind:'room',id:r.id};pickables.push(m);}
 for(const p of world.positions){const e=view.entities.find(e=>e.id===p.id);mesh(new T.CylinderGeometry(.85,1,.24,48),paper,p.x,.12,p.z);const geometry=e.kind==='metric'?new T.TorusGeometry(.57,.23,24,64):e.kind==='concept'?new T.IcosahedronGeometry(.72,2):new RoundedBoxGeometry(1.2,1.1,.85,4,.2);const m=mesh(geometry,e.kind==='metric'?gold:violet,p.x,.95,p.z);m.userData={kind:'entity',id:p.id};pickables.push(m);}
 const lines=[];for(const r of world.routes){const a=new T.Vector3(r.from.x,.3,r.from.z),b=new T.Vector3(r.to.x,.3,r.to.z),mid=a.clone().lerp(b,.5);mid.y=1.8;const g=new T.BufferGeometry().setFromPoints(new T.QuadraticBezierCurve3(a,mid,b).getPoints(32));const line=new T.Line(g,new T.LineBasicMaterial({color:0xb49665,transparent:true,opacity:.45}));scene.add(line);lines.push(line);}
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');let animation=0,disposed=false;
 function pose(){const d=camera.position.clone().sub(controls.target);return {target:controls.target.toArray(),distance:d.length(),yaw:Math.atan2(d.x,d.z),pitch:Math.asin(d.y/d.length())};}
 function apply(p){controls.target.fromArray(p.target);camera.position.set(p.target[0]+p.distance*Math.cos(p.pitch)*Math.sin(p.yaw),p.target[1]+p.distance*Math.sin(p.pitch),p.target[2]+p.distance*Math.cos(p.pitch)*Math.cos(p.yaw));controls.update();}
 function draw(){if(disposed)return;const level=spatialSemanticLevel(camera.position.distanceTo(controls.target));lines.forEach(l=>l.visible=level!=='entity');renderer.render(scene,camera);}
 controls.addEventListener('change',draw);controls.addEventListener('start',()=>cancelAnimationFrame(animation));
 apply(spatialBookmark(world,{kind:'overview'}));
 focus=f=>{cancelAnimationFrame(animation);const a=pose(),b=spatialBookmark(world,f),start=performance.now();function tick(now){if(disposed)return;const t=reduced.matches?1:Math.min(1,(now-start)/700);apply(interpolateSpatialCamera(a,b,t,reduced.matches));draw();if(t<1)animation=requestAnimationFrame(tick);}tick(start);};
 const ray=new T.Raycaster();let down;canvas.addEventListener('pointerdown',e=>{down=[e.clientX,e.clientY];});canvas.addEventListener('pointerup',e=>{if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>5)return;const r=canvas.getBoundingClientRect();ray.setFromCamera(new T.Vector2((e.clientX-r.left)/r.width*2-1,1-(e.clientY-r.top)/r.height*2),camera);const hit=ray.intersectObjects(pickables,false)[0];if(hit)select(hit.object.userData.kind,hit.object.userData.id);});
 const observer=new ResizeObserver(()=>{const w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();draw();});observer.observe(canvas);
 cleanup=()=>{disposed=true;cancelAnimationFrame(animation);observer.disconnect();controls.dispose();meshes.forEach(m=>m.geometry.dispose());lines.forEach(l=>{l.geometry.dispose();l.material.dispose();});[paper,violet,gold].forEach(m=>m.dispose());env.dispose();renderer.dispose();};
}
window.addEventListener('pagehide',()=>cleanup(),{once:true});
