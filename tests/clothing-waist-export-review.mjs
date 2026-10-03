import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {connect} from './cdp.mjs';
const c=await connect();const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function wait(expression){for(let i=0;i<800;i++){if(await c.evaluate(expression))return;await sleep(40);}throw Error('Timeout '+expression);}
try{
 await c.send('Page.navigate',{url:'http://127.0.0.1:4178/'});await c.send('Page.bringToFront');await wait('!!window.pixelPals?.getAvatar()');
 await c.evaluate(`window.__waistDownloads=[];const original=URL.createObjectURL.bind(URL);URL.createObjectURL=blob=>{window.__waistDownloads.push(blob);return original(blob)};HTMLAnchorElement.prototype.click=function(){};document.querySelector('[data-tab=accessory]').click();`);
 await wait(`[...document.querySelectorAll('[data-preview^=clothing-]')].every(img=>img.dataset.previewReady==='true')`);
 const reports=[];
 for(const kind of['overalls','uniform']){
  await c.evaluate(`document.querySelector('[data-clothing=${kind}]').click();document.querySelector('[data-tab=motion]').click();document.querySelector('[data-motion=readTogether]').click();document.querySelector('#save-project').click();`);
  const saved=await c.evaluate(`(async()=>JSON.parse(await window.__waistDownloads.filter(b=>b.type==='application/json').at(-1).text()))()`);assert.equal(saved.state.clothing,kind);assert.equal(saved.state.motion,'readTogether');
  await c.evaluate(`document.querySelector('#export-glb').click()`);await wait(`window.__waistDownloads.filter(b=>b.type==='model/gltf-binary').length===${reports.length+1}`);
  const glb=await c.evaluate(`(async()=>{const blob=window.__waistDownloads.filter(b=>b.type==='model/gltf-binary').at(-1),buffer=await blob.arrayBuffer(),view=new DataView(buffer);if(view.getUint32(0,true)!==0x46546c67||view.getUint32(4,true)!==2||view.getUint32(8,true)!==buffer.byteLength)throw Error('Invalid glTF container');const json=JSON.parse(new TextDecoder().decode(new Uint8Array(buffer,20,view.getUint32(12,true))));return{bytes:buffer.byteLength,meshes:json.meshes.length,skins:json.skins.length,joints:json.skins[0].joints.length,clothing:window.pixelPals.getAvatar().root.userData.pixelPals.state.clothing,vertices:json.accessors[json.meshes[0].primitives[0].attributes.POSITION].count,allSkinned:json.meshes.every(m=>m.primitives.every(p=>p.attributes.JOINTS_0!==undefined&&p.attributes.WEIGHTS_0!==undefined))};})()`);assert.equal(glb.joints,22);assert.equal(glb.clothing,kind,'export immediately after equipping must flush the pending model');assert.ok(glb.allSkinned);assert.ok(glb.bytes>100000);
  await c.evaluate(`document.querySelector('[data-tab=accessory]').click();document.querySelector('[data-clothing=none]').click()`);await wait(`window.pixelPals.getAvatar().root.userData.pixelPals.state.clothing==='none'`);
  await c.evaluate(`{const dt=new DataTransfer();dt.items.add(new File([window.__waistDownloads.filter(b=>b.type==='application/json').at(-1)],'waist-project.json',{type:'application/json'}));const input=document.querySelector('#project-file');input.files=dt.files;input.dispatchEvent(new Event('change'));}`);
  await wait(`window.pixelPals.getAvatar().root.userData.pixelPals.state.clothing==='${kind}'`);assert.equal(await c.evaluate(`!!window.pixelPals.getAvatar().root.getObjectByName('${kind==='overalls'?'OverallShell':'GarmentTrousers'}')`),true);reports.push({kind,...glb,projectRoundtrip:true});
 }
 assert.equal(c.events.filter(e=>e.method==='Runtime.exceptionThrown').length,0);await writeFile('tests/artifacts/clothing-waist-exports-20261003.json',JSON.stringify(reports,null,2));console.log(JSON.stringify({reports,exceptions:0}));
}finally{c.close();}
