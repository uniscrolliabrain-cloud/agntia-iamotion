import {test} from 'node:test';
import assert from 'node:assert/strict';
import {compileImmersiveExperience} from '../dist/index.js';
const scope={tenantId:'demo',workspaceId:'museum'};
const composition={schemaVersion:1,id:'world',scope,revision:1,nodes:[{id:'root',kind:'space',label:'Museum',position:[0,0,0],scale:1,yaw:0,capabilities:['view','navigate']}],relations:[]};
const spec={schemaVersion:1,id:'experience',composition,installations:[],films:[],bindings:[]};
const authority={fractal:{scope,revision:1,capabilities:new Set(['view','navigate']),recipes:new Map()},constructor:{scope,revision:1,sourceRefs:new Set(),visualRefs:new Set(),narrationRefs:new Set(),exerciseRefs:new Set(),recipes:new Map()},filmRefs:new Set(),policy:{},lockedText:new Map(),features:new Set()};
test('empty experience has authorized navigation but no executable binding',()=>{
 const p=compileImmersiveExperience(spec,authority);
 assert.equal(p.project(p.initial).navigation.focus.id,'root');
 assert.equal(p.project(p.initial).binding,null);
 assert.throws(()=>p.resolveInstallation(p.initial));
 assert.throws(()=>p.evaluateExperiment(p.initial,'unknown'));
 assert.throws(()=>p.project({...p.initial,revision:2}));
});
test('reject dangling bindings',()=>{
 assert.throws(()=>compileImmersiveExperience({...spec,bindings:[{nodeId:'root',kind:'installation',ref:'missing'}]},authority));
});
