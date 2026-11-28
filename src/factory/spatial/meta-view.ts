import {museumMetaCatalog} from './meta-catalog.js';
import type {SpatialViewSpec} from './topography.js';
export type MuseumUniverse = typeof museumMetaCatalog[number]['universe'];
// Each district is a room; each section is a selectable exhibit. No cross-scope edges.
export function museumMetaView(universe:MuseumUniverse):SpatialViewSpec {
 const catalog=museumMetaCatalog.find(c=>c.universe===universe);
 if(!catalog)throw Error('UNKNOWN_MUSEUM_UNIVERSE');
 const districts=[...new Set<string>(catalog.rows.map(r=>r.district))];
 const rooms=districts.map((label,slot)=>({id:'district-'+slot,label,slot}));
 return {schemaVersion:1,scope:{tenantId:'agntia-demo',workspaceId:'museum-'+universe},revision:1,rooms,
 entities:catalog.rows.map(r=>({id:r.id,roomId:rooms[districts.indexOf(r.district)]!.id,kind:'concept',label:r.label,sourceRef:'demo-'+universe+'-'+r.id})),
 relations:[]};
}
export function museumExhibitArchetype(variant:string){
 switch(variant){
 case 'chart':return 'volumetric-data';
 case 'flow':return 'sculptural-pipeline';
 case 'org':return 'hierarchical-constellation';
 case 'matrix':case 'table':return 'ordered-gallery';
 case 'timeline':case 'journal':return 'temporal-corridor';
 case 'canvas':return 'spatial-canvas';
 case 'editorial':return 'editorial-installation';
 case 'inspection':return 'evidence-station';
 default:return 'exhibit-plinth';
 }
}
