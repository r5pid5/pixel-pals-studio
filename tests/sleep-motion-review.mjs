import {writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {connect} from './cdp.mjs';
const c=await connect();
try{
 await c.send('Page.navigate',{url:'http://127.0.0.1:4178/'});await c.send('Page.bringToFront');
 for(let i=0;i<200;i++){if(await c.evaluate('!!window.pixelPals?.getAvatar()'))break;await new Promise(r=>setTimeout(r,50));}
 const result=await c.evaluate(`(async()=>{
  const T=await import('./vendor/three.module.js'),{buildAvatar,defaults,poseAvatar,disposeAvatar}=await import('./avatar.js'),{clothingPatch}=await import('./clothing-options.js'),{sleepFootprint}=await import('./sleep-motion.js'),{createStudioLighting,applyStudioLighting}=await import('./lighting.js');
  const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(480,480);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;
  const scene=new T.Scene();scene.background=new T.Color('#f4f1eb');applyStudioLighting(createStudioLighting(scene),{...defaults,shadeStrength:.35});
  const camera=new T.OrthographicCamera(-1.9,1.9,1.9,-1.9,.1,30),pages=[],checks=[];
  for(const motion of['sleepSprawl','sleepProne']){
   const sheet=document.createElement('canvas');sheet.width=1440;sheet.height=1530;const ctx=sheet.getContext('2d');ctx.fillStyle='#f4f1eb';ctx.fillRect(0,0,sheet.width,sheet.height);
   let row=0;
   for(const[clothing,head,body,legs]of[['pajamas',1,1.2,1],['hoodieUp',.75,.75,.65],['uniform',1.3,1.35,1.45]]){
    const a=buildAvatar({...defaults,...clothingPatch(clothing),head,body,legs,tail:'none',speed:1});scene.add(a.root);poseAvatar(a,motion,0,1);const f=sleepFootprint(a),extent=f.radius*2.3;
    camera.left=-extent/2;camera.right=extent/2;camera.top=extent/2;camera.bottom=-extent/2;camera.updateProjectionMatrix();
    for(let view=0;view<3;view++){
     poseAvatar(a,motion,view*1.5,1);camera.position.set(...[[f.x,7,f.z+.001],[f.x+3,4,f.z+5],[f.x+5,1.1,f.z+.1]][view]);camera.lookAt(f.x,.20,f.z);renderer.render(scene,camera);
     ctx.drawImage(renderer.domElement,view*480,row*510);ctx.fillStyle='#776b61';ctx.font='18px sans-serif';ctx.textAlign='center';ctx.fillText((motion==='sleepSprawl'?'대자로 자기':'엎드려 자기')+' · '+clothing+' · '+['위','비스듬히','옆'][view],view*480+240,row*510+496);
    }
    checks.push({motion,clothing,footprint:f,head,body,legs});scene.remove(a.root);disposeAvatar(a);row++;
   }
   pages.push(sheet.toDataURL('image/png'));
  }
  renderer.dispose();return{pages,checks};
 })()`);
 for(let i=0;i<result.pages.length;i++)await writeFile(new URL('./artifacts/sleep-motion-20261004-'+i+'.png',import.meta.url),Buffer.from(result.pages[i].split(',')[1],'base64'));
 assert.equal(result.checks.length,6);assert.equal(c.events.filter(e=>e.method==='Runtime.exceptionThrown').length,0);
 console.log(JSON.stringify({checks:result.checks,renders:18,exceptions:0}));
}finally{c.close();}
