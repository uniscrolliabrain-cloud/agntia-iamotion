import {z} from 'zod';
const Id=z.string().regex(/^[a-z][a-z0-9.-]{0,95}$/);
const Ref=z.string().min(1).max(300);
export const CapabilitySchema=z.strictObject({
 id:Id, title:z.string().min(1).max(120), description:z.string().min(1).max(2000),
 revision:z.number().int().positive(), source:Ref, symbol:Ref,
 maturity:z.enum(['designed','implemented','tested','certified']),
 environments:z.array(z.enum(['browser','node','blender'])).min(1),
 requires:z.array(Id), sop:Ref.optional(), boilerplate:Ref.optional(), evidence:z.array(Ref),
 uxConstraints:z.array(z.string().min(1)), 
});
// `Capability` in contracts.ts means an authorised host operation; this one describes a
// declared engine capability. Two different concepts must not share a barrel name.
export type EngineCapability=z.infer<typeof CapabilitySchema>;
/** @deprecated Use EngineCapability; kept for module-level consumers. */
export type Capability=EngineCapability;
export const HostManifestSchema=z.strictObject({
 packageVersion:z.string().min(1), enabled:z.array(z.strictObject({id:Id,revision:z.number().int().positive()}))
});
export function compileLivingSkill(input:unknown,packageVersion:string,hostInput?:unknown){
 const entries=z.array(CapabilitySchema).max(1000).parse(input).sort((a,b)=>a.id.localeCompare(b.id));
 const index=new Map(entries.map(e=>[e.id,e]));
 if(index.size!==entries.length)throw Error('DUPLICATE_CAPABILITY');
 const visiting=new Set<string>(),done=new Set<string>();
 function visit(id:string){if(visiting.has(id))throw Error('CAPABILITY_CYCLE');if(done.has(id))return;
 const e=index.get(id);if(!e)throw Error('MISSING_CAPABILITY');visiting.add(id);
 for(const dep of e.requires)visit(dep);visiting.delete(id);done.add(id);}
 for(const e of entries){visit(e.id);if(e.maturity==='certified'&&(!e.sop||!e.boilerplate||!e.evidence.length))throw Error('INCOMPLETE_CERTIFICATION');}
 const host=hostInput===undefined?undefined:HostManifestSchema.parse(hostInput);
 if(host&&host.packageVersion!==packageVersion)throw Error('HOST_VERSION_MISMATCH');
 const enabled=new Map(host?.enabled.map(e=>[e.id,e.revision])??[]);
 if(host&&enabled.size!==host.enabled.length)throw Error('DUPLICATE_HOST_CAPABILITY');
 for(const [id,rev] of enabled){const e=index.get(id);if(!e||e.revision!==rev||e.maturity!=='certified')throw Error('HOST_CAPABILITY_UNAVAILABLE');}
 function active(id:string):boolean{const e=index.get(id)!;return enabled.get(id)===e.revision&&e.maturity==='certified'&&e.requires.every(active);}
 const capabilities=entries.map(e=>({...e,active:active(e.id)}));
 const manual=['# IAMotion Living Skill — '+packageVersion,'Generated from capability records. Active means certified and enabled by the supplied host manifest.',...capabilities.map(e=>['## '+e.title+' ('+e.id+')',e.description,'Status: '+e.maturity+'; active: '+e.active,'Source: '+e.source+' :: '+e.symbol,'SOP: '+(e.sop??'pending'),'Boilerplate: '+(e.boilerplate??'pending'),'UX: '+e.uxConstraints.join('; ')].join('\n'))].join('\n\n')+'\n';
 return {schemaVersion:1 as const,packageVersion,capabilities,manual};
}
