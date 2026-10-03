import assert from 'node:assert/strict';import {writeFile} from 'node:fs/promises';import {connect} from './cdp.mjs';
const c=await connect(),sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function wait(expression){for(let i=0;i<400;i++){if(await c.evaluate(expression))return;await sleep(50);}throw Error('Timed out '+expression);}
try{
 await c.send('Emulation.setDeviceMetricsOverride',{width:1440,height:1100,deviceScaleFactor:1,mobile:false});await c.send('Page.navigate',{url:'http://127.0.0.1:4178/'});await wait('!!window.pixelPals?.getAvatar()');
 const sheets=await c.evaluate(`(async()=>{
 const T=await import('./vendor/three.module.js'),{buildAvatar,defaults,disposeAvatar,poseAvatar}=await import('./avatar.js'),{clothingStyles,clothingPatch}=await import('./clothing-options.js'),{socialMotionNames}=await import('./social-motion.js'),{createStudioLighting,applyStudioLighting}=await import('./lighting.js');
 const renderer=new T.WebGLRenderer({antialias:true,alpha:false,preserveDrawingBuffer:true});renderer.setSize(300,360);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.02;
 const scene=new T.Scene();scene.background=new T.Color('#f3f0e9');const rig=createStudioLighting(scene);applyStudioLighting(rig,{...defaults,shadeStrength:.25});
 const camera=new T.OrthographicCamera(-1.48,1.48,1.776,-1.776,.1,30);camera.position.set(0,1.7,7);camera.lookAt(0,1.25,0);
 function sheet(entries,columns=6){const canvas=document.createElement('canvas');canvas.width=300*columns;canvas.height=394*Math.ceil(entries.length/columns);const ctx=canvas.getContext('2d');ctx.fillStyle='#f3f0e9';ctx.fillRect(0,0,canvas.width,canvas.height);entries.forEach(([label,patch,motion,time,side],i)=>{const a=buildAvatar({...defaults,expression:'basic',eyeColor:'#65575f',tail:'none',...patch});scene.add(a.root);poseAvatar(a,motion??'still',time??0,1);a.root.rotation.y=side??0;a.root.updateMatrixWorld(true);camera.position.set(0,motion&&motion!=='still'?3.25:1.7,7);camera.lookAt(0,motion&&motion!=='still'?1.05:1.25,0);renderer.render(scene,camera);ctx.drawImage(renderer.domElement,(i%columns)*300,Math.floor(i/columns)*394);ctx.fillStyle='#776758';ctx.font='16px sans-serif';ctx.textAlign='center';ctx.fillText(label,(i%columns)*300+150,Math.floor(i/columns)*394+382);scene.remove(a.root);disposeAvatar(a);});return canvas.toDataURL().split(',')[1];}
 const wardrobe=sheet(clothingStyles.map(s=>[s.label,clothingPatch(s.id)]));
 const props=sheet([['잠옷 + 모자',{...clothingPatch('pajamas'),sleepCap:true}],['우주복 + 헬멧',{...clothingPatch('spacesuit'),spaceHelmet:true}],['선글라스',{glasses:true,glassesStyle:'sunglasses'}],['귀 옆 더블 링',{earrings:'cuffs',earringSide:'right'}],['기타',{guitar:true}],['햄버거',{burger:true}],['노트북',{laptop:true}],['후드 옆',{...clothingPatch('hoodieUp')},'still',0,.75],['후드 뒤',{...clothingPatch('hoodieUp')},'still',0,Math.PI]],3);
 const motions=sheet(Object.entries(socialMotionNames).flatMap(([id,label])=>[[label+' / A',clothingPatch(id==='musicListen'?'hoodie':'raglan'),id,.4],[label+' / B',clothingPatch(id==='musicListen'?'hoodie':'raglan'),id,id==='highFive'?1.5:3]]));
 renderer.dispose();return{wardrobe,props,motions};})()`);
 for(const [name,data]of Object.entries(sheets))await writeFile('tests/artifacts/'+name+'-review.png',Buffer.from(data,'base64'));
 await c.evaluate(`document.querySelector('[data-tab=accessory]').click()`);await wait('[...document.querySelectorAll("[data-preview^=clothing-]")].every(img=>img.dataset.previewReady==="true")');
 assert.equal(await c.evaluate('document.querySelectorAll("[data-clothing]").length'),19);assert.equal(await c.evaluate('document.querySelectorAll("[data-motion]").length'),23);
 await c.evaluate(`document.querySelector('[data-clothing=hoodieUp]').click()`);await wait('window.pixelPals.getAvatar().root.userData.pixelPals.state.clothing==="hoodieUp"');
 await c.evaluate(`document.querySelector('[data-setting=clothingColor]').value='#769f8e';document.querySelector('[data-setting=clothingColor]').dispatchEvent(new Event('input'));document.querySelector('[data-setting=clothingColor]').dispatchEvent(new Event('change'));`);
 assert.equal(await c.evaluate('window.pixelPals.getAvatar().root.getObjectByName("GarmentTorso").material.color.getHexString()'),'769f8e');
 for(const id of ['picnicDrink','picnicEat','picnicChat','readTogether','guitarPlay','laptopWork','highFive','toast','musicListen']){
  await c.evaluate(`document.querySelector('[data-tab=motion]').click();document.querySelector('[data-motion=${id}]').click()`);await sleep(200);assert.equal(await c.evaluate('window.pixelPals.getState().motion'),id);assert.equal(await c.evaluate('document.querySelector("#stage-error").hidden'),true);
 }
 await c.evaluate(`document.querySelector('[data-tab=studio]').click();document.querySelector('#studio-add-current').click();document.querySelector('#studio-add-current').click();document.querySelector('#studio-enabled').checked=true;document.querySelector('#studio-enabled').dispatchEvent(new Event('change'));document.querySelector('[data-formation=picnic]').click();document.querySelector('#actor-motion').value='picnicEat';document.querySelector('#actor-motion').dispatchEvent(new Event('change'));`);await sleep(500);
 assert.equal((await c.evaluate('window.pixelPals.getStudio()')).actors.length,2);
 const screenshot=await c.send('Page.captureScreenshot',{format:'png'});await writeFile('tests/artifacts/studio-social-ui.png',Buffer.from(screenshot.data,'base64'));
 const errors=c.events.filter(e=>e.method==='Runtime.exceptionThrown');assert.equal(errors.length,0,JSON.stringify(errors));
 console.log(JSON.stringify({clothes:18,props:11,motions:10,wardrobePreviews:19,studioActors:2,runtimeErrors:errors.length}));
}finally{c.close();}
