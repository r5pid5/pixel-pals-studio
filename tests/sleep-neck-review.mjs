import {writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {connect} from './cdp.mjs';
const c=await connect(),stage=process.argv[2]==='before'?'before':'fixed';
try{
 await c.send('Page.navigate',{url:'http://127.0.0.1:4178/'});await c.send('Page.bringToFront');for(let i=0;i<200;i++){if(await c.evaluate('!!window.pixelPals?.getAvatar()'))break;await new Promise(r=>setTimeout(r,50));}
 const result=await c.evaluate(`(async()=>{
  const T=await import('./vendor/three.module.js'),{buildAvatar,defaults,poseAvatar,disposeAvatar}=await import('./avatar.js'),{clothingPatch}=await import('./clothing-options.js'),{sleepFootprint}=await import('./sleep-motion.js'),{createStudioLighting,applyStudioLighting}=await import('./lighting.js');
  const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(480,380);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;const scene=new T.Scene();scene.background=new T.Color('#f4f1eb');applyStudioLighting(createStudioLighting(scene),{...defaults,shadeStrength:.45});const camera=new T.OrthographicCamera(-.82,.82,.65,-.65,.1,30),pages=[],checks=[];
  for(const motion of['sleepSprawl','sleepProne']){
   const sheet=document.createElement('canvas');sheet.width=1440;sheet.height=1260;const ctx=sheet.getContext('2d');ctx.fillStyle='#f4f1eb';ctx.fillRect(0,0,1440,1260);
   let row=0;for(const[clothing,head,body,legs]of[['none',1,1.2,1],['none',1.3,.75,.65],['pajamas',1,1.2,1]]){
    const a=buildAvatar({...defaults,...clothingPatch(clothing),head,body,legs,bodyColor:'#e7a01b',eyeColor:'#443d41',tail:'curl',speed:1});scene.add(a.root);
    for(let view=0;view<3;view++){poseAvatar(a,motion,view*1.5,1);const target=new T.Vector3(0,.35,-.43);camera.position.copy(target).add(new T.Vector3(...[[-5,.05,0],[-5,2,.9],[0,5,0.01]][view]));camera.lookAt(target);renderer.render(scene,camera);ctx.drawImage(renderer.domElement,view*480,row*420);ctx.fillStyle='#776b61';ctx.font='18px sans-serif';ctx.textAlign='center';ctx.fillText((motion==='sleepProne'?'엎드려':'대자로')+' · '+clothing+' · '+['옆','위 옆','위'][view],view*480+240,row*420+405);}
    checks.push({motion,clothing,head,body,legs,footprint:sleepFootprint(a)});scene.remove(a.root);disposeAvatar(a);row++;
   }pages.push(sheet.toDataURL().split(',')[1]);
  }renderer.dispose();return{pages,checks};
 })()`);
 for(let i=0;i<result.pages.length;i++)await writeFile('tests/artifacts/sleep-neck-'+stage+'-20261004-'+i+'.png',Buffer.from(result.pages[i],'base64'));assert.equal(c.events.filter(e=>e.method==='Runtime.exceptionThrown').length,0);console.log(JSON.stringify({stage,checks:result.checks,views:18,exceptions:0}));
}finally{c.close();}
