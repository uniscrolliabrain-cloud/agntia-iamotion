import {createAestheticSession,type AestheticAdapter} from '../../../src/sdk/aesthetic-session.js';
export function previewScene(adapter:AestheticAdapter,policy:unknown,lockedText:ReadonlyMap<string,unknown>,features:readonly string[],scene:unknown){
 const session=createAestheticSession(adapter,policy,lockedText,features);
 try {session.load('scene',scene);return session;} catch(error){session.dispose();throw error;}
}
