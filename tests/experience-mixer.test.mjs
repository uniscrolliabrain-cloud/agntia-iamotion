import {test} from 'node:test';
import assert from 'node:assert/strict';
import {compileExperienceMixer} from '../dist/index.js';
const base={motion:1,depth:1,glass:1,particles:1,illumination:1,background:1,camera:1};
const spec={version:1,durationMs:1000,base,tracks:[{channel:'glass',keys:[{ms:0,value:0,ease:'smooth'},{ms:1000,value:1,ease:'linear'}]}]};
const policy={surface:{glass:true,spatial:true,reducedMotion:false,intensity:1},particles:true,maxParticles:100,maxVertices:1000,maxSculptureParts:10};
const ambient={base:[1,1,1],lights:[],periodMs:8000,intensity:1,reducedMotion:false,active:true};
test('deterministic interpolation and clamped timeline',()=>{
 const m=compileExperienceMixer(spec,policy,ambient);
 assert.equal(m.sample(500).effective.glass,.5);
 assert.deepEqual(m.sample(500),m.sample(500));
 assert.equal(m.sample(2000).complete,true);
});
test('policy overrides tracks and duplicate tracks rejected',()=>{
 const m=compileExperienceMixer(spec,{...policy,surface:{...policy.surface,glass:false,reducedMotion:true}},ambient);
 assert.equal(m.sample(500).effective.glass,0);
 assert.equal(m.sample(500).particleBudget,0);
 assert.equal(m.sample(500).effective.camera,0);
 assert.throws(()=>compileExperienceMixer({...spec,tracks:[...spec.tracks,...spec.tracks]},policy,ambient));
});
