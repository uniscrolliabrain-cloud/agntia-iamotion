import type { VisualCatalog } from './catalog.js';
export function buildVisualBrief(catalog:VisualCatalog,query:string){
 return {query,candidates:catalog.search(query).map(({card,score,assets})=>({id:card.id,title:card.title,description:card.description,basis:card.basis,score,assetIds:assets.map(a=>a.id),status:'reference-only'})),approvedAssetIds:[] as string[]};
}
