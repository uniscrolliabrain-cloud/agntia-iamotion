import {test} from 'node:test';
import assert from 'node:assert/strict';
import {compileImmersiveExperience,createExperienceDirector} from '../dist/index.js';
const scope={tenantId:'demo',workspaceId:'museum'};
const node=(id,parentId)=>({id,parentId,kind:'space',label:id,position:[0,0,0],scale:1,yaw:0,capabilities:['view','navigate']});
const experience=compileImmersiveExperience({schemaVersion:1,id:'experience',composition:{schemaVersion:1,id:'world',scope,revision:1,nodes:[node('root'),node('room','root')],relations:[]},installations:[],films:[],bindings:[]},{fractal:{scope,revision:1,capabilities:new Set(['view','navigate']),recipes:new Map()},constructor:{scope,revision:1,sourceRefs:new Set(),visualRefs:new Set(),narrationRefs:new Set(),exerciseRefs:new Set(),recipes:new Map()},filmRefs:new Set(),policy:{},lockedText:new Map(),features:new Set()});
test('explicit clock and denied playback leave exploration intact',()=>{
 const d=createExperienceDirector(experience,{reducedMotion:true});
 assert.equal(d.dispatch({kind:'advance',ms:100}).timeMs,0);
 assert.throws(()=>d.dispatch({kind:'film'}));
 assert.throws(()=>d.dispatch({kind:'seek',ms:100}));
 assert.equal(d.dispatch({kind:'navigate',command:{kind:'enter',id:'room'}}).navigation.focusId,'room');
 assert.equal(d.snapshot().mode,'explore');
 d.dispose();d.dispose();assert.throws(()=>d.snapshot());
});
