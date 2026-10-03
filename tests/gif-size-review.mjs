import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {connect} from './cdp.mjs';
const c=await connect(),sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function wait(exp){for(let i=0;i<400;i++){if(await c.evaluate(exp))return;await sleep(50);}throw Error('Timeout '+exp);}
try{
 await c.send('Emulation.setDeviceMetricsOverride',{width:1440,height:1180,deviceScaleFactor:1,mobile:false});
 await c.send('Page.navigate',{url:'http://127.0.0.1:4178/'});await wait('!!window.pixelPals?.getAvatar()');c.events.length=0;
 assert.equal(await c.evaluate('document.querySelector("#gif-width").value'),'720');
 assert.deepEqual(await c.evaluate('[...document.querySelector("#gif-width").options].map(o=>Number(o.value))'),[360,540,720,960]);
 await c.evaluate(`document.querySelector('[data-tab=motion]').click();const fmt=document.querySelector('#record-format');fmt.value='gif';fmt.dispatchEvent(new Event('change'));document.querySelector('#record-duration').value='1';window.__gifs=[];window.__renderWidths=[];const r=window.pixelPals.getRenderer(),render=r.render.bind(r);r.render=(...args)=>{if(window.pixelPals.getPerformance().recording)window.__renderWidths.push(r.domElement.width);return render(...args);};const original=URL.createObjectURL.bind(URL);URL.createObjectURL=blob=>{if(blob.type==='image/gif')window.__gifs.push(blob);return original(blob);};HTMLAnchorElement.prototype.click=function(){window.__gifName=this.download;};`);
 assert.equal(await c.evaluate('document.querySelector("#gif-size-options").hidden'),false);
 const viewport=await c.evaluate('[window.pixelPals.getRenderer().domElement.width,window.pixelPals.getRenderer().domElement.height]'),results=[];
 for(const width of[360,720,960]){
  const count=results.length;
  await c.evaluate(`{const e=document.querySelector('#gif-width');e.value='${width}';e.dispatchEvent(new Event('change'));document.querySelector('#record').click();}`);
  await wait('window.__gifs.length>'+count);await wait('!window.pixelPals.getPerformance().recording');
  const file=await c.evaluate(`(async()=>{const blob=window.__gifs[${count}],bytes=new Uint8Array(await blob.arrayBuffer()),decoder=new ImageDecoder({data:bytes,type:'image/gif'});await decoder.tracks.ready;const first=await decoder.decode({frameIndex:0}),last=await decoder.decode({frameIndex:6}),canvas=document.createElement('canvas');canvas.width=32;canvas.height=32;const ctx=canvas.getContext('2d');ctx.drawImage(first.image,0,0,32,32);const a=ctx.getImageData(0,0,32,32).data;ctx.clearRect(0,0,32,32);ctx.drawImage(last.image,0,0,32,32);const b=ctx.getImageData(0,0,32,32).data;let changed=0;for(let i=0;i<a.length;i++)if(Math.abs(a[i]-b[i])>5)changed++;first.image.close();last.image.close();decoder.close();let text='';for(let i=0;i<bytes.length;i+=8192)text+=String.fromCharCode(...bytes.subarray(i,i+8192));return{width:bytes[6]+bytes[7]*256,height:bytes[8]+bytes[9]*256,changed,bytes:bytes.length,data:btoa(text)};})()`);
  assert.equal(file.width,width);assert.equal(file.height,Math.round(width*viewport[1]/viewport[0]));assert.ok(file.changed>10);
  assert.deepEqual(await c.evaluate('[window.pixelPals.getRenderer().domElement.width,window.pixelPals.getRenderer().domElement.height]'),viewport);
  assert.equal(await c.evaluate(`window.__renderWidths.includes(${width})`),true);
  await writeFile('tests/artifacts/size-'+width+'.gif',Buffer.from(file.data,'base64'));results.push({...file,data:undefined});
 }
 // Confirm the studio controls while the main scene is paused.
 await c.evaluate(`if(window.pixelPals.getPerformance().running)document.querySelector('#play').click();document.querySelector('[data-tab=studio]').click();document.querySelector('#studio-add-current').click();document.querySelector('#studio-add-current').click();document.querySelector('#studio-enabled').click();const x=document.querySelector('[data-actor-range=x]');x.value='1.85';x.dispatchEvent(new Event('input'));`);
 assert.equal(await c.evaluate('window.pixelPals.getStudio().actors[1].x'),1.85);assert.equal(await c.evaluate('window.pixelPals.getAvatar().root.visible'),false);
 const scene=await c.evaluate(`(()=>{const a=window.pixelPals.getAvatar();let s=a.root;while(s.parent)s=s.parent;return s.children.filter(o=>o.type==='Group'&&o.children.some(c=>c!==a.root&&c.name===a.root.name)).map(o=>({x:o.position.x,visible:o.visible}));})()`);
 assert.equal(scene.length,2);assert.ok(scene.some(a=>Math.abs(a.x-1.85)<.001&&a.visible));
 assert.equal(c.events.filter(e=>e.method==='Runtime.exceptionThrown').length,0);
 await writeFile('tests/artifacts/gif-size-results.json',JSON.stringify({sizes:results,studioControls:true,errors:0},null,2));console.log('PASS GIF native dimensions and decoded moving frames',results,'studio controls');
}finally{c.close();}
