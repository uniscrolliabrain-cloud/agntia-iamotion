import * as T from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {OrganicField,constellationTargets,ribbonTargets} from '../../../src/factory/graphics/particles/organic-field.ts';
const canvas=document.querySelector('canvas'),status=document.querySelector('#status'),controls=document.querySelector('#controls'),media=matchMedia('(prefers-reduced-motion: reduce)');
const count=matchMedia('(max-width:600px)').matches?384:1024;
const field=new OrganicField({seed:20261128,count,drag:3.8,speed:.65,spring:16,flow:.32,vortex:.7,frequency:7});
const targets=[constellationTargets(count),ribbonTargets(count)];field.setTargets(targets[0]);
let mode=0,paused=false,visible=true,frame=0,last=0,acc=0,disposed=false;
let renderer;try{renderer=new T.WebGLRenderer({canvas,alpha:true,antialias:true});}catch{canvas.hidden=true;status.textContent='Visualización 3D no disponible';}
if(renderer){
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.toneMapping=T.ACESFilmicToneMapping;
 const scene=new T.Scene(),camera=new T.OrthographicCamera(-.65,.65,.65,-.65,.1,10);camera.position.set(.35,.2,3);camera.lookAt(0,0,0);
 const pmrem=new T.PMREMGenerator(renderer),room=new RoomEnvironment(),env=pmrem.fromScene(room,.05);scene.environment=env.texture;room.dispose();pmrem.dispose();
 const light=new T.DirectionalLight(0xfff2df,2);light.position.set(-2,3,4);scene.add(light);
 const geo=new T.SphereGeometry(1,10,8),mat=new T.MeshPhysicalMaterial({roughness:.31,clearcoat:.45,metalness:.12});
 const mesh=new T.InstancedMesh(geo,mat,count);mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);mesh.frustumCulled=false;scene.add(mesh);
 const palette=[0xf5e9d6,0xbba5ed,0x6550dd,0xc5a16b],color=new T.Color(),dummy=new T.Object3D(),buffer=new Float32Array(count*3);
 for(let i=0;i<count;i++)mesh.setColorAt(i,color.setHex(palette[i%13===0?3:i%3]));
 const draw=()=>{if(media.matches&&mode!==2){for(let i=0;i<count;i++)buffer.set(targets[mode][i],i*3);}else field.copyInto(buffer);
 for(let i=0;i<count;i++){dummy.position.set(buffer[i*3]-.5,buffer[i*3+1]-.5,buffer[i*3+2]-.5);const r=i%13===0?.009:.0045+(i%7)*.0006;dummy.scale.setScalar(r);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);}mesh.instanceMatrix.needsUpdate=true;renderer.render(scene,camera);};
 const resize=()=>{const w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);const half=Math.max(.58,.58*h/w);camera.left=-half*w/h;camera.right=half*w/h;camera.top=half;camera.bottom=-half;camera.updateProjectionMatrix();draw();};
 const tick=now=>{frame=0;if(disposed||paused||!visible||media.matches||document.hidden)return;acc+=Math.min(.05,(now-last)/1000);last=now;const steps=Math.min(6,Math.floor(acc*120));if(steps){field.advance(steps,mode===2?0:1);acc-=steps/120;draw();}frame=requestAnimationFrame(tick);};
 const restart=()=>{cancelAnimationFrame(frame);frame=0;last=performance.now();acc=0;draw();if(!paused&&visible&&!media.matches&&!document.hidden)frame=requestAnimationFrame(tick);};
 const buttons=['Constelación','Cinta orgánica','Flujo libre'].map((label,i)=>{const b=document.createElement('button');b.textContent=label;b.onclick=()=>{mode=i;if(i<2)field.setTargets(targets[i]);buttons.forEach((v,j)=>v.setAttribute('aria-pressed',String(i===j)));status.textContent=label;restart();};controls.append(b);return b;});buttons[0].setAttribute('aria-pressed','true');
 const pause=document.createElement('button');pause.textContent='Pausar';pause.onclick=()=>{paused=!paused;pause.textContent=paused?'Reanudar':'Pausar';restart();};controls.append(pause);
 const ro=new ResizeObserver(resize);ro.observe(canvas);const io=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;restart();});io.observe(canvas);
 media.addEventListener('change',restart);document.addEventListener('visibilitychange',restart);resize();restart();
 window.addEventListener('pagehide',()=>{disposed=true;cancelAnimationFrame(frame);ro.disconnect();io.disconnect();media.removeEventListener('change',restart);document.removeEventListener('visibilitychange',restart);geo.dispose();mat.dispose();env.dispose();renderer.dispose();},{once:true});
}
