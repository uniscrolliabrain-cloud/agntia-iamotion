import {test} from 'node:test';
import assert from 'node:assert/strict';
import {compileFractalComposition} from '../dist/index.js';
const scope={tenantId:'demo',workspaceId:'museum'};
const node=(id,parentId,position,scale,capabilities)=>({id,parentId,kind:'space',label:id,position,scale,yaw:0,capabilities});
const spec={schemaVersion:1,id:'world',scope,revision:1,nodes:[node('root',undefined,[1,0,0],2,['view']),node('child','root',[3,0,0],.5,['view','experiment'])],relations:[]};
const authority={scope,revision:1,capabilities:new Set(['view','experiment']),recipes:new Map()};
test('nested transforms preserve identity and attenuate permissions',()=>{
 const p=compileFractalComposition(spec,authority);
 assert.deepEqual(p.nodes[1].worldPosition,[7,0,0]);
 assert.equal(p.nodes[1].worldScale,1);
 assert.deepEqual(p.nodes[1].effectiveCapabilities,['view']);
 assert.deepEqual(p.nodes[1].path,['root','child']);
});
test('reject missing parents and unauthorized recipes',()=>{
 assert.throws(()=>compileFractalComposition({...spec,nodes:[spec.nodes[0],{...spec.nodes[1],parentId:'missing'}]},authority));
 assert.throws(()=>compileFractalComposition({...spec,nodes:[spec.nodes[0],{...spec.nodes[1],recipeRef:'unknown'}]},authority));
});
