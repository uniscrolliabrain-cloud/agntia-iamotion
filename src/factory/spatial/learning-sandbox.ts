import {z} from 'zod';
const Id=z.string().regex(/^[a-z0-9][a-z0-9-]{0,95}$/);
const Num=z.number().finite().min(-1e12).max(1e12);
const Scope=z.strictObject({tenantId:Id,workspaceId:Id});
const Variable=z.strictObject({id:Id,label:z.string().min(1).max(120),unit:z.string().max(24),min:Num,max:Num,initial:Num});
const Operand=z.discriminatedUnion('kind',[z.strictObject({kind:z.literal('constant'),value:Num}),z.strictObject({kind:z.literal('reference'),id:Id})]);
const Rule=z.strictObject({id:Id,label:z.string().min(1).max(120),unit:z.string().max(24),op:z.enum(['add','subtract','multiply','divide','min','max']),left:Operand,right:Operand});
export const LearningSandboxSchema=z.strictObject({schemaVersion:z.literal(1),id:Id,scope:Scope,revision:z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),synthetic:z.literal(true),variables:z.array(Variable).min(1).max(32),rules:z.array(Rule).max(128)});
export type LearningSandboxSpec=z.infer<typeof LearningSandboxSchema>;
type Authority={scope:z.infer<typeof Scope>;revision:number;exerciseRefs:ReadonlySet<string>};
export function compileLearningSandbox(input:unknown,authority:Authority){
 const spec=LearningSandboxSchema.parse(input);
 if(spec.scope.tenantId!==authority.scope.tenantId||spec.scope.workspaceId!==authority.scope.workspaceId||spec.revision!==authority.revision||!authority.exerciseRefs.has(spec.id))throw Error('SANDBOX_DENIED');
 const known=new Set<string>();
 for(const v of spec.variables){if(known.has(v.id)||v.min>v.max||v.initial<v.min||v.initial>v.max)throw Error('INVALID_SANDBOX_VARIABLE');known.add(v.id);}
 for(const r of spec.rules){if(known.has(r.id))throw Error('DUPLICATE_SANDBOX_ID');for(const o of [r.left,r.right])if(o.kind==='reference'&&!known.has(o.id))throw Error('INVALID_SANDBOX_DEPENDENCY');known.add(r.id);}
 function evaluate(overrides:unknown={}){
 const values=new Map<string,number>();
 const patch=z.record(Id,Num).parse(overrides);
 const variables=new Map(spec.variables.map(v=>[v.id,v]));
 for(const [id,value] of Object.entries(patch)){const v=variables.get(id);if(!v||value<v.min||value>v.max)throw Error('SANDBOX_INPUT_DENIED');}
 for(const v of spec.variables)values.set(v.id,Object.hasOwn(patch,v.id)?patch[v.id]!:v.initial);
 const read=(o:z.infer<typeof Operand>)=>o.kind==='constant'?o.value:values.get(o.id)!;
 for(const r of spec.rules){const a=read(r.left),b=read(r.right);let n:number;
 switch(r.op){case 'add':n=a+b;break;case 'subtract':n=a-b;break;case 'multiply':n=a*b;break;case 'divide':if(b===0)throw Error('SANDBOX_DIVISION_BY_ZERO');n=a/b;break;case 'min':n=Math.min(a,b);break;case 'max':n=Math.max(a,b);break;}
 values.set(r.id,Num.parse(n));}
 return {exerciseId:spec.id,revision:spec.revision,synthetic:true as const,values:Object.fromEntries(values)};
 }
 const initial=evaluate();
 return {evaluate,reset:()=>evaluate(),initial};
}
const ref=(id:string)=>({kind:'reference' as const,id});
const constant=(value:number)=>({kind:'constant' as const,value});
export const cashFlowExercise:LearningSandboxSpec={schemaVersion:1,id:'cash-flow-lab',scope:{tenantId:'agntia-demo',workspaceId:'museum'},revision:1,synthetic:true,variables:[
{id:'opening',label:'Saldo inicial',unit:'EUR',min:0,max:1000000,initial:10000},
{id:'sales',label:'Ventas del periodo',unit:'EUR',min:0,max:1000000,initial:20000},
{id:'collection-rate',label:'Fracción cobrada en el periodo',unit:'ratio',min:0,max:1,initial:.75},
{id:'expenses',label:'Pagos del periodo',unit:'EUR',min:0,max:1000000,initial:18000}
],rules:[
{id:'collected',label:'Cobros',unit:'EUR',op:'multiply',left:ref('sales'),right:ref('collection-rate')},
{id:'receivables',label:'Ventas pendientes de cobro',unit:'EUR',op:'subtract',left:ref('sales'),right:ref('collected')},
{id:'net-flow',label:'Flujo neto',unit:'EUR',op:'subtract',left:ref('collected'),right:ref('expenses')},
{id:'closing',label:'Saldo final',unit:'EUR',op:'add',left:ref('opening'),right:ref('net-flow')},
{id:'shortfall',label:'Déficit de caja',unit:'EUR',op:'min',left:ref('closing'),right:constant(0)}
]};
