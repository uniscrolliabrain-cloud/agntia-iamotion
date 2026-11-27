import type { Capability } from '../contracts.js';
export interface HostContext { tenantId:string; actorId:string; correlationId:string }
export interface HostAuthority { authorize(context:HostContext, capability:Capability):Promise<boolean> }
export const integrationStatus = Object.freeze({installed:false,connected:false,productionEnabled:false,providerConfigured:false,renderEnabled:false});
export async function requireAuthority(authority:HostAuthority|undefined, context:HostContext, capability:Capability) {
 if(!authority || !context.tenantId || !context.actorId || !await authority.authorize(context,capability)) throw new Error('HOST_AUTHORITY_REQUIRED');
}
