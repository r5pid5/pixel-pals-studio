import {writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {connect} from './cdp.mjs';
const c=await connect(),before=process.argv.includes('--before');
try{
 await c.send('Page.navigate',{url:'http://127.0.0.1:4178/'});await c.send('Page.bringToFront');
 for(let i=0;i<200;i++){if(await c.evaluate('!!window.pixelPals?.getAvatar()'))break;await new Promise(r=>setTimeout(r,50));}
 const result=await c.evaluate(`(async()=>{
  const T=await import('./vendor/three.module.js'),{buildAvatar,defaults,disposeAvatar}=await import('./avatar.js'),{clothingPatch}=await import('./clothing-options.js'),{createStudioLighting,applyStudioLighting}=await import('./lighting.js');
  const s={...defaults,species:'puppy',bodyColor:'#424342',oddEyes:true,eyeColor:'#202322',rightEyeColor:'#78acb8',independentEyes:true,expression:'shy',rightExpression:'shy',muzzle:true,head:1.1,sleepCapColor:'#d6d9e5',...clothingPatch('spacesuit')};
  const first=buildAvatar({...s,sleepCap:true});disposeAvatar(first);
  const a=buildAvatar({...s,...clothingPatch('pajamas'),sleepCap:true}),pom=a.root.getObjectByName('SleepCapPom');
  const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(480,520);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;
  const scene=new T.Scene();scene.background=new T.Color('#f3f0e9');scene.add(a.root);applyStudioLighting(createStudioLighting(scene),{...defaults,shadeStrength:.35});
  const camera=new T.OrthographicCamera(-1.65,1.65,1.788,-1.788,.1,30),sheet=document.createElement('canvas');sheet.width=960;sheet.height=560;const ctx=sheet.getContext('2d');ctx.fillStyle='#f3f0e9';ctx.fillRect(0,0,960,560);
  for(let i=0;i<2;i++){camera.position.set(...[[0,1.65,7],[5,1.8,3]][i]);camera.lookAt(0,1.55,0);renderer.render(scene,camera);ctx.drawImage(renderer.domElement,i*480,0);ctx.fillStyle='#776b61';ctx.font='20px sans-serif';ctx.textAlign='center';ctx.fillText('우주복 → 잠옷모자 · '+['정면','옆'][i],i*480+240,545);}
  const box=new T.Box3().setFromObject(pom),size=box.getSize(new T.Vector3()).toArray(),scale=pom.scale.toArray();disposeAvatar(a);renderer.dispose();return{png:sheet.toDataURL(),size,scale};
 })()`);
 await writeFile(new URL('./artifacts/sleep-cap-cache-'+(before?'before':'fixed')+'-20261004.png',import.meta.url),Buffer.from(result.png.split(',')[1],'base64'));
 if(!before){assert.ok(result.size.every(x=>x<.20),JSON.stringify(result.size));assert.ok(result.scale.every(x=>Math.abs(x-.07)<1e-8));}
 console.log(JSON.stringify({before,size:result.size,pomScale:result.scale,exceptions:c.events.filter(e=>e.method==='Runtime.exceptionThrown').length}));
}finally{c.close();}
