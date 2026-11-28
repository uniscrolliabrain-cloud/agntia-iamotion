import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {prepareRevenueSculpture,sampleRevenueTransition} from '../../../src/factory/graphics/analytics-sculpture.ts';
const canvas=document.querySelector('canvas'),button=document.querySelector('button'),body=document.querySelector('tbody'),status=document.querySelector('#status');
const labels=['Ene','Feb','Mar','Abr','May','Jun'];
const samples=[[18000,24000,29000,31000,42000,52450],[22000,27000,31000,39000,45000,58000]];
let revision=1;
const load=async()=>{const result=await prepareRevenueSculpture({scope:'demo',id:'revenue',revision},new Set(['demo']),{read:async()=>({schemaVersion:1,scope:'demo',id:'revenue',revision,source:'fixture',synthetic:true,unit:'EUR',rows:labels.map((label,i)=>({id:'m'+i,label,value:samples[(revision-1)%2][i]}))})},{min:0,max:60000},{width:5,height:3,gap:.18});if(!result.ok)throw Error(result.code);return result;};
let current=await load();
const showTable=()=>{body.replaceChildren(...current.table.map(row=>{const tr=document.createElement('tr'),th=document.createElement('th'),td=document.createElement('td');th.scope='row';th.textContent=row.label;td.textContent=new Intl.NumberFormat('es-ES').format(row.value);tr.append(th,td);return tr;}));status.textContent='Revisión '+current.revision+' · Datos sintéticos';};showTable();
let renderer;try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});}catch{canvas.hidden=true;}
if(renderer){
 renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.toneMapping=THREE.ACESFilmicToneMapping;
 const scene=new THREE.Scene();const camera=new THREE.OrthographicCamera(-3.5,3.5,2,-2,.1,100);camera.position.set(0,1.4,10);camera.lookAt(0,1.4,0);
 scene.add(new THREE.HemisphereLight(0xfff5e8,0xb6a6cf,2.1));
 for(const [x,y,z,power] of [[-3,5,5,3],[4,2,3,1.5],[2,4,-3,2]]){const light=new THREE.DirectionalLight(0xfff3e6,power);light.position.set(x,y,z);scene.add(light);}
 const material=new THREE.MeshPhysicalMaterial({color:0x6550dd,roughness:.32,metalness:0,clearcoat:.35,clearcoatRoughness:.25});
 const meshes=new Map();
 const plinth=new THREE.Mesh(new RoundedBoxGeometry(5.3,.16,.9,4,.06),new THREE.MeshPhysicalMaterial({color:0xf8f0e2,roughness:.45}));plinth.position.y=-.08;scene.add(plinth);
 const draw=marks=>{for(const m of marks){let mesh=meshes.get(m.id);if(!mesh){mesh=new THREE.Mesh(new RoundedBoxGeometry(1,1,1,4,.12),material);meshes.set(m.id,mesh);scene.add(mesh);}mesh.visible=m.height>0;mesh.scale.set(m.width,Math.max(.001,m.height),.38);mesh.position.set(m.x,m.height/2,0);}renderer.render(scene,camera);};
 let frame=0,pose=current.marks;const media=matchMedia('(prefers-reduced-motion: reduce)');
 const resize=()=>{const w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);const half=Math.max(2.1,3.3*h/w);camera.left=-half*w/h;camera.right=half*w/h;camera.top=half;camera.bottom=-half;camera.updateProjectionMatrix();draw(pose);};
 const observer=new ResizeObserver(resize);observer.observe(canvas);resize();
 button.onclick=async()=>{button.disabled=true;try{const previous=current;revision++;current=await load();showTable();const start=performance.now();const tick=now=>{const t=media.matches?1:Math.min(1,(now-start)/480);pose=sampleRevenueTransition(previous,current,t,media.matches);draw(pose);if(t<1)frame=requestAnimationFrame(tick);else button.disabled=false;};tick(start);}catch{button.disabled=false;status.textContent='No se pudo actualizar la muestra';}};
 window.addEventListener('pagehide',()=>{cancelAnimationFrame(frame);observer.disconnect();scene.traverse(o=>{if(o.isMesh){o.geometry.dispose();o.material.dispose();}});renderer.dispose();},{once:true});
}else{button.onclick=async()=>{revision++;current=await load();showTable();};}
