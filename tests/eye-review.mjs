import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {connect} from './cdp.mjs';
const c=await connect();
try{
 await c.send('Emulation.setDeviceMetricsOverride',{width:1440,height:1180,deviceScaleFactor:1,mobile:false});
 await c.send('Page.navigate',{url:'http://127.0.0.1:4178/'});
 await new Promise(r=>setTimeout(r,1800));
 const result=await c.evaluate(`(async()=>{
  const {drawEye}=await import('./eyes.js'),{eyeOptions}=await import('./options.js');
  const s=window.pixelPals.getState(),variants=[];
  let gaps=0,ink=0,maxChannel=0;
  for(const[expression]of eyeOptions){
   const canvas=document.createElement('canvas');canvas.width=256;canvas.height=192;
   const ctx=canvas.getContext('2d');ctx.scale(2,2);for(const[x,side]of[[30,0],[92,1]])drawEye(ctx,{...s,expression},x,side);variants.push(canvas.toDataURL());
   if(expression==='glossy'){
    const p=ctx.getImageData(48,70,24,28).data;
    for(let i=0;i<p.length;i+=4){if(p[i+3]<240)gaps++;else{ink++;maxChannel=Math.max(maxChannel,p[i],p[i+1],p[i+2]);}}
   }
  }
  return{unique:new Set(variants).size,gaps,ink,maxChannel};
 })()`);
 assert.equal(result.unique,24);
 assert.ok(result.gaps>0&&result.ink>0,'pen eye must contain ink and transparent gaps');
 assert.ok(result.maxChannel<160,'pen eye must contain no bright highlights');
 const before=await c.evaluate('Array.from(window.pixelPals.getAvatar().face.geometry.attributes.position.array)');
 for(const[key,value]of [['eyeSpacing',.9],['eyeY',-.05],['eyeTilt',12],['eyeStretch',1.1]]){
  await c.evaluate(`{const input=document.querySelector('[data-setting="${key}"]');input.value=${value};input.dispatchEvent(new Event('input',{bubbles:true}));}`);
  await new Promise(r=>setTimeout(r,140));
  assert.equal(await c.evaluate(`window.pixelPals.getState().${key}`),value);
 }
 assert.deepEqual(await c.evaluate('Array.from(window.pixelPals.getAvatar().face.geometry.attributes.position.array)'),before);
 await c.evaluate('document.querySelector("#reset-character").click()');
 await new Promise(r=>setTimeout(r,200));
 const rect=await c.evaluate(`(()=>{const r=document.querySelector('#stage').getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,scale:1};})()`);
 const shot=await c.send('Page.captureScreenshot',{format:'png',clip:rect});
 await writeFile('tests/artifacts/eyes-final.png',Buffer.from(shot.data,'base64'));
 const eyeGrid=await c.evaluate(`(()=>{const p=document.querySelector('.editor-scroll')||document.querySelector('#panel-character').parentElement;const grid=document.querySelector('.expression-grid');grid.scrollIntoView({block:'center'});return true;})()`);
 assert.ok(eyeGrid);
 assert.equal(c.events.filter(e=>e.method==='Runtime.exceptionThrown').length,0);
 console.log('PASS 24 distinct eye drawings, transparent pen gaps, no highlights, four eye controls and unchanged head geometry',JSON.stringify(result));
}finally{c.close();}
