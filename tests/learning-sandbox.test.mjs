import {test} from 'node:test';
import assert from 'node:assert/strict';
import {compileLearningSandbox,cashFlowExercise} from '../dist/index.js';
const authority={scope:cashFlowExercise.scope,revision:1,exerciseRefs:new Set(['cash-flow-lab'])};
test('cash flow experiment is reproducible and resets',()=>{
 const lab=compileLearningSandbox(cashFlowExercise,authority);
 assert.equal(lab.initial.values.closing,7000);
 assert.equal(lab.evaluate({'collection-rate':.25}).values.closing,-3000);
 assert.deepEqual(lab.evaluate({'collection-rate':.25}),lab.evaluate({'collection-rate':.25}));
 assert.deepEqual(lab.reset(),lab.initial);
});
test('reject unauthorized inputs and scope',()=>{
 const lab=compileLearningSandbox(cashFlowExercise,authority);
 assert.throws(()=>lab.evaluate({closing:10}));
 assert.throws(()=>lab.evaluate({'collection-rate':2}));
 assert.throws(()=>compileLearningSandbox(cashFlowExercise,{...authority,revision:2}));
 assert.throws(()=>compileLearningSandbox({...cashFlowExercise,synthetic:false},authority));
});
test('reject forward dependencies and zero division',()=>{
 const bad=structuredClone(cashFlowExercise);
 bad.rules[0].left={kind:'reference',id:'closing'};
 assert.throws(()=>compileLearningSandbox(bad,authority));
 const zero=structuredClone(cashFlowExercise);
 zero.rules[0].op='divide';
 const lab=compileLearningSandbox(zero,authority);
 assert.throws(()=>lab.evaluate({'collection-rate':0}));
});
