import {readFile,mkdir,writeFile,cp,access} from 'node:fs/promises';
import {resolve,relative,isAbsolute} from 'node:path';
import {buildMotionKnowledge} from '../dist/sdk/capability-registry.js';
import * as sdk from '../dist/index.js';
const pkg=JSON.parse(await readFile('package.json','utf8'));
const bundle=buildMotionKnowledge(pkg.version);
for(const c of bundle.capabilities){
 if(isAbsolute(c.source)||relative(process.cwd(),resolve(c.source)).startsWith('..'))throw Error('INVALID_SOURCE '+c.id);
 await access(c.source);
 if(typeof sdk[c.symbol]!=='function')throw Error('MISSING_SDK_SYMBOL '+c.symbol);
}
await mkdir('dist/knowledge',{recursive:true});
await writeFile('dist/knowledge/capabilities.json',JSON.stringify(bundle.capabilities,null,2)+'\n');
await writeFile('dist/knowledge/manual.generated.md',bundle.manual);
await writeFile('dist/knowledge/manifest.json',JSON.stringify({schemaVersion:bundle.schemaVersion,packageVersion:pkg.version,capabilityCount:bundle.capabilities.length},null,2)+'\n');
await cp('skills/motion-engineering','dist/knowledge/handbook',{recursive:true});
console.log('Generated knowledge: '+bundle.capabilities.length+' capabilities');
