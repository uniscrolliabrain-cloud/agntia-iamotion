import {test} from 'node:test';
import assert from 'node:assert/strict';
import {appendLearningAttempt,projectLearningSession,dueLearningReviews} from '../dist/index.js';
const scope={tenantId:'agntia-demo',workspaceId:'museum',userId:'learner-1'};
const authority={scope,revision:1,conceptExercises:new Map([['cash-flow',new Set(['cash-flow-lab'])]])};
const empty={schemaVersion:1,id:'lesson-1',scope,revision:1,attempts:[]};
const a={id:'attempt-1',conceptId:'cash-flow',exerciseId:'cash-flow-lab',atMs:0,outcome:'correct',kind:'recall'};
test('review projection is deterministic and replay is idempotent',()=>{
 const s=appendLearningAttempt(empty,a,authority);
 assert.deepEqual(appendLearningAttempt(s,a,authority),s);
 assert.equal(projectLearningSession(s,authority)[0].nextReviewMs,86400000);
 assert.equal(dueLearningReviews(s,authority,86399999).length,0);
 assert.equal(dueLearningReviews(s,authority,86400000).length,1);
 const next=appendLearningAttempt(s,{...a,id:'attempt-2',atMs:86400000},authority);
 assert.equal(projectLearningSession(next,authority)[0].nextReviewMs,4*86400000);
});
test('reject cross-user and conflicting attempts',()=>{
 const s=appendLearningAttempt(empty,a,authority);
 assert.throws(()=>projectLearningSession(s,{...authority,scope:{...scope,userId:'other'}}));
 assert.throws(()=>appendLearningAttempt(s,{...a,outcome:'incorrect'},authority));
 assert.throws(()=>appendLearningAttempt(s,{...a,id:'attempt-2',exerciseId:'unknown'},authority));
});
