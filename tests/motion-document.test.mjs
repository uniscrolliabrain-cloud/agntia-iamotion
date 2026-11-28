import test from 'node:test';
import assert from 'node:assert/strict';
import {createMotionDocumentStore} from '../dist/sdk/motion-document.js';
const layer={id:'surface',kind:'surface',startMs:0,durationMs:300,stage:1};
const fixture={schemaVersion:1,id:'demo',revision:0,target:{previewId:'kpi',componentId:'card',sourceRevision:'a'.repeat(40)},composition:{kind:'scene',spec:{version:1,id:'scene',durationMs:1000,layers:[layer]}}};
test('move undo redo preserve monotonic revisions',()=>{const s=createMotionDocumentStore(fixture);assert.equal(s.edit({expectedRevision:0,edits:[{op:'move',id:'surface',startMs:200}]}).revision,1);assert.equal(s.undo(1).composition.spec.layers[0].startMs,0);assert.equal(s.redo(2).composition.spec.layers[0].startMs,200);});
test('invalid batch leaves state unchanged',()=>{const s=createMotionDocumentStore(fixture);assert.throws(()=>s.edit({expectedRevision:0,edits:[{op:'move',id:'surface',startMs:200},{op:'resize',id:'surface',durationMs:900}]}),/INVALID_AESTHETIC_INTERVAL/);assert.deepEqual(s.snapshot(),fixture);});
test('stale edit rejected',()=>{const s=createMotionDocumentStore(fixture);assert.throws(()=>s.edit({expectedRevision:1,edits:[{op:'remove',id:'surface'}]}),/STALE/);});
test('duplicate ids rejected',()=>{const s=createMotionDocumentStore(fixture);assert.throws(()=>s.edit({expectedRevision:0,edits:[{op:'add',layer}]}),/INVALID_AESTHETIC_INTERVAL/);});
