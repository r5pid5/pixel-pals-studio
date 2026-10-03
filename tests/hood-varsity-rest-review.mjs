import {writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {connect} from './cdp.mjs';
const before=process.argv.includes('--before'),c=await connect();
try{
 await c.send('Page.navigate',{url:'http://127.0.0.1:4178/'});
 for(let i=0;i<200;i++){if(await c.evaluate('!!window.pixelPals?.getAvatar()'))break;await new Promise(r=>setTimeout(r,50));}
 const result=await c.evaluate(`(async()=>{
  const T=await import('./vendor/three.module.js'),{buildAvatar,defaults,poseAvatar,disposeAvatar}=await import('./avatar.js'),{clothingPatch}=await import('./clothing-options.js'),{createStudioLighting,applyStudioLighting}=await import('./lighting.js');
  const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(420,430);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;
  const scene=new T.Scene();scene.background=new T.Color('#f3f0e9');applyStudioLighting(createStudioLighting(scene),{...defaults,shadeStrength:.4});
  const camera=new T.OrthographicCamera(-1.38,1.38,1.413,-1.413,.1,30),canvas=document.createElement('canvas');canvas.width=1680;canvas.height=1422;const ctx=canvas.getContext('2d');ctx.fillStyle='#f3f0e9';ctx.fillRect(0,0,canvas.width,canvas.height);
  const entries=[
   ['후드 · 위에서 정면','hoodieUp','still',0,'above',0],['후드 · 바로 위','hoodieUp','still',0,'top',0],['후드 · 위에서 뒤','hoodieUp','still',Math.PI,'above',0],['후드 · 책 읽기','hoodieUp','readTogether',0,'above',1.5],
   ['야구점퍼 · 정면','varsity','still',0,'body',0],['야구점퍼 · 옆','varsity','still',1.2,'body',0],['야구점퍼 · 팔 들기','varsity','highFive',.35,'body',1.5],['앞치마 · 기본 모션','apron','float',0,'body',1.5],
   ['옷 없음 · 기본 자세','none','still',0,'body',0],['후드티 · 기본 자세','hoodie','still',0,'body',0],['후드티 · 책 읽기','hoodie','readTogether',.2,'body',1.5],['후드티 · 한 모금','hoodie','picnicDrink',.2,'body',3]
  ];
  for(let i=0;i<entries.length;i++){
   const[label,kind,motion,angle,view,time]=entries[i],a=buildAvatar({...defaults,...clothingPatch(kind),tail:'none',hoodEarMode:'outside',expression:'basic'});scene.add(a.root);poseAvatar(a,motion,time);a.root.rotation.y=angle;
   if(view==='above'){camera.left=-1.30;camera.right=1.30;camera.top=1.331;camera.bottom=-1.331;camera.position.set(0,6,4.6);camera.up.set(0,1,0);camera.lookAt(0,1.4,0);}
   else if(view==='top'){camera.left=-1.30;camera.right=1.30;camera.top=1.331;camera.bottom=-1.331;camera.position.set(0,8,0);camera.up.set(0,0,-1);camera.lookAt(0,1.4,0);}
   else{camera.left=-.75;camera.right=.75;camera.top=.768;camera.bottom=-.768;camera.position.set(0,1.15,5);camera.up.set(0,1,0);camera.lookAt(0,.66,0);}
   camera.updateProjectionMatrix();renderer.render(scene,camera);ctx.drawImage(renderer.domElement,i%4*420,Math.floor(i/4)*474);ctx.fillStyle='#776758';ctx.font='20px sans-serif';ctx.textAlign='center';ctx.fillText(label,i%4*420+210,Math.floor(i/4)*474+459);scene.remove(a.root);disposeAvatar(a);
  }
  renderer.dispose();renderer.forceContextLoss();return canvas.toDataURL().split(',')[1];
 })()`);
 await writeFile(before?'tests/artifacts/hood-varsity-rest-before.png':'docs/hood-varsity-rest-fix.png',Buffer.from(result,'base64'));
 assert.equal(c.events.filter(e=>e.method==='Runtime.exceptionThrown').length,0);console.log('12 real WebGL crown, sleeves, resting arms and held-prop views; browser exceptions: 0');
}finally{c.close();}
