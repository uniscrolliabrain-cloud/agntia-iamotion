import {compileSculpture,ceramicCalendar,type SculptureRecipe} from '../renderers/blender/sculpture.js';
import {museumExhibitCatalog} from './exhibit-catalog.js';
export type AutomationSculptureKind=typeof museumExhibitCatalog.nodes[number]['id'];
type Part=SculptureRecipe['parts'][number];type V=[number,number,number];
export function automationSculpture(kind:AutomationSculptureKind):SculptureRecipe{
 if(!museumExhibitCatalog.nodes.some(n=>n.id===kind))throw Error('UNKNOWN_AUTOMATION_KIND');
 const studio=ceramicCalendar(),parts:Part[]=[];
 const add=(geometry:Part['geometry'],position:V,material='ivory',rotation:V=[0,0,0])=>parts.push({id:'part-'+parts.length,geometry,position,material,rotation});
 const box=(size:V,p:V,m='ivory',r:V=[0,0,0])=>add({kind:'rounded-box',size,bevel:Math.min(...size)*.22},p,m,r);
 const orb=(radii:V,p:V,m='violet')=>add({kind:'ellipsoid',radii},p,m);
 const ring=(radius:number,tube:number,p:V,m='champagne',r:V=[Math.PI/2,0,0])=>add({kind:'ring',radius,tube},p,m,r);
 const tube=(points:V[],radius=.065,m='champagne')=>add({kind:'tube',points,radius},[0,0,0],m);
 switch(kind){
 case 'webhook':ring(.65,.12,[0,0,1],'violet');orb([.23,.23,.23],[0,0,1]);tube([[-.85,0,.45],[-.85,0,1],[0,0,1]]);break;
 case 'schedule':add({kind:'disc',radius:.78,height:.24,bevel:.07},[0,0,1],'ivory',[Math.PI/2,0,0]);ring(.68,.04,[0,-.15,1]);tube([[0,-.18,1.48],[0,-.18,1],[.33,-.18,.85]],.045,'violet');break;
 case 'event':for(let i=0;i<3;i++)ring(.28+i*.23,.045,[0,0,.9],'violet');orb([.16,.16,.16],[0,0,.9],'champagne');break;
 case 'agent':orb([.54,.54,.54],[0,0,1],'ivory');ring(.79,.045,[0,0,1],'champagne',[.65,.3,0]);for(let i=0;i<3;i++){const a=i*2*Math.PI/3;orb([.12,.12,.12],[.79*Math.cos(a),.79*Math.sin(a),1],'violet');}break;
 case 'sop':for(let i=0;i<3;i++)box([1.3,.75,.22],[0,0,.3+i*.34],i===2?'violet':'ivory');break;
 case 'condition':box([.55,.55,.55],[0,0,.95],'violet',[0,Math.PI/4,0]);tube([[0,0,.95],[.5,0,.95],[.8,0,1.5]]);tube([[0,0,.95],[-.5,0,.95],[-.8,0,.4]]);orb([.14,.14,.14],[.8,0,1.5]);orb([.14,.14,.14],[-.8,0,.4],'ivory');break;
 case 'transform':tube([[-.75,0,.4],[-.35,0,1.4],[.35,0,.4],[.75,0,1.4]],.16,'violet');orb([.2,.2,.2],[-.75,0,.4],'ivory');orb([.2,.2,.2],[.75,0,1.4],'champagne');break;
 case 'http':for(const x of [-.43,.43])box([.65,.7,.8],[x,0,.8],x<0?'ivory':'violet');for(const z of [.65,.95])tube([[-.18,0,z],[.18,0,z]],.08);break;
 case 'record':for(let i=0;i<3;i++)add({kind:'disc',radius:.64,height:.25,bevel:.08},[0,0,.3+i*.31],i===2?'violet':'ivory');break;
 case 'message':box([1.5,.42,1],[0,0,1]);tube([[-.68,-.23,1.37],[0,-.24,.87],[.68,-.23,1.37]],.045,'violet');orb([.13,.07,.13],[0,-.27,.87],'champagne');break;
 case 'task':box([1.1,.35,1.5],[0,0,1]);for(let i=0;i<3;i++){box([.17,.08,.17],[-.32,-.2,1.4-i*.36],'violet');box([.47,.07,.07],[.1,-.2,1.4-i*.36],'champagne');}break;
 case 'approval':box([1.1,.42,1.2],[0,0,.85],'violet');ring(.35,.09,[0,0,1.48]);tube([[-.28,-.25,.85],[-.08,-.25,.65],[.32,-.25,1.08]],.065);break;
 case 'wait':for(const z of [.3,1.5])ring(.56,.09,[0,0,z],'champagne',[0,0,0]);for(const s of [-1,1])tube([[s*.5,0,.3],[0,0,.9],[s*.5,0,1.5]],.11,'ivory');orb([.23,.23,.16],[0,0,.48]);break;
 case 'result':box([1.1,.32,1.4],[0,0,.9]);ring(.33,.07,[0,-.2,.9],'violet');tube([[-.2,-.27,.9],[-.05,-.27,.75],[.24,-.27,1.08]],.045);break;
 }
 return compileSculpture({...studio,id:'automation-'+kind,parts,camera:{...studio.camera,target:[0,0,.9],scale:2.6}});
}
export function sampleAutomationExhibit(state:'idle'|'running'|'waiting'|'complete'|'failed',seconds:number,reduced=false){
 if(!Number.isFinite(seconds)||seconds<0)throw Error('INVALID_EXHIBIT_TIME');
 const phase=seconds%4*Math.PI/2;
 return {lift:reduced?0:state==='running'?.035*(1-Math.cos(phase)):0,accent:state==='failed'?'warning':state==='waiting'?'pending':state==='complete'?'verified':'neutral',highlight:state==='running'?(reduced?.5:.5+.2*Math.sin(phase)):0};
}
