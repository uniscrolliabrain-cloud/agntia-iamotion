import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as sdk from '../dist/index.js';
test('integrated capability records resolve public symbols',()=>{
 const knowledge=sdk.buildMotionKnowledge('integration-test');
 assert.ok(knowledge.capabilities.length>=36);
 for(const entry of knowledge.capabilities.filter(e=>e.source.startsWith('src/factory/spatial/'))){
 assert.ok(entry.symbol in sdk,entry.symbol);
 assert.equal(entry.active,false);
 assert.equal(entry.maturity,'implemented');
 }
 assert.ok(knowledge.manual.includes('experience.record'));
});
test('implemented instruments cannot be enabled as certified',()=>{
 assert.throws(()=>sdk.buildMotionKnowledge('integration-test',{packageVersion:'integration-test',enabled:[{id:'experience.mix',revision:1}]}),/HOST_CAPABILITY_UNAVAILABLE/);
});
