import { z } from 'zod';
const Hash=z.string().regex(/^[a-f0-9]{64}$/);
const Asset=z.object({id:Hash,extension:z.string().regex(/^\.[a-z0-9]+$/),bytes:z.number().int().nonnegative(),cardIds:z.array(z.string()),status:z.literal('pending-review'),paths:z.array(z.string()),refs:z.array(z.string())}).strict();
const Card=z.object({id:z.string(),collection:z.string(),title:z.string(),slug:z.string(),description:z.string(),keywords:z.array(z.string()),basis:z.string(),assetIds:z.array(Hash)}).strict();
const normalize=(s:string)=>s.normalize('NFD').replace(/\p{M}/gu,'').toLowerCase();
const tokens=(s:string)=>[...new Set(normalize(s).match(/[\p{L}\p{N}]+/gu)||[])];
export class VisualCatalog {
 readonly assets:ReadonlyMap<string,z.infer<typeof Asset>>;
 readonly cards:readonly z.infer<typeof Card>[];
 constructor(assets:unknown,cards:unknown){
 const a=z.array(Asset).parse(assets),c=z.array(Card).parse(cards);
 this.assets=new Map(a.map(x=>[x.id,x]));this.cards=c;
 if(this.assets.size!==a.length||new Set(c.map(x=>x.id)).size!==c.length)throw Error('DUPLICATE_CATALOG_ID');
 for(const x of c)for(const id of x.assetIds)if(!this.assets.has(id))throw Error('ORPHAN_ASSET');
 }
 search(query:string,limit=10){
 const q=tokens(query);if(!q.length)return [];
 return this.cards.map(card=>{const title=tokens(card.title+' '+card.slug+' '+card.collection), body=tokens(card.description+' '+card.keywords.join(' '));return {card,score:q.reduce((n,t)=>n+(title.includes(t)?4:0)+(body.includes(t)?1:0),0)};}).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||a.card.id.localeCompare(b.card.id)).slice(0,Math.max(0,Math.min(50,Math.floor(limit)))).map(x=>({...x,assets:x.card.assetIds.map(id=>this.assets.get(id)!),usableForProduction:false as const}));
 }
 resolveForProduction(_id:string):never {throw Error('ASSET_REVIEW_REQUIRED');}
}
