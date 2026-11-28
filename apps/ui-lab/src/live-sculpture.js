import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {compileSculpture} from '../../../src/factory/renderers/blender/sculpture.ts';
// Build in recipe Z-up coordinates, then rotate the entire assembly into Y-up.
export function createLiveSculpture(input,{quality='standard'}={}){
 const recipe=compileSculpture(input),group=new T.Group(),root=new T.Group(),materials=new Map(),geometries=[],parts=new Map();
 if(!['standard','high'].includes(quality))throw Error('UNKNOWN_QUALITY');
 const high=quality==='high',segments=high?64:32;
 root.rotation.x=-Math.PI/2;group.add(root);
 function dispose(){for(const g of geometries)g.dispose();for(const m of materials.values())m.dispose();group.clear();}
 try{
 for(const m of recipe.materials)materials.set(m.id,new T.MeshPhysicalMaterial({color:new T.Color().setRGB(...m.color,T.LinearSRGBColorSpace),roughness:m.roughness,metalness:m.metallic,clearcoat:m.coat,clearcoatRoughness:m.coatRoughness,transmission:m.transmission,ior:m.ior}));
 for(const p of recipe.parts){
 const g=p.geometry;let geo;
 switch(g.kind){
 case 'rounded-box':geo=new RoundedBoxGeometry(...g.size,high?6:3,g.bevel);break;
 case 'ellipsoid':geo=new T.SphereGeometry(1,segments,segments/2);geo.scale(...g.radii);break;
 case 'ring':geo=new T.TorusGeometry(g.radius,g.tube,high?24:12,segments);break;
 case 'disc':{
 const profile=[],r=g.radius,h=g.height/2,b=g.bevel,n=high?8:4;
 profile.push(new T.Vector2(0,-h));
 for(let i=0;i<=n;i++){const a=-Math.PI/2+i*Math.PI/2/n;profile.push(new T.Vector2(r-b+b*Math.cos(a),-h+b+b*Math.sin(a)));}
 for(let i=0;i<=n;i++){const a=i*Math.PI/2/n;profile.push(new T.Vector2(r-b+b*Math.cos(a),h-b+b*Math.sin(a)));}
 profile.push(new T.Vector2(0,h));geo=new T.LatheGeometry(profile,segments);geo.rotateX(Math.PI/2);break;
 }
 case 'tube':{
 const points=g.points.map(p=>new T.Vector3(...p));
 if(points.some((p,i)=>i>0&&p.distanceToSquared(points[i-1])<1e-12))throw Error('DEGENERATE_TUBE');
 const curve=points.length===2?new T.LineCurve3(...points):new T.CatmullRomCurve3(points);
 geo=new T.TubeGeometry(curve,Math.min(192,Math.max(16,points.length*12)),g.radius,high?16:10,false);break;
 }
 default:throw Error('UNKNOWN_GEOMETRY');
 }
 geometries.push(geo);const mesh=new T.Mesh(geo,materials.get(p.material));mesh.position.fromArray(p.position);mesh.rotation.set(...p.rotation,'ZYX');mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);parts.set(p.id,mesh);
 }
 }catch(error){dispose();throw error;}
 let dead=false;return {group,parts,applyPose(pose){if(dead)throw Error('SCULPTURE_DISPOSED');if(!Number.isFinite(pose.lift)||Math.abs(pose.lift)>1)throw Error('INVALID_LIFT');group.position.y=pose.lift;},dispose(){if(!dead){dead=true;dispose();}}};
}
