import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root=path.resolve(process.argv[2]||'.');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const assets=read('library/catalog/assets.json'),cards=read('library/catalog/semantic.json'),lex=read('library/taxonomy/lexicon.v1.json');
const norm=s=>s.normalize('NFD').replace(/\p{M}/gu,'').toLowerCase();
const words=s=>norm(s).match(/[\p{L}\p{N}]+/gu)||[];
const contains=(s,t)=>(' '+words(s).join(' ')+' ').includes(' '+words(t).join(' ')+' ');
const byId=new Map(cards.map(c=>[c.id,c]));
const out=path.join(root,'library/entities');fs.mkdirSync(out,{recursive:true});
const write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');
let classified=0,claims=0;
for(const a of assets){
 if(!/^[a-f0-9]{64}$/.test(a.id))throw Error('invalid hash');
 const dir=path.join(out,a.id);fs.mkdirSync(dir,{recursive:true});
 const linked=a.cardIds.map(id=>{if(!byId.has(id))throw Error('orphan card '+id);return byId.get(id)});
 const matches=[];
 for(const c of linked)for(const t of lex.terms){
 if(['governance','learning','motion','reconstruction','export','relationships'].includes(t.facet))continue;
 const phrase=[t.label,...t.aliases].find(v=>contains(c.title+' '+c.keywords.join(' '),v));
 if(phrase)matches.push({termId:t.id,evidenceRef:c.id,basis:'source-spec',confidence:'low',reviewStatus:'pending',matchedPhrase:phrase});
 }
 if(matches.length)classified++;claims+=matches.length;
 const pick=(facets)=>matches.filter(m=>facets.includes(m.termId.split('.')[0]));
 const records={identity:{id:a.id,kind:'binary-entity',semanticCardIds:a.cardIds},provenance:{paths:a.paths,refs:a.refs},semantics:{cards:linked.map(c=>({id:c.id,title:c.title,slug:c.slug,description:c.description,basis:c.basis})),claims:pick(['subject','business','semantic'])},appearance:{claims:pick(['geometry','material','color','lighting','composition','style']),observed:null},ux:{claims:pick(['ux']),verifiedComponentUses:null},motion:{candidates:[],reviewStatus:'pending'},reconstruction:{hypotheses:[],reviewStatus:'pending'},relations:{semanticCardIds:a.cardIds},governance:{status:'pending-review',productionAllowed:false},evidence:{claims:matches},variants:{binary:{sha256:a.id,extension:a.extension,bytes:a.bytes}}};
 for(const [name,value] of Object.entries(records))write(path.join(dir,name+'.json'),value);
}
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex');
const receipt={schemaVersion:1,status:'generated-pending-review',entities:assets.length,classified,claims,inputHashes:Object.fromEntries(['library/catalog/assets.json','library/catalog/semantic.json','library/taxonomy/lexicon.v1.json'].map(p=>[p,hash(p)]))};
fs.mkdirSync(path.join(root,'lab/observability'),{recursive:true});write(path.join(root,'lab/observability/entity-build.json'),receipt);console.log(JSON.stringify(receipt));
