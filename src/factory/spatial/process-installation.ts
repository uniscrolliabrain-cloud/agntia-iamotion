import {z} from 'zod';
import {museumExhibitCatalog} from './exhibit-catalog.js';
import {automationSculpture,type AutomationSculptureKind} from './automation-sculpture.js';
const Id=z.string().regex(/^[a-z][a-z0-9-]{0,63}$/);
const Schema=z.strictObject({scope:z.strictObject({tenantId:Id,workspaceId:Id}),revision:z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),nodes:z.array(z.strictObject({id:Id,kind:z.string(),label:z.string().min(1).max(200),sourceRef:Id})).min(1).max(64),edges:z.array(z.strictObject({from:Id,to:Id})).max(256)});
export function compileProcessInstallation(input:unknown,authority:{scope:{tenantId:string;workspaceId:string};sourceRefs:ReadonlySet<string>}){
 const spec=Schema.parse(input);if(spec.scope.tenantId!==authority.scope.tenantId||spec.scope.workspaceId!==authority.scope.workspaceId)throw Error('SCOPE_DENIED');
 const nodes=new Map(spec.nodes.map(n=>[n.id,n]));if(nodes.size!==spec.nodes.length)throw Error('DUPLICATE_NODE');
 const incoming=new Map(spec.nodes.map(n=>[n.id,0])),outgoing=new Map(spec.nodes.map(n=>[n.id,[] as string[]])),seen=new Set<string>();
 for(const n of spec.nodes)if(!authority.sourceRefs.has(n.sourceRef)||!museumExhibitCatalog.nodes.some(k=>k.id===n.kind))throw Error('REFERENCE_DENIED');
 for(const e of spec.edges){const key=e.from+'/'+e.to;if(!nodes.has(e.from)||!nodes.has(e.to)||e.from===e.to||seen.has(key))throw Error('INVALID_EDGE');seen.add(key);incoming.set(e.to,incoming.get(e.to)!+1);outgoing.get(e.from)!.push(e.to);}
 const depth=new Map(spec.nodes.map(n=>[n.id,0])),queue=[...incoming].filter(([,v])=>v===0).map(([id])=>id).sort();let visited=0;
 while(queue.length){const id=queue.shift()!;visited++;for(const to of outgoing.get(id)!.sort()){depth.set(to,Math.max(depth.get(to)!,depth.get(id)!+1));incoming.set(to,incoming.get(to)!-1);if(incoming.get(to)===0){queue.push(to);queue.sort();}}}
 if(visited!==nodes.size)throw Error('CYCLIC_PROCESS_UNSUPPORTED');
 const columns=new Map<number,string[]>();for(const id of [...nodes.keys()].sort()){const d=depth.get(id)!;if(!columns.has(d))columns.set(d,[]);columns.get(d)!.push(id);}
 const stations=[...nodes.values()].sort((a,b)=>a.id.localeCompare(b.id,'en')).map(n=>{const d=depth.get(n.id)!,col=columns.get(d)!;return {...n,x:d*3.6,y:0,z:(col.indexOf(n.id)-(col.length-1)/2)*3.4,recipe:automationSculpture(n.kind as AutomationSculptureKind)};});
 return {scope:spec.scope,revision:spec.revision,stations,edges:spec.edges};
}
export const demoProcessSource={"path":"apps/ui-lab/src/tasks-automations-v1/model.ts","blob":"d27d1dd2c5bc51beeb06943f705a382350c91835"} as const;
export const demoProcess={scope:{tenantId:'agntia-demo',workspaceId:'museum-process'},revision:1,nodes:[{"id":"node-1","kind":"webhook","label":"Nuevo lead ACME","sourceRef":"demo-node-1"},{"id":"node-2","kind":"record","label":"Consultar cliente","sourceRef":"demo-node-2"},{"id":"node-3","kind":"agent","label":"LAIA propone","sourceRef":"demo-node-3"},{"id":"node-4","kind":"condition","label":"Datos suficientes","sourceRef":"demo-node-4"},{"id":"node-5","kind":"sop","label":"Preparar propuesta","sourceRef":"demo-node-5"},{"id":"node-6","kind":"task","label":"Completar datos","sourceRef":"demo-node-6"},{"id":"node-7","kind":"approval","label":"Revisión humana","sourceRef":"demo-node-7"},{"id":"node-8","kind":"message","label":"Enviar propuesta","sourceRef":"demo-node-8"},{"id":"node-9","kind":"result","label":"Guardar evidencia","sourceRef":"demo-node-9"}],edges:[{"from":"node-1","to":"node-2"},{"from":"node-2","to":"node-3"},{"from":"node-3","to":"node-4"},{"from":"node-4","to":"node-5"},{"from":"node-4","to":"node-6"},{"from":"node-5","to":"node-7"},{"from":"node-7","to":"node-8"},{"from":"node-8","to":"node-9"}]} as const;
