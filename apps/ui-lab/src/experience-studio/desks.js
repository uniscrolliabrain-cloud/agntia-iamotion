import {el,desk,panel,range,choice,canvas,report} from './components.js';
import {compileExperienceMixer} from '../../../../src/factory/spatial/experience-mixer.ts';
import {ambientCss} from '../../../../src/factory/materials/ambient-field.ts';
import {surfaceCss} from '../../../../src/factory/materials/surface.ts';
import {sampleSpatialChoreography} from '../../../../src/factory/graphics/spatial-choreography.ts';
import {annularLayout,buildAnnularMesh} from '../../../../src/factory/graphics/annular-mesh.ts';
import {OrganicField,constellationTargets,ribbonTargets} from '../../../../src/factory/graphics/particles/organic-field.ts';
import {applyFractalPattern} from '../../../../src/factory/spatial/fractal-patterns.ts';
import {startFractalNavigation,projectFractalNavigation,navigateFractal} from '../../../../src/factory/spatial/fractal-navigation.ts';
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
const policy=()=>({surface:{glass:true,spatial:true,reducedMotion:reduced(),intensity:1},particles:true,maxParticles:512,maxVertices:100000,maxSculptureParts:64});
const ambient={base:[.99,.98,.96],lights:[{id:'violet',color:[.67,.53,.87],x:.25,y:.3,radius:.8,strength:.55,drift:.18,phase:0},{id:'gold',color:[.86,.73,.5],x:.8,y:.7,radius:.65,strength:.35,drift:.12,phase:.5}],periodMs:16000,intensity:1,reducedMotion:false,active:true};
const channels=['motion','depth','glass','particles','illumination','background','camera'];
const labels=['Movimiento','Profundidad','Cristal','Partículas','Iluminación','Fondo','Cámara'];
const base=Object.fromEntries(channels.map(k=>[k,.6]));
const scope={tenantId:'demo',workspaceId:'studio'};
export function mountDesks(root){
 const disposers=[];let time=0,playing=false,last=0,raf=0;const duration=8000;
 const mixerSpec={version:1,durationMs:duration,base,tracks:[]};
 let mixer=compileExperienceMixer(mixerSpec,policy(),ambient);
 const rebuild=()=>{mixer=compileExperienceMixer(mixerSpec,policy(),ambient);draw();};
 const d1=desk('01','Composición','Recursos y capas de la escena experimental');
 const preview=el('div',{class:'preview'},el('div',{class:'orb'}),el('span',{class:'preview-label'},'Materia · luz · movimiento'));
 const layerNames=['Escultura','Partículas','Superficie','Fondo'];const layerList=el('div',{class:'layers'});
 for(const name of layerNames){const check=el('input',{type:'checkbox',checked:''});check.addEventListener('change',()=>{preview.dataset[name.toLowerCase()]=String(check.checked);draw();});layerList.append(el('label',{},check,name));}
 const tracks=el('div',{class:'timeline'});for(const [i,name] of labels.entries()){const bar=el('div',{class:'clip',style:'--offset:'+i*3+'%;--length:'+(90-i*6)+'%'},name);tracks.append(el('div',{class:'track'},el('span',{},name),bar));}
 d1.body.append(panel('Capas visibles',layerList),panel('Composición activa',preview),panel('Mapa de canales · referencia',tracks));
 const d2=desk('02','Coreografía','Cascadas y transiciones de grupos');
 const tiles=el('div',{class:'tiles'},...Array.from({length:6},(_,i)=>el('div',{class:'tile'},'0'+(i+1))));
 let stagger=55,transition=680;
 d2.body.append(panel('Parámetros',range('Duración ms',300,1200,10,transition,v=>{transition=v;draw()}),range('Cascada ms',0,35,1,25,v=>{stagger=v;draw()})),panel('Grupo de superficies',tiles));
 stagger=25;
 const d3=desk('03','Óptica y ambiente','Materiales y fondos mediante el mezclador real');
 const swatch=el('div',{class:'material'},el('strong',{},'Cerámica óptica'),el('span',{},'Superficie experimental'));
 const controls=channels.slice(2,6).map((k,i)=>range(labels[i+2],0,1,.01,base[k],v=>{base[k]=v;rebuild()}));
 d3.body.append(panel('Canales ópticos',...controls),panel('Muestra de material',swatch));
 const d4=desk('04','Escultura y materia','Geometría anular y simulación de partículas');
 const c=canvas(),ctx=c.getContext('2d'),stats=el('p',{class:'readout'});let share=78,assembly=.8;
 const field=new OrganicField({seed:17,count:256,drag:2,speed:.6,spring:8,flow:1,vortex:2,frequency:6});field.setTargets(constellationTargets(256));
 d4.body.append(panel('Geometría',range('Distribución %',0,100,1,share,v=>{share=v;draw()}),stats),panel('Materia procedural',c,range('Ensamblaje',0,1,.01,assembly,v=>{assembly=v;draw()}),choice('Forma',['constelación','cinta'],v=>{field.setTargets(v==='cinta'?ribbonTargets(256):constellationTargets(256));draw()})));
 const d5=desk('05','Espacio fractal','Patrones y navegación semántica');
 const space=canvas(),sc=space.getContext('2d'),crumb=el('p',{class:'readout'}),links=el('div',{class:'layers'});let pattern='orbit',spacing=3,plan,nav;
 const node=(id,parentId)=>({id,parentId,kind:'space',label:id,position:[0,0,0],scale:1,yaw:0,capabilities:['view','navigate']});
 const spec={schemaVersion:1,id:'studio',scope,revision:1,nodes:[node('universo'),...['finanzas','operaciones','conocimiento','equipo','formacion','productos'].map(id=>node(id,'universo')),node('tesoreria','finanzas'),node('ingresos','finanzas')],relations:[]};
 const authority={scope,revision:1,capabilities:new Set(['view','navigate']),recipes:new Map()};
 function layout(){plan=applyFractalPattern(spec,{kind:pattern,parentId:'universo',spacing,phase:0,columns:3},authority).plan;nav=startFractalNavigation(plan);drawSpace();}
 function drawSpace(){const p=projectFractalNavigation(plan,nav);crumb.textContent=p.breadcrumbs.map(n=>n.label).join(' / ');links.replaceChildren(...p.children.map(n=>el('button',{onclick:()=>{nav=navigateFractal(plan,nav,{kind:'enter',id:n.id});drawSpace();}},n.label)),el('button',{onclick:()=>{nav=navigateFractal(plan,nav,{kind:'up'});drawSpace();}},'Subir'));sc.clearRect(0,0,720,320);for(const n of p.children){const [x,y,z]=n.position;sc.beginPath();sc.fillStyle='#9276c9';sc.arc(360+x*18,160+z*12-y*10,18,0,Math.PI*2);sc.fill();sc.fillStyle='#242421';sc.fillText(n.label,360+x*18-20,190+z*12-y*10);}}
 d5.body.append(panel('Patrones',choice('Distribución',['orbit','constellation','gallery','corridor','terrace','helix'],v=>{pattern=v;layout()}),range('Separación',1,5,.1,spacing,v=>{spacing=v;layout()}),crumb,links),panel('Proyección espacial · 2D',space));
 const d6=desk('06','Dirección y mezcla','Automatización de siete canales');
 const clock=el('output',{class:'clock'},'0.00 s'),seek=el('input',{type:'range',min:0,max:duration,value:0,'aria-label':'Tiempo'}),play=el('button',{onclick:()=>{playing=!playing;last=0;play.textContent=playing?'Pausar':'Reproducir';}},'Reproducir');
 seek.addEventListener('input',()=>{time=Number(seek.value);draw()});
 const meters=el('div',{class:'faders'}),meterOutputs=[];
 for(const [i,k] of channels.entries()){const input=el('input',{type:'range',min:0,max:1,step:.01,value:base[k],'aria-label':labels[i]});input.addEventListener('input',()=>{base[k]=Number(input.value);rebuild()});const o=el('output',{},'0.60');meterOutputs.push(o);meters.append(el('label',{},labels[i],input,o));}
 const keyButton=el('button',{onclick:()=>{mixerSpec.tracks=channels.map(k=>({channel:k,keys:[{ms:0,value:0,ease:'smooth'},{ms:duration,value:base[k],ease:'linear'}]}));rebuild();}},'Crear entrada gradual');
 const clear=el('button',{onclick:()=>{mixerSpec.tracks=[];rebuild();}},'Limpiar automatización');
 const exportButton=el('button',{onclick:()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(mixerSpec,null,2)],{type:'application/json'}));const a=el('a',{href:url,download:'experience-mixer.json'});a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}},'Exportar JSON');
 d6.body.append(panel('Transporte',clock,seek,el('div',{class:'actions'},play,el('button',{onclick:()=>{playing=false;play.textContent='Reproducir';time=0;draw()}},'Detener'),exportButton)),panel('Mezclador',meters,el('div',{class:'actions'},keyButton,clear)));
 root.append(...[d1,d2,d3,d4,d5,d6].map(d=>d.root));
 function draw(){const f=mixer.sample(time);clock.value=(time/1000).toFixed(2)+' s';seek.value=String(time);meterOutputs.forEach((o,i)=>o.value=f.effective[channels[i]].toFixed(2));preview.style.background=preview.dataset.fondo==='false'?'#fcfaf6':ambientCss(f.ambient);preview.querySelector('.orb').style.transform='translateY('+(-f.effective.motion*8*Math.sin(time/800))+'px)';preview.querySelector('.orb').hidden=preview.dataset.escultura==='false';swatch.style.background=ambientCss(f.ambient);for(const [k,v] of Object.entries(surfaceCss(f.surface,CSS.supports('backdrop-filter','blur(1px)'))))swatch.style.setProperty(k,v);
 const poses=sampleSpatialChoreography({nodes:Array.from({length:6},(_,i)=>({id:'tile-'+i,group:'demo',order:i,depth:i%3,from:{x:0,y:20,width:100,height:100},to:{x:0,y:0,width:100,height:100},relation:1,visibility:'enter'})),durationMs:transition,staggerMs:stagger,intensity:f.effective.motion,reducedMotion:reduced()},Math.min(time,transition));poses.forEach((p,i)=>{tiles.children[i].style.transform=p.transform;tiles.children[i].style.opacity=p.opacity;});
 const rows=annularLayout([{id:'a',label:'A',value:share},{id:'b',label:'B',value:100-share}]);const vertices=rows.reduce((n,r)=>n+buildAnnularMesh({inner:.6,outer:1,depth:.2,bevel:.04,start:r.start,sweep:r.sweep,segments:48}).positions.length/3,0);stats.textContent=vertices+' vértices · '+share+'% / '+(100-share)+'%';ctx.clearRect(0,0,720,320);for(const [i,r] of rows.entries()){ctx.beginPath();ctx.arc(150,160,75,r.start,r.start+r.sweep);ctx.strokeStyle=['#795bb5','#e3d4b5'][i];ctx.lineWidth=38;ctx.stroke();}const points=field.sample();ctx.fillStyle='#9276c9';for(let i=0;i<Math.min(points.length,f.particleBudget*3);i+=3){ctx.beginPath();ctx.arc(400+points[i]*260,30+points[i+1]*260,2.5,0,Math.PI*2);ctx.fill();}}
 function tick(now){if(playing&&!document.hidden){const dt=last?Math.min(100,now-last):0;time=Math.min(duration,time+dt);if(!reduced()&&dt>0)field.advance(Math.min(12,Math.floor(dt*120/1000)),assembly);draw();if(time===duration){playing=false;play.textContent='Reproducir';}}last=now;raf=requestAnimationFrame(tick);}
 layout();draw();raf=requestAnimationFrame(tick);disposers.push(()=>cancelAnimationFrame(raf));return ()=>disposers.forEach(fn=>fn());
}
