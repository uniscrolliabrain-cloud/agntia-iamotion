import {test} from 'node:test';
import assert from 'node:assert/strict';
import {applyFractalPattern} from '../dist/index.js';
const scope={tenantId:'demo',workspaceId:'museum'};
const node=(id,parentId)=>({id,parentId,kind:'space',label:id,position:[0,0,0],scale:1,yaw:0,capabilities:['view']});
const spec={schemaVersion:1,id:'world',scope,revision:1,nodes:[node('root'),node('b','root'),node('a','root'),node('nested','a')],relations:[]};
const authority={scope,revision:1,capabilities:new Set(['view']),recipes:new Map()};
test('all patterns preserve hierarchy and deterministic positions',()=>{
 for(const kind of ['orbit','constellation','gallery','corridor','terrace','helix']){
 const p={kind,parentId:'root',spacing:3,phase:0,columns:2};
 const a=applyFractalPattern(spec,p,authority);
 assert.deepEqual(a,applyFractalPattern(spec,p,authority));
 assert.deepEqual(a.plan.nodes.find(n=>n.id==='nested').path,['root','a','nested']);
 assert.notDeepEqual(a.plan.nodes.find(n=>n.id==='a').worldPosition,a.plan.nodes.find(n=>n.id==='b').worldPosition);
 }
});
test('reject unknown parent and invalid spacing',()=>{
 assert.throws(()=>applyFractalPattern(spec,{kind:'orbit',parentId:'missing',spacing:3,phase:0,columns:2},authority));
 assert.throws(()=>applyFractalPattern(spec,{kind:'orbit',parentId:'root',spacing:0,phase:0,columns:2},authority));
});
