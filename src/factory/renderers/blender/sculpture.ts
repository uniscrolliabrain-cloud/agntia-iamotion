import { z } from 'zod';
const scalar=z.number().finite().min(0).max(1);
const positive=z.number().finite().min(.001).max(20);
const coord=z.number().finite().min(-20).max(20);
const vec=z.tuple([coord,coord,coord]);
const id=z.string().regex(/^[a-z][a-z0-9-]{0,63}$/);
const rgb=z.tuple([scalar,scalar,scalar]);
const geometry=z.discriminatedUnion('kind',[
 z.strictObject({kind:z.literal('rounded-box'),size:z.tuple([positive,positive,positive]),bevel:positive}),
 z.strictObject({kind:z.literal('ellipsoid'),radii:z.tuple([positive,positive,positive])}),
 z.strictObject({kind:z.literal('ring'),radius:positive,tube:positive}),
 z.strictObject({kind:z.literal('disc'),radius:positive,height:positive,bevel:positive}),
 z.strictObject({kind:z.literal('tube'),points:z.array(vec).min(2).max(32),radius:positive})
]);
export const SculptureRecipeSchema=z.strictObject({
 version:z.literal(1),id,materials:z.array(z.strictObject({id,color:rgb,roughness:scalar,metallic:scalar,coat:scalar,coatRoughness:scalar,transmission:scalar,ior:z.number().finite().min(1).max(2.5)})).min(1).max(16),
 parts:z.array(z.strictObject({id,material:id,geometry,position:vec,rotation:vec})).min(1).max(64),
 camera:z.strictObject({position:vec,target:vec,scale:positive}),
 lights:z.array(z.strictObject({id,position:vec,target:vec,color:rgb,watts:z.number().finite().min(1).max(2000),size:positive})).min(1).max(4),
 background:rgb
}).superRefine((r,ctx)=>{
 const unique=(values:string[])=>new Set(values).size===values.length;
 if(!unique(r.parts.map(p=>p.id))||!unique(r.materials.map(p=>p.id))||!unique(r.lights.map(p=>p.id)))ctx.addIssue({code:'custom',message:'duplicate id'});
 for(const p of r.parts){
  if(!r.materials.some(m=>m.id===p.material))ctx.addIssue({code:'custom',message:'unknown material'});
  const g=p.geometry;
  if((g.kind==='rounded-box'&&g.bevel>=Math.min(...g.size)/2)||(g.kind==='disc'&&g.bevel>=Math.min(g.radius,g.height/2))||(g.kind==='ring'&&g.tube>=g.radius))ctx.addIssue({code:'custom',message:'invalid geometry radius'});
 }
 for(const c of [r.camera,...r.lights])if(c.position.every((v,i)=>v===c.target[i]))ctx.addIssue({code:'custom',message:'degenerate aim'});
});
export type SculptureRecipe=z.infer<typeof SculptureRecipeSchema>;
export function compileSculpture(input:unknown):SculptureRecipe{return SculptureRecipeSchema.parse(input);}
const material=(id:string,color:[number,number,number],metallic=0)=>({id,color,roughness:.28,metallic,coat:.32,coatRoughness:.24,transmission:0,ior:1.46});
export function ceramicCalendar():SculptureRecipe{
 return compileSculpture({version:1,id:'ceramic-calendar',materials:[material('ivory',[.88,.82,.72]),material('violet',[.24,.14,.64]),material('champagne',[.72,.49,.25],.82)],parts:[
 {id:'body',material:'ivory',geometry:{kind:'rounded-box',size:[2.3,.46,1.9],bevel:.18},position:[0,0,1.1],rotation:[0,0,0]},
 {id:'header',material:'violet',geometry:{kind:'rounded-box',size:[2.1,.12,.42],bevel:.05},position:[0,-.26,1.72],rotation:[0,0,0]},
 ...[-.65,.65].map((x,i)=>({id:'binding-'+i,material:'champagne',geometry:{kind:'ring',radius:.22,tube:.045},position:[x,0,2.02],rotation:[0,Math.PI/2,0]})),
 ...Array.from({length:9},(_,i)=>({id:'day-'+i,material:i===4?'violet':'ivory',geometry:{kind:'rounded-box',size:[.32,.09,.26],bevel:.04},position:[(i%3-1)*.47,-.28,.67+Math.floor(i/3)*.32],rotation:[0,0,0]}))
 ],camera:{position:[3,-7,3.6],target:[0,0,1.15],scale:3.5},lights:[
 {id:'key',position:[-3,-4,5],target:[0,0,1],color:[1,.93,.84],watts:470,size:4},
 {id:'fill',position:[3,-3,3],target:[0,0,1],color:[.87,.9,1],watts:120,size:3},
 {id:'rim',position:[2,3,4],target:[0,0,1],color:[1,.95,.88],watts:350,size:3}],background:[.87,.81,.94]});
}
