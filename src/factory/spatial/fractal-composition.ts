import {z} from 'zod';
const Id=z.string().regex(/^[a-z0-9][a-z0-9-]{0,95}$/);
const Capability=z.enum(['view','navigate','animate','inspect','experiment']);
const Vec=z.tuple([z.number().finite().min(-10000).max(10000),z.number().finite().min(-10000).max(10000),z.number().finite().min(-10000).max(10000)]);
const Node=z.strictObject({id:Id,parentId:Id.optional(),kind:z.enum(['universe','space','installation','object','component']),label:z.string().min(1).max(160),position:Vec,scale:z.number().finite().min(.001).max(100),yaw:z.number().finite().min(-Math.PI).max(Math.PI),recipeRef:Id.optional(),capabilities:z.array(Capability).max(5)});
const Scope=z.strictObject({tenantId:Id,workspaceId:Id});
export const FractalCompositionSchema=z.strictObject({schemaVersion:z.literal(1),id:Id,scope:Scope,revision:z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),nodes:z.array(Node).min(1).max(512),relations:z.array(z.strictObject({from:Id,to:Id,kind:z.enum(['relates-to','explains','flows-to'])})).max(2048)});
type Cap=z.infer<typeof Capability>;
type Authority={scope:z.infer<typeof Scope>;revision:number;capabilities:ReadonlySet<Cap>;recipes:ReadonlyMap<string,z.infer<typeof Node>['kind']>};
type CompiledNode=z.infer<typeof Node>&{depth:number;path:string[];worldPosition:[number,number,number];worldScale:number;worldYaw:number;effectiveCapabilities:Cap[]};
export function compileFractalComposition(input:unknown,authority:Authority){
 const spec=FractalCompositionSchema.parse(input);
 if(spec.scope.tenantId!==authority.scope.tenantId||spec.scope.workspaceId!==authority.scope.workspaceId||spec.revision!==authority.revision)throw Error('FRACTAL_SCOPE_DENIED');
 const nodes=new Map(spec.nodes.map(n=>[n.id,n]));
 if(nodes.size!==spec.nodes.length||spec.nodes.filter(n=>!n.parentId).length!==1)throw Error('INVALID_FRACTAL_ROOT');
 const compiled=new Map<string,CompiledNode>();
 function visit(id:string,stack:string[]):CompiledNode{
 if(stack.includes(id)||stack.length>12)throw Error('FRACTAL_DEPTH_OR_CYCLE');
 const cached=compiled.get(id);if(cached){if(stack.length+cached.depth>24)throw Error('FRACTAL_DEPTH');return cached;}
 const n=nodes.get(id);if(!n)throw Error('UNKNOWN_FRACTAL_PARENT');
 if(n.recipeRef&&authority.recipes.get(n.recipeRef)!==n.kind)throw Error('FRACTAL_RECIPE_DENIED');
 const p=n.parentId?visit(n.parentId,[...stack,id]):undefined;
 const depth=p?p.depth+1:0;if(depth>12)throw Error('FRACTAL_DEPTH');
 const allowed=p?new Set(p.effectiveCapabilities):authority.capabilities;
 const effectiveCapabilities=[...new Set(n.capabilities)].filter(c=>allowed.has(c));
 const s=p?.worldScale??1,yaw=p?.worldYaw??0,c=Math.cos(yaw),sin=Math.sin(yaw),[x,y,z]=n.position,o=p?.worldPosition??[0,0,0];
 const worldPosition:[number,number,number]=[o[0]+s*(x*c+z*sin),o[1]+s*y,o[2]+s*(-x*sin+z*c)];
 const worldScale=s*n.scale,worldYaw=yaw+n.yaw;
 if(worldScale<1e-6||worldScale>1e6||worldPosition.some(v=>!Number.isFinite(v)||Math.abs(v)>1e7))throw Error('FRACTAL_TRANSFORM_BUDGET');
 const result:CompiledNode={...n,depth,path:[...(p?.path??[]),id],worldPosition,worldScale,worldYaw,effectiveCapabilities};
 compiled.set(id,result);return result;
 }
 for(const id of [...nodes.keys()].sort())visit(id,[]);
 const seen=new Set<string>();
 for(const r of spec.relations){const key=JSON.stringify([r.from,r.to,r.kind]);if(!nodes.has(r.from)||!nodes.has(r.to)||r.from===r.to||seen.has(key))throw Error('INVALID_FRACTAL_RELATION');seen.add(key);}
 return {id:spec.id,scope:spec.scope,revision:spec.revision,nodes:[...compiled.values()].sort((a,b)=>a.depth-b.depth||(a.id<b.id?-1:a.id>b.id?1:0)),relations:spec.relations};
}
