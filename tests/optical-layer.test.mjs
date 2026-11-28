import test from 'node:test';import assert from 'node:assert/strict';import {resolveOpticalLayers,opticalCss} from '../dist/factory/materials/optical-layer.js';
const layer={id:'a',depth:1,focus:1,relation:1,press:1,base:[1,.98,.95],ink:[.1,.1,.1],backdrop:[.8,.7,.9]};
const policy={glass:true,refraction:true,reducedMotion:false,intensity:1,maxGlassLayers:1};
test('optical budget and opaque content',()=>{const [a,b]=resolveOpticalLayers([layer,{...layer,id:'b'}],policy);assert.ok(a.alpha<1);assert.equal(a.contentOpacity,1);assert.equal(b.alpha,1);assert.equal(opticalCss(a,false)['--ag-optical-blur'],'0px');});
test('policy and contrast',()=>{assert.equal(resolveOpticalLayers([layer],{...policy,glass:false})[0].alpha,1);assert.equal(resolveOpticalLayers([layer],{...policy,reducedMotion:true})[0].refractionPx,0);assert.equal(resolveOpticalLayers([{...layer,ink:[1,1,1]}],policy)[0].readable,false);});
