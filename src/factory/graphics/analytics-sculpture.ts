import { z } from 'zod';
import { prepareBarChart, type GraphicsDatasetReader } from './data.js';
import { compileSculpture, ceramicCalendar, type SculptureRecipe } from '../renderers/blender/sculpture.js';
const Request=z.strictObject({scope:z.string().min(1),id:z.string().min(1),revision:z.number().int().positive()});
export const AnalyticsLayout=z.strictObject({width:z.number().finite().min(2).max(12),height:z.number().finite().min(1).max(5),gap:z.number().finite().min(.08).max(.4)});
export type AnalyticsMark={id:string,label:string,value:number,proportion:number,x:number,width:number,height:number};
export async function prepareRevenueSculpture(input:unknown,scopes:ReadonlySet<string>,reader:GraphicsDatasetReader,domain:unknown,layoutInput:unknown){
 const request=Request.parse(input),layout=AnalyticsLayout.parse(layoutInput);
 const data=await prepareBarChart(request,scopes,reader,domain);
 if(!data.ok)return data;
 if(data.table.length>12)return {ok:false,code:'SCULPTURE_TOO_MANY_MARKS'} as const;
 const width=(layout.width-layout.gap*(data.table.length-1))/data.table.length;
 if(width<.12)return {ok:false,code:'SCULPTURE_LAYOUT_TOO_NARROW'} as const;
 const marks:AnalyticsMark[]=data.table.map((row,i)=>({...row,proportion:data.marks[i].proportion,x:-layout.width/2+width/2+i*(width+layout.gap),width,height:layout.height*data.marks[i].proportion}));
 return {...data,scope:request.scope,datasetId:request.id,marks,layout};
}
export type RevenueSculpture=Extract<Awaited<ReturnType<typeof prepareRevenueSculpture>>,{ok:true}>;
export function revenueRecipe(data:RevenueSculpture):SculptureRecipe{
 const studio=ceramicCalendar();
 const parts=data.marks.flatMap((m,i)=>m.height<.001?[]:[{id:'mark-'+i,material:'violet',geometry:{kind:'rounded-box',size:[m.width,.38,m.height],bevel:Math.min(.095,m.width*.23,m.height*.23,.08)},position:[m.x,0,m.height/2],rotation:[0,0,0]}]);
 // A zero dataset retains a non-data plinth; never fabricate positive bars.
 return compileSculpture({...studio,id:'revenue-sculpture',parts:[{id:'plinth',material:'ivory',geometry:{kind:'rounded-box',size:[data.layout.width+.3,.9,.16],bevel:.065},position:[0,0,-.08],rotation:[0,0,0]},...parts],camera:{position:[0,-10,data.layout.height*.5],target:[0,0,data.layout.height*.5],scale:Math.max(data.layout.width+1,data.layout.height+1)}});
}
export function sampleRevenueTransition(previous:RevenueSculpture,next:RevenueSculpture,progress:number,reducedMotion=false):AnalyticsMark[]{
 if(previous.scope!==next.scope||previous.datasetId!==next.datasetId||previous.unit!==next.unit||next.revision<=previous.revision)throw new Error('INCOMPATIBLE_DATA_TRANSITION');
 if(!Number.isFinite(progress))throw new Error('INVALID_PROGRESS');
 const t=reducedMotion?1:Math.max(0,Math.min(1,progress));const eased=t*t*(3-2*t);
 const old=new Map(previous.marks.map(m=>[m.id,m]));
 // Interpolated geometry is decorative; labels and values are always authoritative next snapshot.
 return next.marks.map(m=>{const a=old.get(m.id);return {...m,height:(a?.height??0)+(m.height-(a?.height??0))*eased,x:(a?.x??m.x)+(m.x-(a?.x??m.x))*eased,width:(a?.width??m.width)+(m.width-(a?.width??m.width))*eased};});
}
