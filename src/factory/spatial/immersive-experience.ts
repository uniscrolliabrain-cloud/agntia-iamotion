import {z} from 'zod';
import {compileFractalComposition,FractalCompositionSchema} from './fractal-composition.js';
import {compileSpatialConstructor,ConstructorSpecSchema} from './constructor.js';
import {compileCinematicSequence,CinematicSequenceSchema} from '../graphics/cinematic-sequence.js';
import {startFractalNavigation,projectFractalNavigation} from './fractal-navigation.js';
const Id=z.string().regex(/^[a-z0-9][a-z0-9-]{0,95}$/);
const Binding=z.discriminatedUnion('kind',[
 z.strictObject({nodeId:Id,kind:z.literal('installation'),ref:Id}),
 z.strictObject({nodeId:Id,kind:z.literal('film'),ref:Id})
]);
export const ImmersiveExperienceSchema=z.strictObject({schemaVersion:z.literal(1),id:Id,composition:FractalCompositionSchema,installations:z.array(ConstructorSpecSchema).max(8),films:z.array(CinematicSequenceSchema).max(8),bindings:z.array(Binding).max(64)});
type Authority={fractal:Parameters<typeof compileFractalComposition>[1];constructor:Parameters<typeof compileSpatialConstructor>[1];filmRefs:ReadonlySet<string>;policy:unknown;lockedText:ReadonlyMap<string,unknown>;features:ReadonlySet<string>};
export function compileImmersiveExperience(input:unknown,authority:Authority){
 const spec=ImmersiveExperienceSchema.parse(input),composition=compileFractalComposition(spec.composition,authority.fractal);
 const installations=new Map<string,ReturnType<typeof compileSpatialConstructor>>();
 const films=new Map<string,ReturnType<typeof compileCinematicSequence>>();
 for(const item of spec.installations){
 if(installations.has(item.id)||item.view.scope.tenantId!==composition.scope.tenantId||item.view.scope.workspaceId!==composition.scope.workspaceId||item.view.revision!==composition.revision)throw Error('EXPERIENCE_INSTALLATION_DENIED');
 installations.set(item.id,compileSpatialConstructor(item,authority.constructor));
 }
 for(const film of spec.films){
 if(films.has(film.id)||!authority.filmRefs.has(film.id))throw Error('EXPERIENCE_FILM_DENIED');
 films.set(film.id,compileCinematicSequence(film,authority.policy,authority.lockedText,authority.features));
 }
 if([...installations.values()].reduce((n,p)=>n+p.exhibits.length,0)>512||[...films.values()].reduce((n,p)=>n+p.durationMs,0)>600000)throw Error('EXPERIENCE_RESOURCE_BUDGET');
 const bindings=new Map<string,z.infer<typeof Binding>>();
 for(const b of spec.bindings){
 const node=composition.nodes.find(n=>n.id===b.nodeId);
 if(!node||!node.effectiveCapabilities.includes('view')||bindings.has(b.nodeId))throw Error('EXPERIENCE_BINDING_DENIED');
 if(b.kind==='film'?(!node.effectiveCapabilities.includes('animate')||!films.has(b.ref)):!installations.has(b.ref))throw Error('EXPERIENCE_BINDING_REFERENCE');
 bindings.set(b.nodeId,b);
 }
 const initial=startFractalNavigation(composition);
 return {id:spec.id,composition,initial,project(state:unknown){
 const navigation=projectFractalNavigation(composition,state),binding=bindings.get(navigation.focus.id);
 return {navigation,binding:binding?{kind:binding.kind,ref:binding.ref}:null};
 },resolveInstallation(state:unknown){
 const nav=projectFractalNavigation(composition,state),b=bindings.get(nav.focus.id);
 if(!b||b.kind!=='installation')throw Error('INSTALLATION_NOT_FOCUSED');
 const p=installations.get(b.ref)!;
 return {world:p.world,exhibits:p.exhibits,tours:p.tours};
 },evaluateExperiment(state:unknown,id:string,overrides:unknown={}){
 const nav=projectFractalNavigation(composition,state),b=bindings.get(nav.focus.id);
 if(!nav.focus.capabilities.includes('experiment')||!b||b.kind!=='installation')throw Error('EXPERIENCE_EXPERIMENT_DENIED');
 return installations.get(b.ref)!.evaluateExperiment(id,overrides);
 },resolveFilm(state:unknown){
 const nav=projectFractalNavigation(composition,state),b=bindings.get(nav.focus.id);
 if(!nav.focus.capabilities.includes('animate')||!b||b.kind!=='film')throw Error('FILM_NOT_FOCUSED');
 return films.get(b.ref)!;
 }};
}
