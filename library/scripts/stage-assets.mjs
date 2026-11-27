import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const [source,inventory,output]=process.argv.slice(2);
if(!source||!inventory||!output)throw Error('Usage: stage-assets source inventory.json output');
const root=fs.realpathSync(source), out=path.resolve(output);
const data=JSON.parse(fs.readFileSync(inventory,'utf8'));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const records=[];
for(const a of data.assets){
 if(!/^[a-f0-9]{64}$/.test(a.sha256)||!/^\.(png|jpe?g|webp|avif|gif|svg|ico|bmp|tiff?)$/i.test(a.extension))throw Error('Invalid asset');
 const src=fs.realpathSync(path.resolve(root,a.sources[0].path));
 if(!src.startsWith(root+path.sep))throw Error('Path escape');
 const b=fs.readFileSync(src);
 if(sha(b)!==a.sha256)throw Error('Hash mismatch '+src);
 if(b.subarray(0,100).toString().startsWith('version https://git-lfs.github.com/spec/v1'))throw Error('Unresolved LFS pointer');
 const relative='assets/'+a.sha256+a.extension;
 const dest=path.join(out,relative);
 fs.mkdirSync(path.dirname(dest),{recursive:true});
 fs.writeFileSync(dest,b);
 records.push({...a,stagedPath:relative,publicationStatus:'quarantine-review-required'});
}
fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(path.join(out,'staged-manifest.json'),JSON.stringify(records,null,2)+'\n');
console.log('Staged '+records.length+' unique files');
