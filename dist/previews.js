import {renderPreviewBatch} from './preview-renderer.js';
const finished=new Set(),urls=new Map();let sequence=Promise.resolve(),worker=null,disabled=false,job=0,idleTimer;
const stats={mode:'pending',rendered:0};export const previewPerformance=()=>({...stats});
const pause=()=>new Promise(resolve=>{if('requestIdleCallback'in window)requestIdleCallback(resolve,{timeout:250});else setTimeout(resolve,32);});
function display(id,blob){const url=URL.createObjectURL(blob);if(urls.has(id))URL.revokeObjectURL(urls.get(id));urls.set(id,url);for(const img of document.querySelectorAll('[data-preview="'+id+'"]')){img.src=url;img.dataset.previewReady='true';}stats.rendered++;}
function offThread(lights,exposure,prefix,ids){return new Promise((resolve,reject)=>{
 clearTimeout(idleTimer);try{worker??=new Worker(new URL('./preview-worker.js',import.meta.url),{type:'module'});}catch(error){reject(error);return;}
 const current=worker,token=++job;
 const cleanup=()=>{current.removeEventListener('message',message);current.removeEventListener('error',error);};
 const error=event=>{event.preventDefault?.();cleanup();reject(new Error(event.message||'Preview worker unavailable'));};
 const message=({data})=>{if(data.job!==token)return;if(data.error){cleanup();reject(new Error(data.error));}else if(data.done){cleanup();idleTimer=setTimeout(()=>{worker?.terminate();worker=null;},15000);resolve();}else if(data.blob)display(data.id,data.blob);};
 current.addEventListener('message',message);current.addEventListener('error',error);current.postMessage({job:token,lights:lights.map(l=>l.toJSON()),exposure,prefix,ids});
 });}
export function populatePreviews(lights,exposure,prefix='species'){
 if(finished.has(prefix))return sequence;finished.add(prefix);
 sequence=sequence.then(async()=>{
  const ids=[...new Set([...document.querySelectorAll('[data-preview^="'+prefix+'-"]')].filter(img=>img.dataset.previewReady!=='true').map(img=>img.dataset.preview))];if(!ids.length)return;
  if(!disabled&&typeof Worker!=='undefined'&&typeof OffscreenCanvas!=='undefined')try{await offThread(lights,exposure,prefix,ids);stats.mode='worker';return;}catch{disabled=true;worker?.terminate();worker=null;}
  stats.mode='main';const missing=ids.filter(id=>!urls.has(id));await renderPreviewBatch(lights,exposure,prefix,missing,async(id,canvas)=>display(id,await new Promise(resolve=>canvas.toBlob(resolve,'image/png'))),pause);
 }).catch(error=>{finished.delete(prefix);throw error;});return sequence;
}
window.addEventListener('pagehide',()=>{clearTimeout(idleTimer);worker?.terminate();worker=null;for(const url of urls.values())URL.revokeObjectURL(url);urls.clear();finished.clear();},{once:true});
