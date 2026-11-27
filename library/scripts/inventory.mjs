import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root=path.resolve(process.argv[2]||'source');
const out=path.resolve(process.argv[3]||'library/inventory');
const ref=process.argv[4]||'main';
const git=(...args)=>execFileSync('git',['-C',root,...args],{maxBuffer:128*1024*1024}).toString();
const commit=git('rev-parse','HEAD').trim();
const files=git('ls-files','-z').split('\0').filter(Boolean);
const images=files.filter(f=>/\.(png|jpe?g|webp|avif|gif|svg|ico|bmp|tiff?)$/i.test(f));
const code=files.filter(f=>/\.(tsx?|jsx?|css|scss|html|mdx?|json)$/i.test(f)&&!/(^|\/)(node_modules|dist|vendor)\//.test(f));
const index=new Map();
for(const f of images){const name=path.basename(f);if(!index.has(name))index.set(name,[]);}
for(const f of code){const p=path.join(root,f);if(!fs.existsSync(p)||fs.lstatSync(p).isSymbolicLink()||fs.statSync(p).size>2000000)continue;const lines=fs.readFileSync(p,'utf8').split('\n');for(let i=0;i<lines.length;i++){for(const [name,hits] of index){if(lines[i].includes(name))hits.push({path:f,line:i+1});}}}
const assets=new Map();
for(const f of images){const p=path.join(root,f);if(!fs.existsSync(p)||fs.lstatSync(p).isSymbolicLink())continue;const bytes=fs.readFileSync(p);const sha=crypto.createHash('sha256').update(bytes).digest('hex');if(!assets.has(sha))assets.set(sha,{id:sha,sha256:sha,bytes:bytes.length,extension:path.extname(f).toLowerCase(),sources:[],auditStatus:'pending-visual-review',semanticTitle:null,slug:null,altText:null,description:null,keywords:[],rights:'pending-review'});assets.get(sha).sources.push({repository:'uniscrolliabrain-cloud/agente',ref,commit,path:f,referenceCandidates:index.get(path.basename(f))});}
fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,ref.replace(/[^a-zA-Z0-9_-]/g,'_')+'.json'),JSON.stringify({commit,ref,trackedImages:images.length,uniqueAssets:assets.size,assets:[...assets.values()]},null,2)+'\n');
console.log(JSON.stringify({ref,commit,trackedImages:images.length,uniqueAssets:assets.size}));
