import {test} from 'node:test';
import assert from 'node:assert/strict';
import {compileFractalComposition,startFractalNavigation,navigateFractal,projectFractalNavigation} from '../dist/index.js';
const scope={tenantId:'demo',workspaceId:'museum'};
const node=(id,parentId,position,capabilities=['view','navigate'])=>({id,parentId,kind:'space',label:id,position,scale:2,yaw:0,capabilities});
const plan=compileFractalComposition({schemaVersion:1,id:'world',scope,revision:1,nodes:[node('root',undefined,[1,0,0]),node('room','root',[3,0,0]),node('object','room',[2,0,0]),node('hidden','root',[0,0,0],[])],relations:[]},{scope,revision:1,capabilities:new Set(['view','navigate']),recipes:new Map()});
test('local coordinates, breadcrumbs and back',()=>{
 const s=startFractalNavigation(plan);
 assert.deepEqual(projectFractalNavigation(plan,s).children.map(n=>n.id),['room']);
 const r=navigateFractal(plan,s,{kind:'enter',id:'room'});
 assert.deepEqual(projectFractalNavigation(plan,r).children[0].position,[2,0,0]);
 assert.deepEqual(projectFractalNavigation(plan,r).breadcrumbs.map(n=>n.id),['root','room']);
 assert.deepEqual(navigateFractal(plan,r,{kind:'back'}),s);
});
test('reject hidden, nonchild and stale navigation',()=>{
 const s=startFractalNavigation(plan);
 assert.throws(()=>navigateFractal(plan,s,{kind:'enter',id:'hidden'}));
 assert.throws(()=>navigateFractal(plan,s,{kind:'enter',id:'object'}));
 assert.throws(()=>projectFractalNavigation(plan,{...s,revision:2}));
});
