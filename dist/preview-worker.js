import * as T from './vendor/three.module.js';
import {renderPreviewBatch} from './preview-renderer.js';
// Model texture generation only needs canvases; no DOM or editor runs here.
globalThis.document={createElement:()=>new OffscreenCanvas(1,1)};
let queue=Promise.resolve();
self.onmessage=({data})=>{queue=queue.then(async()=>{
 try{const lights=data.lights.map(json=>new T.ObjectLoader().parse(json));await renderPreviewBatch(lights,data.exposure,data.prefix,data.ids,async(id,canvas)=>{const blob=await canvas.convertToBlob({type:'image/png'});self.postMessage({job:data.job,id,blob});},()=>new Promise(resolve=>setTimeout(resolve,0)));self.postMessage({job:data.job,done:true});}
 catch(error){self.postMessage({job:data.job,error:error.message});}
});};
