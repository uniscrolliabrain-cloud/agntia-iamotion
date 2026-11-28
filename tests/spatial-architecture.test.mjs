import {test} from 'node:test';
import assert from 'node:assert/strict';
import {compileSpatialArchitecture,sampleArchitectureExpansion} from '../dist/index.js';
const scope={tenantId:'demo',workspaceId:'museum'};
const world=(revision,positions)=>({view:{scope,revision,rooms:[{id:'a',slot:0},{id:'b',slot:1}]},positions});
const policy={minSize:6,padding:1,thickness:.5,corridorWidth:1.5,reducedMotion:false};
test('platform expands around stable anchors and corridor follows',()=>{
 const a=compileSpatialArchitecture(world(1,[]),policy);
 const b=compileSpatialArchitecture(world(2,[{roomId:'a',x:8.4,z:0}]),policy);
 assert.equal(a.rooms[0].width,6);
 assert.equal(b.rooms[0].width,18.8);
 const m=sampleArchitectureExpansion(a,b,.5);
 assert.equal(m.corridors[0].start[0],m.rooms[0].width/2);
 assert.equal(m.corridors[0].length,m.corridors[0].end[0]-m.corridors[0].start[0]);
 assert.equal(sampleArchitectureExpansion(a,b,1).complete,true);
});
test('reject excessive footprint and stale revision',()=>{
 assert.throws(()=>compileSpatialArchitecture(world(1,[{roomId:'a',x:20,z:0}]),policy));
 const a=compileSpatialArchitecture(world(1,[]),policy);
 assert.throws(()=>sampleArchitectureExpansion(a,a,.5));
});
