import test from 'node:test';import assert from 'node:assert/strict';import {compileAestheticScene,sampleAestheticScene,retrieveAestheticTechniques} from '../dist/factory/graphics/aesthetic-runtime.js';
const policy={surface:{glass:true,spatial:true,reducedMotion:false,intensity:1},particles:false,maxParticles:0,maxVertices:10000,maxSculptureParts:0};
const layer={id:'glass',kind:'surface',startMs:0,durationMs:600,stage:2};
const scene={version:1,id:'study',durationMs:1000,layers:[layer]};
test('compile and sample with explicit capabilities',()=>{const p=compileAestheticScene(scene,policy,new Map(),new Set(['surface']));assert.equal(sampleAestheticScene(p,0)[0].pose.blurPx,16);assert.equal(sampleAestheticScene(p,600).length,0);assert.throws(()=>compileAestheticScene(scene,policy,new Map(),new Set()));assert.throws(()=>compileAestheticScene({...scene,layers:[layer,layer]},policy,new Map(),new Set(['surface'])));});
test('retrieval filters unavailable capabilities',()=>{assert.equal(retrieveAestheticTechniques('queso cerámica',new Set(['mesh']))[0].kind,'annular');assert.deepEqual(retrieveAestheticTechniques('queso',new Set()),[]);});
