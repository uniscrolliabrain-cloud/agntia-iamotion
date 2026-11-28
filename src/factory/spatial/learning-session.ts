import {z} from 'zod';
const Id=z.string().regex(/^[a-z0-9][a-z0-9-]{0,95}$/);
const Time=z.number().int().min(0).max(8e15);
const Scope=z.strictObject({tenantId:Id,workspaceId:Id,userId:Id});
const Attempt=z.strictObject({id:Id,conceptId:Id,exerciseId:Id,atMs:Time,outcome:z.enum(['incorrect','partial','correct']),kind:z.enum(['recall','practice','transfer'])});
export const LearningSessionSchema=z.strictObject({schemaVersion:z.literal(1),id:Id,scope:Scope,revision:z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),attempts:z.array(Attempt).max(4096)});
export type LearningSession=z.infer<typeof LearningSessionSchema>;
type Authority={scope:z.infer<typeof Scope>;revision:number;conceptExercises:ReadonlyMap<string,ReadonlySet<string>>};
const day=86400000;
const intervals=[1,3,7,14,30,60] as const;
export function projectLearningSession(input:unknown,authority:Authority){
 const session=LearningSessionSchema.parse(input);
 if(session.scope.tenantId!==authority.scope.tenantId||session.scope.workspaceId!==authority.scope.workspaceId||session.scope.userId!==authority.scope.userId||session.revision!==authority.revision)throw Error('LEARNING_SCOPE_DENIED');
 const ids=new Set<string>(),progress=new Map<string,{conceptId:string;level:number;attemptCount:number;lastAtMs:number;nextReviewMs:number;transferCount:number}>();
 let previous=-1;
 for(const a of session.attempts){
 if(ids.has(a.id)||a.atMs<previous)throw Error('INVALID_ATTEMPT_SEQUENCE');
 if(!authority.conceptExercises.get(a.conceptId)?.has(a.exerciseId))throw Error('LEARNING_REFERENCE_DENIED');
 ids.add(a.id);previous=a.atMs;
 const old=progress.get(a.conceptId),prior=old?.level??0;
 const level=a.outcome==='incorrect'?Math.max(0,prior-1):a.outcome==='correct'&&a.kind!=='practice'&&(!old||a.atMs>=old.nextReviewMs)?Math.min(intervals.length-1,old?prior+1:0):prior;
 const delay=a.outcome==='incorrect'?600000:a.outcome==='partial'?day:intervals[level]!*day;
 progress.set(a.conceptId,{conceptId:a.conceptId,level,attemptCount:(old?.attemptCount??0)+1,lastAtMs:a.atMs,nextReviewMs:a.outcome==='correct'&&old&&a.atMs<old.nextReviewMs?old.nextReviewMs:a.atMs+delay,transferCount:(old?.transferCount??0)+(a.kind==='transfer'&&a.outcome==='correct'?1:0)});
 }
 return [...progress.values()].sort((a,b)=>a.nextReviewMs-b.nextReviewMs||(a.conceptId<b.conceptId?-1:a.conceptId>b.conceptId?1:0));
}
export function dueLearningReviews(input:unknown,authority:Authority,nowMs:number){
 const now=Time.parse(nowMs);return projectLearningSession(input,authority).filter(p=>p.nextReviewMs<=now);
}
export function appendLearningAttempt(input:unknown,attempt:unknown,authority:Authority):LearningSession{
 const session=LearningSessionSchema.parse(input),next=Attempt.parse(attempt);
 projectLearningSession(session,authority);
 const existing=session.attempts.find(a=>a.id===next.id);
 if(existing){if(JSON.stringify(existing)!==JSON.stringify(next))throw Error('ATTEMPT_ID_CONFLICT');return session;}
 const result=LearningSessionSchema.parse({...session,attempts:[...session.attempts,next]});
 projectLearningSession(result,authority);return result;
}
