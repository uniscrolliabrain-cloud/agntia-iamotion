import type {SpatialViewSpec} from './topography.js';
export type ExhibitKind=SpatialViewSpec['entities'][number]['kind'];
export type ExhibitPart={shape:'ring'|'orb'|'tile'|'disc'|'link';material:'ivory'|'violet'|'gold'|'lilac';position:[number,number,number];scale:[number,number,number];rotation:[number,number,number]};
const part=(shape:ExhibitPart['shape'],material:ExhibitPart['material'],position:ExhibitPart['position'],scale:ExhibitPart['scale'],rotation:ExhibitPart['rotation']=[0,0,0]):ExhibitPart=>({shape,material,position,scale,rotation});
export function exhibitRecipe(kind:ExhibitKind):ExhibitPart[]{
 switch(kind){
 case 'metric':return [part('ring','violet',[0,.55,0],[.78,.78,.78],[Math.PI/2,0,0]),part('disc','gold',[0,.55,0],[.25,.12,.25])];
 case 'concept':return [part('orb','ivory',[0,.65,0],[.42,.42,.42]),part('ring','violet',[0,.65,0],[.85,.85,.85],[.7,.3,0]),part('ring','gold',[0,.65,0],[.7,.7,.7],[-.7,1,0])];
 case 'process':return [-1,0,1].map((n,i)=>part('orb',i===1?'violet':'ivory',[n*.55,.5+i*.13,0],[.27,.27,.27])).concat([part('link','gold',[0,.63,0],[1.25,.06,.06],[0,0,.23])]);
 case 'document':return [0,1,2].map(i=>part('tile',i===2?'violet':'ivory',[0,.23+i*.18,0],[.65,.08,.48],[0,i*.12,0]));
 case 'task':return [part('tile','ivory',[0,.5,0],[.55,.48,.15]),part('disc','violet',[0,.5,.18],[.24,.07,.24],[Math.PI/2,0,0]),part('orb','gold',[0,.5,.27],[.09,.09,.09])];
 case 'agent':return [part('orb','ivory',[0,.65,0],[.42,.52,.42]),part('ring','violet',[0,.65,0],[.65,.65,.65],[Math.PI/2,0,0])];
 }
}
export function sampleExhibitPose(ms:number,selected:boolean,reduced:boolean,phase=0){
 if(!Number.isFinite(ms)||!Number.isFinite(phase))throw Error('INVALID_EXHIBIT_TIME');
 const a=ms/8000*Math.PI*2+phase;
 return {lift:reduced?0:Math.sin(a)*.035+(selected?.07:0),yaw:reduced?0:Math.sin(a*.5)*.045,emphasis:selected?1:.65};
}
