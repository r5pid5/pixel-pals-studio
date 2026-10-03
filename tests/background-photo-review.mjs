import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {connect} from './cdp.mjs';
const c=await connect(),sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function wait(expr){for(let i=0;i<600;i++){if(await c.evaluate(expr))return;await sleep(50);}throw Error('Timeout '+expr);}
async function input(selector,value,event='change'){await c.evaluate(`{const el=document.querySelector(${JSON.stringify(selector)});el.value=${JSON.stringify(value)};el.dispatchEvent(new Event(${JSON.stringify(event)}));}`);}
try{
 await c.send('Emulation.setDeviceMetricsOverride',{width:1440,height:1100,deviceScaleFactor:1,mobile:false});
 await c.send('Page.navigate',{url:'http://127.0.0.1:4178/'});await wait('!!window.pixelPals?.getAvatar()');
 await c.evaluate(`window.__downloads=[];const original=URL.createObjectURL.bind(URL);URL.createObjectURL=blob=>{window.__downloads.push(blob);return original(blob)};HTMLAnchorElement.prototype.click=function(){};window.__avatarBefore=window.pixelPals.getAvatar();document.querySelector('[data-tab=motion]').click();document.querySelector('#background-photo-upload').closest('details').open=true;`);
 await c.evaluate(`(async()=>{const canvas=document.createElement('canvas');canvas.width=900;canvas.height=450;const ctx=canvas.getContext('2d');ctx.fillStyle='#315c85';ctx.fillRect(0,0,450,450);ctx.fillStyle='#d8b076';ctx.fillRect(450,0,450,450);const blob=await new Promise(r=>canvas.toBlob(r,'image/png')),file=new File([blob],'나의 배경.png',{type:'image/png'}),dt=new DataTransfer();dt.items.add(file);const input=document.querySelector('#background-photo-file');input.files=dt.files;input.dispatchEvent(new Event('change'));})()`);
 await wait('window.pixelPals.getState().background==="image"&&!!window.pixelPals.getState().backgroundImage');
 assert.equal(await c.evaluate('window.__avatarBefore===window.pixelPals.getAvatar()'),true,'photo upload should preserve the model');
 await input('[data-setting=backgroundImageFit]','contain');await input('[data-setting=backgroundImageY]','80','input');
 assert.equal(await c.evaluate('document.querySelector("#stage").style.backgroundSize'),'contain');
 assert.equal(await c.evaluate('document.querySelector("#stage").style.backgroundPosition'),'50% 80%');
 await c.evaluate(`document.querySelector('#save-project').click();`);await wait('window.__downloads.some(b=>b.type==="application/json")');
 await c.evaluate(`window.__saved=window.__downloads.find(b=>b.type==='application/json');document.querySelector('#background-photo-remove').click();`);assert.equal(await c.evaluate('window.pixelPals.getState().backgroundImage'),'');
 await c.evaluate(`{const dt=new DataTransfer();dt.items.add(new File([window.__saved],'photo-project.json',{type:'application/json'}));const input=document.querySelector('#project-file');input.files=dt.files;input.dispatchEvent(new Event('change'));}`);
 await wait('window.pixelPals.getState().background==="image"&&window.pixelPals.getState().backgroundImageName==="나의 배경.png"');
 await c.evaluate(`document.querySelector('#export-png-background').click();`);await wait('window.__downloads.filter(b=>b.type==="image/png").length===1');
 await c.evaluate(`document.querySelector('#export-png').click();`);await wait('window.__downloads.filter(b=>b.type==="image/png").length===2');
 const png=await c.evaluate(`(async()=>{const blobs=window.__downloads.filter(b=>b.type==='image/png'),out=[];for(const blob of blobs){const bitmap=await createImageBitmap(blob),canvas=document.createElement('canvas');canvas.width=bitmap.width;canvas.height=bitmap.height;const ctx=canvas.getContext('2d');ctx.drawImage(bitmap,0,0);out.push({width:bitmap.width,height:bitmap.height,corner:[...ctx.getImageData(8,8,1,1).data],photo:[...ctx.getImageData(8,Math.round(bitmap.height*.7),1,1).data]});bitmap.close();}return out;})()`);
 assert.deepEqual(png[0].corner,[233,224,244,255]);assert.deepEqual(png[0].photo,[49,92,133,255]);assert.equal(png[1].corner[3],0);assert.equal(png[1].photo[3],0);
 await input('[data-setting=backgroundImageFit]','cover');await input('#record-format','gif');await input('#gif-width','360');await input('#record-duration','1');await c.evaluate('document.querySelector("#record").click()');
 await wait('window.__downloads.some(b=>b.type==="image/gif")&&!window.pixelPals.getPerformance().recording');
 const gif=await c.evaluate(`(async()=>{const b=window.__downloads.find(b=>b.type==='image/gif'),decoder=new ImageDecoder({data:await b.arrayBuffer(),type:'image/gif'});await decoder.tracks.ready;const f=(await decoder.decode({frameIndex:0})).image,canvas=document.createElement('canvas');canvas.width=f.displayWidth;canvas.height=f.displayHeight;const ctx=canvas.getContext('2d');ctx.drawImage(f,0,0);return{frames:decoder.tracks.selectedTrack.frameCount,width:canvas.width,corner:[...ctx.getImageData(4,4,1,1).data],right:[...ctx.getImageData(canvas.width-5,4,1,1).data]};})()`);
 assert.equal(gif.frames,12);assert.equal(gif.width,360);for(const [a,b]of [[gif.corner,[49,92,133,255]],[gif.right,[216,176,118,255]]])a.forEach((v,i)=>assert.ok(Math.abs(v-b[i])<=3,JSON.stringify(a)));
 await input('#record-format','webm');await c.evaluate('document.querySelector("#record").click()');await wait('window.__downloads.some(b=>b.type.startsWith("video/webm"))&&!window.pixelPals.getPerformance().recording');
 const video=await c.evaluate(`(async()=>{const blob=window.__downloads.find(b=>b.type.startsWith('video/webm')),video=document.createElement('video');video.muted=true;video.style.cssText='position:fixed;width:1px;height:1px;opacity:0;pointer-events:none';video.src=URL.createObjectURL(blob);document.body.append(video);await new Promise((resolve,reject)=>{video.onloadeddata=resolve;video.onerror=reject;setTimeout(()=>reject(Error('Video load timeout')),10000);});await video.play();await new Promise(r=>setTimeout(r,350));video.pause();const canvas=document.createElement('canvas');canvas.width=video.videoWidth;canvas.height=video.videoHeight;const ctx=canvas.getContext('2d');ctx.drawImage(video,0,0);const result={width:canvas.width,corner:[...ctx.getImageData(5,5,1,1).data]};URL.revokeObjectURL(video.src);video.remove();return result;})()`);
 assert.equal(video.width,960);video.corner.forEach((v,i)=>assert.ok(Math.abs(v-[49,92,133,255][i])<=8,JSON.stringify(video)));
 const screenshot=await c.send('Page.captureScreenshot',{format:'png'});await writeFile('tests/artifacts/background-photo-ui.png',Buffer.from(screenshot.data,'base64'));
 const errors=c.events.filter(e=>e.method==='Runtime.exceptionThrown');assert.equal(errors.length,0,JSON.stringify(errors));
 const result={upload:true,modelPreserved:true,fitAndPosition:true,projectReimport:true,pngWithPhoto:true,transparentPng:true,gif,video,runtimeErrors:0};
 await writeFile('tests/artifacts/background-photo-results.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{c.close();}
