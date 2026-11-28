import test from 'node:test';import assert from 'node:assert/strict';import {layoutSpatialTiles,SpatialTransition} from '../dist/factory/graphics/spatial-layout.js';
const tiles=Array.from({length:4},(_,i)=>({id:'t'+i,group:'g'+i,weight:1,depth:0,relation:1}));
const layout=weight=>layoutSpatialTiles({width:600,height:400,gap:12,tiles:tiles.map((t,i)=>({...t,weight:i===0?weight:1}))});
test('tiling bounds and no overlap',()=>{const p=layout(4);for(const a of p){assert.ok(a.x>=0&&a.y>=0&&a.x+a.width<=600.00001&&a.y+a.height<=400.00001);for(const b of p)if(a!==b)assert.ok(a.x+a.width<=b.x||b.x+b.width<=a.x||a.y+a.height<=b.y||b.y+b.height<=a.y);}});
test('retarget preserves current geometry',()=>{const s=new SpatialTransition();s.retarget(layout(1),0);s.retarget(layout(4),700);const before=s.sample(850);s.retarget(layout(2),850);assert.deepEqual(s.sample(850),before);assert.deepEqual(s.sample(1500),layout(2));});
