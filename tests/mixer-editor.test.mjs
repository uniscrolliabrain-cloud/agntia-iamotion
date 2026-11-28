import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createMixerEditor} from '../dist/index.js';
const base={motion:1,depth:1,glass:1,particles:1,illumination:1,background:1,camera:1};
const spec={version:1,durationMs:1000,base,tracks:[{channel:'glass',keys:[{ms:0,value:0,ease:'smooth'},{ms:1000,value:1,ease:'linear'}]}]};
const policy={surface:{glass:true,spatial:true,reducedMotion:false,intensity:1},particles:true,maxParticles:100,maxVertices:1000,maxSculptureParts:10};
const ambient={base:[1,1,1],lights:[],periodMs:8000,intensity:1,reducedMotion:false,active:true};
test('atomic editing, revision checks and history',()=>{
 const e=createMixerEditor(spec,policy,ambient);
 const initial=e.snapshot();
 const s=e.edit({expectedRevision:0,edits:[{kind:'insert',channel:'glass',ms:500,value:.8,ease:'hold'}]});
 assert.equal(s.revision,1);assert.equal(e.sample(500).values.glass,.8);
 assert.throws(()=>e.edit({expectedRevision:0,edits:[{kind:'clear',channel:'glass'}]}));
 assert.throws(()=>e.edit({expectedRevision:1,edits:[{kind:'base',channel:'motion',value:0},{kind:'move',channel:'glass',from:500,to:1000}]}));
 assert.deepEqual(e.snapshot(),s);
 assert.deepEqual(e.undo(1).spec,initial.spec);
 assert.deepEqual(e.redo(2).spec,s.spec);
 assert.deepEqual(JSON.parse(e.exportJSON()),s.spec);
});
