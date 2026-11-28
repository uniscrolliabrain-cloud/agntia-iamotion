import {test} from 'node:test';
import assert from 'node:assert/strict';
import {compileConstructorTransition,sampleConstructorTransition} from '../dist/index.js';
const scope={tenantId:'demo',workspaceId:'museum'};
const exhibit=(entityId,x,recipeRef='ceramic')=>({entityId,kind:'sculpture',recipeRef,position:{id:entityId,roomId:'room',x,y:0,z:0}});
const plan=(revision,exhibits)=>({id:'museum',world:{view:{scope,revision,relations:[]}},exhibits});
const a=plan(1,[exhibit('move',0),exhibit('exit',2),exhibit('replace',4)]);
const b=plan(2,[exhibit('move',8),exhibit('enter',2),exhibit('replace',4,'gold')]);
const policy={durationMs:800,staggerMs:40,lift:1,reducedMotion:false};
test('stable identity and deterministic endpoints',()=>{
 const t=compileConstructorTransition(a,b,policy);
 const middle=sampleConstructorTransition(t,400);
 assert.equal(middle.tracks.find(x=>x.id==='move').position[0],4);
 assert.equal(middle.tracks.find(x=>x.id==='replace').recipeMix,.5);
 assert.equal(sampleConstructorTransition(t,0).tracks.find(x=>x.id==='enter').opacity,0);
 const end=sampleConstructorTransition(t,800);
 assert.equal(end.tracks.find(x=>x.id==='exit').opacity,0);
 assert.equal(end.complete,true);
 assert.deepEqual(sampleConstructorTransition(t,400),middle);
});
test('reduced motion and revision rejection',()=>{
 assert.equal(sampleConstructorTransition(compileConstructorTransition(a,b,{...policy,reducedMotion:true}),0).complete,true);
 assert.throws(()=>compileConstructorTransition(b,a,policy));
});
