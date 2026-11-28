import {z} from 'zod';
const Id=z.string().regex(/^[a-z0-9][a-z0-9-]{0,95}$/);
const Scope=z.strictObject({tenantId:Id,workspaceId:Id});
const Room=z.strictObject({id:Id,label:z.string().min(1).max(120),slot:z.number().int().min(0).max(15)});
const Entity=z.strictObject({id:Id,roomId:Id,kind:z.enum(['task','process','metric','document','concept','agent']),label:z.string().min(1).max(200),sourceRef:Id,visualRef:Id.optional(),value:z.number().finite().optional(),unit:z.string().max(24).optional()});
const Relation=z.strictObject({from:Id,to:Id,kind:z.enum(['depends-on','contains','explains','flows-to','relates-to'])});
export const SpatialViewSpecSchema=z.strictObject({schemaVersion:z.literal(1),scope:Scope,revision:z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),rooms:z.array(Room).min(1).max(16),entities:z.array(Entity).max(256),relations:z.array(Relation).max(1024)});
export type SpatialViewSpec=z.infer<typeof SpatialViewSpecSchema>;
export const SpatialAnchorSchema=z.strictObject({entityId:Id,roomId:Id,slot:z.number().int().min(0).max(63)});
export const SpatialLayoutSpecSchema=z.strictObject({schemaVersion:z.literal(1),scope:Scope,revision:z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),rooms:z.array(Room).max(16),anchors:z.array(SpatialAnchorSchema).max(256)});
export type SpatialLayoutSpec=z.infer<typeof SpatialLayoutSpecSchema>;
type Authority={scope:z.infer<typeof Scope>;sourceRefs:ReadonlySet<string>;visualRefs:ReadonlySet<string>};
const sameScope=(a:z.infer<typeof Scope>,b:z.infer<typeof Scope>)=>a.tenantId===b.tenantId&&a.workspaceId===b.workspaceId;
function unique(values:string[],code:string){if(new Set(values).size!==values.length)throw Error(code);}
export function compileSpatialView(input:unknown,authority:Authority,previousInput?:unknown){
 const view=SpatialViewSpecSchema.parse(input);
 if(!sameScope(view.scope,authority.scope))throw Error('SPATIAL_SCOPE_DENIED');
 unique(view.rooms.map(r=>r.id),'DUPLICATE_ROOM');unique(view.rooms.map(r=>String(r.slot)),'DUPLICATE_ROOM_SLOT');unique(view.entities.map(e=>e.id),'DUPLICATE_ENTITY');
 const rooms=new Map(view.rooms.map(r=>[r.id,r])),entities=new Map(view.entities.map(e=>[e.id,e]));
 for(const e of view.entities){if(!rooms.has(e.roomId)||!authority.sourceRefs.has(e.sourceRef)||e.visualRef&&!authority.visualRefs.has(e.visualRef))throw Error('SPATIAL_REFERENCE_DENIED');}
 unique(view.relations.map(r=>JSON.stringify([r.from,r.to,r.kind])),'DUPLICATE_RELATION');
 for(const r of view.relations)if(!entities.has(r.from)||!entities.has(r.to)||r.from===r.to)throw Error('INVALID_SPATIAL_RELATION');
 const previous=previousInput===undefined?undefined:SpatialLayoutSpecSchema.parse(previousInput);
 if(previous&&(!sameScope(previous.scope,view.scope)||previous.revision>=view.revision))throw Error('SPATIAL_REVISION_DENIED');
 const occupied=new Map<string,Set<number>>(view.rooms.map(r=>[r.id,new Set<number>()]));
 const anchors:SpatialLayoutSpec['anchors']=[],assigned=new Set<string>();
 if(previous){
 unique(previous.rooms.map(r=>r.id),'INVALID_PREVIOUS_ROOMS');unique(previous.rooms.map(r=>String(r.slot)),'INVALID_PREVIOUS_ROOM_SLOTS');unique(previous.anchors.map(a=>a.entityId),'INVALID_PREVIOUS_ANCHORS');
 const oldRooms=new Map(previous.rooms.map(r=>[r.id,r]));
 for(const r of view.rooms){const old=oldRooms.get(r.id);if(old&&old.slot!==r.slot)throw Error('EXPLICIT_RELAYOUT_REQUIRED');}
 for(const a of previous.anchors){if(!oldRooms.has(a.roomId))throw Error('INVALID_PREVIOUS_ROOM');const e=entities.get(a.entityId);if(!e||e.roomId!==a.roomId)continue;const slots=occupied.get(a.roomId)!;if(slots.has(a.slot))throw Error('DUPLICATE_ANCHOR_SLOT');slots.add(a.slot);anchors.push(a);assigned.add(a.entityId);}
 }
 for(const e of [...view.entities].sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0)){if(assigned.has(e.id))continue;const slots=occupied.get(e.roomId)!;let slot=0;while(slots.has(slot))slot++;if(slot>=64)throw Error('ROOM_CAPACITY_EXCEEDED');slots.add(slot);anchors.push({entityId:e.id,roomId:e.roomId,slot});}
 anchors.sort((a,b)=>a.entityId<b.entityId?-1:a.entityId>b.entityId?1:0);
 const layout:SpatialLayoutSpec={schemaVersion:1,scope:view.scope,revision:view.revision,rooms:view.rooms,anchors};
 const positions=anchors.map(a=>{const r=rooms.get(a.roomId)!;return {id:a.entityId,roomId:a.roomId,x:(r.slot%4)*24+((a.slot%8)-3.5)*2.4,y:0,z:Math.floor(r.slot/4)*24+(Math.floor(a.slot/8)-3.5)*2.4};});
 const positionMap=new Map(positions.map(p=>[p.id,p]));
 const routes=view.relations.map(r=>({kind:r.kind,from:positionMap.get(r.from)!,to:positionMap.get(r.to)!}));
 return {view,layout,positions,routes};
}
