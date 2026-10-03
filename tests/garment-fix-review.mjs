import {writeFile} from 'node:fs/promises';import {connect} from './cdp.mjs';import assert from 'node:assert/strict';
const c=await connect();try{
 await c.send('Page.navigate',{url:'http://127.0.0.1:4178/'});for(let i=0;i<200;i++){if(await c.evaluate('!!window.pixelPals?.getAvatar()'))break;await new Promise(r=>setTimeout(r,50));}
 const result=await c.evaluate(`(async()=>{
 const T=await import('./vendor/three.module.js'),{buildAvatar,defaults,poseAvatar,disposeAvatar}=await import('./avatar.js'),{clothingPatch}=await import('./clothing-options.js'),{createStudioLighting,applyStudioLighting}=await import('./lighting.js');
 const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;const scene=new T.Scene();scene.background=new T.Color('#f3f0e9');const rig=createStudioLighting(scene);applyStudioLighting(rig,{...defaults,shadeStrength:.35});
 const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=1060;const ctx=canvas.getContext('2d');ctx.fillStyle='#f3f0e9';ctx.fillRect(0,0,1200,1060);
 for(const[column,kind,motion,angle]of[[0,'uniform','still',.25],[1,'hoodie','picnicDrink',.35]]){const a=buildAvatar({...defaults,...clothingPatch(kind),tail:'none'});scene.add(a.root);poseAvatar(a,motion,3);a.root.rotation.y=angle;
 renderer.setSize(600,680);const camera=new T.OrthographicCamera(-1.29,1.29,1.462,-1.462,.1,30);camera.position.set(0,2.05,6);camera.lookAt(0,1.31,0);renderer.render(scene,camera);ctx.drawImage(renderer.domElement,column*600,0);
 renderer.setSize(600,310);const close=new T.OrthographicCamera(-.73,.73,.377,-.377,.1,30);close.position.set(0,1.25,5);close.lookAt(0,kind==='uniform'?.47:.40,.1);renderer.render(scene,close);ctx.drawImage(renderer.domElement,column*600,710);
 ctx.fillStyle='#776758';ctx.font='24px sans-serif';ctx.textAlign='center';ctx.fillText(kind==='uniform'?'교복 · 어깨와 조끼 가장자리':'한 모금 · 왼손은 무릎 위에',column*600+300,1046);scene.remove(a.root);disposeAvatar(a);}renderer.dispose();return canvas.toDataURL().split(',')[1];})()`);
 await writeFile('docs/garment-fix.png',Buffer.from(result,'base64'));assert.equal(c.events.filter(e=>e.method==='Runtime.exceptionThrown').length,0);console.log('Uniform and picnic pose: full and close renders saved; runtime exceptions: 0');
}finally{c.close();}
