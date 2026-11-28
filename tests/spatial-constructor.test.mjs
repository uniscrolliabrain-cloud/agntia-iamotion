import {test} from 'node:test';
import assert from 'node:assert/strict';
import {compileSpatialConstructor,cashFlowExercise} from '../dist/index.js';
const scope=cashFlowExercise.scope;
const view={schemaVersion:1,scope,revision:1,rooms:[{id:'finance',label:'Finance',slot:0}],entities:[{id:'cash',roomId:'finance',kind:'concept',label:'Cash flow',sourceRef:'cash-source'}],relations:[]};
const spec={schemaVersion:1,id:'finance-lab',view,exhibits:[{entityId:'cash',kind:'experiment',recipeRef:'cash-recipe',exerciseRef:cashFlowExercise.id}],experiments:[cashFlowExercise],tours:[{schemaVersion:1,id:'tour',scope,revision:1,steps:[{id:'practice',focus:{kind:'entity',id:'cash'},phase:'practice',exerciseRef:cashFlowExercise.id,travelMs:500,holdMs:1000}]}]};
const authority={scope,revision:1,sourceRefs:new Set(['cash-source']),visualRefs:new Set(),narrationRefs:new Set(),exerciseRefs:new Set([cashFlowExercise.id]),recipes:new Map([['cash-recipe','experiment']])};
test('compile coherent world and evaluate bound experiment',()=>{
 const plan=compileSpatialConstructor(spec,authority);
 assert.equal(plan.exhibits[0].position.id,'cash');
 assert.equal(plan.tours[0].durationMs,1500);
 assert.equal(plan.evaluateExperiment(cashFlowExercise.id).values.closing,7000);
 assert.throws(()=>plan.evaluateExperiment('unknown'));
});
test('deny unauthorized recipes and dangling exercise references',()=>{
 assert.throws(()=>compileSpatialConstructor(spec,{...authority,recipes:new Map()}));
 assert.throws(()=>compileSpatialConstructor({...spec,experiments:[]},authority));
 assert.throws(()=>compileSpatialConstructor(spec,{...authority,revision:2}));
});
