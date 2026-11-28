import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {exhibitRecipe,sampleExhibitPose} from '../../../src/factory/spatial/exhibits.ts';
import {buildAnnularMesh} from '../../../src/factory/graphics/annular-mesh.ts';
export function createExhibitStudio(){
 const materials=Object.fromEntries(Object.entries({ivory:0xf9f2e4,violet:0x6550dd,lilac:0xc6b4ec,gold:0xb49665}).map(([key,color])=>[key,new T.MeshPhysicalMaterial({color,roughness:key==='gold'?.32:.29,metalness:key==='gold'?.72:0,clearcoat:.35,clearcoatRoughness:.25})]));
 const ringData=buildAnnularMesh({inner:.64,outer:1,depth:.23,bevel:.075,start:0,sweep:2*Math.PI,segments:96});
 const ring=new T.BufferGeometry();ring.setAttribute('position',new T.BufferAttribute(ringData.positions,3));ring.setAttribute('normal',new T.BufferAttribute(ringData.normals,3));ring.setAttribute('uv',new T.BufferAttribute(ringData.uv,2));ring.setIndex(new T.BufferAttribute(ringData.indices,1));
 const geometries={ring,orb:new T.SphereGeometry(1,32,24),tile:new RoundedBoxGeometry(2,2,2,4,.18),disc:new T.CylinderGeometry(1,1,2,48),link:new RoundedBoxGeometry(2,2,2,3,.15)};
 const exhibits=[];
 function create(entity,position){const group=new T.Group();group.position.set(position.x,.24,position.z);const moving=new T.Group();group.add(moving);for(const p of exhibitRecipe(entity.kind)){const m=new T.Mesh(geometries[p.shape],materials[p.material]);m.position.fromArray(p.position);m.scale.fromArray(p.scale);m.rotation.fromArray([...p.rotation,'XYZ']);m.userData={kind:'entity',id:entity.id};moving.add(m);}exhibits.push({id:entity.id,group,moving});return {group,pickables:moving.children};}
 function sample(ms,selected,reduced,camera){for(const [i,e] of exhibits.entries()){const visible=e.group.position.distanceTo(camera.position)<65;e.moving.visible=true;const p=sampleExhibitPose(ms,e.id===selected,reduced||!visible,i*.7);e.moving.position.y=p.lift;e.moving.rotation.y=p.yaw;}}
 return {create,sample,dispose(){for(const g of Object.values(geometries))g.dispose();for(const m of Object.values(materials))m.dispose();exhibits.length=0;}};
}
