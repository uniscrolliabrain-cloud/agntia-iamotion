import {createMotionDocumentStore} from '../../../src/sdk/motion-document.js';
const root=document.querySelector<HTMLElement>('#motion-authoring');
if(root){
 const store=createMotionDocumentStore({schemaVersion:1,id:'studio-demo',revision:0,target:{previewId:'studio',componentId:'synthetic-kpi',sourceRevision:'0'.repeat(40)},composition:{kind:'scene',spec:{version:1,id:'studio-scene',durationMs:2400,layers:[{id:'header',kind:'surface',stage:0,startMs:0,durationMs:600},{id:'kpi',kind:'surface',stage:1,startMs:300,durationMs:900},{id:'detail',kind:'surface',stage:2,startMs:1000,durationMs:1000}]}}});
 const get=<T extends HTMLElement>(id:string)=>root.querySelector<T>('#'+id)!;
 const select=get<HTMLSelectElement>('author-layer'),start=get<HTMLInputElement>('author-start'),duration=get<HTMLInputElement>('author-duration'),seek=get<HTMLInputElement>('author-seek'),status=get<HTMLElement>('author-status'),tracks=get<HTMLElement>('author-tracks');
 let selected='kpi',time=0;
 function render(){
 const doc=store.snapshot();if(doc.composition.kind!=='scene')return;
 const spec=doc.composition.spec;
 select.replaceChildren(...spec.layers.map(l=>{const o=document.createElement('option');o.value=l.id;o.textContent=l.id;return o;}));select.value=selected;
 const layer=spec.layers.find(l=>l.id===selected)!;
 start.value=String(layer.startMs);duration.value=String(layer.durationMs);seek.value=String(time);
 tracks.replaceChildren(...spec.layers.map(l=>{const row=document.createElement('div');row.className='author-track';const label=document.createElement('span');label.textContent=l.id;const rail=document.createElement('div');rail.className='author-rail';const bar=document.createElement('button');bar.type='button';bar.textContent=l.id;bar.style.left=100*l.startMs/spec.durationMs+'%';bar.style.width=100*l.durationMs/spec.durationMs+'%';bar.setAttribute('aria-pressed',String(l.id===selected));bar.onclick=()=>{selected=l.id;render();};rail.append(bar);row.append(label,rail);return row;}));
 for(const el of root.querySelectorAll<HTMLElement>('[data-author-preview]')){const l=spec.layers.find(x=>x.id===el.dataset.authorPreview);el.dataset.active=String(!!l&&time>=l.startMs&&time<l.startMs+l.durationMs);}
 status.textContent='Revisión '+doc.revision+' · '+time+' ms';
 }
 function action(fn:()=>unknown){try{fn();render();}catch(e){render();status.textContent=e instanceof Error?e.message:'Edición rechazada';}}
 select.onchange=()=>{selected=select.value;render();};
 seek.oninput=()=>{time=Number(seek.value);render();};
 get('author-apply').onclick=()=>action(()=>store.edit({expectedRevision:store.snapshot().revision,edits:[{op:'move',id:selected,startMs:Number(start.value)},{op:'resize',id:selected,durationMs:Number(duration.value)}]}));
 get('author-undo').onclick=()=>action(()=>store.undo(store.snapshot().revision));
 get('author-redo').onclick=()=>action(()=>store.redo(store.snapshot().revision));
 get('author-export').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(store.snapshot(),null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='motion-document.json';a.click();URL.revokeObjectURL(url);};
 render();
}
