import {writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {connect} from './cdp.mjs';
const c=await connect();
try{
 await c.send('Page.navigate',{url:'http://127.0.0.1:4178/'});
 for(let i=0;i<200;i++){if(await c.evaluate('!!window.pixelPals?.getAvatar()'))break;await new Promise(r=>setTimeout(r,50));}
 const pages=await c.evaluate(`(async()=>{
  const T=await import('./vendor/three.module.js'),{buildAvatar,defaults,poseAvatar,disposeAvatar}=await import('./avatar.js'),{clothingPatch}=await import('./clothing-options.js'),{createStudioLighting,applyStudioLighting}=await import('./lighting.js');
  const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(360,360);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;
  const scene=new T.Scene();scene.background=new T.Color('#f3f0e9');applyStudioLighting(createStudioLighting(scene),{...defaults,shadeStrength:.4});
  const camera=new T.OrthographicCamera(-.65,.65,.65,-.65,.1,30),pages=[];
  for(const kind of['overalls','uniform'])for(const[body,legs]of[[.75,.65],[1.2,1],[1.35,1.45]]){
   const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=2400;const ctx=canvas.getContext('2d');ctx.fillStyle='#f3f0e9';ctx.fillRect(0,0,canvas.width,canvas.height);
   ctx.fillStyle='#776758';ctx.font='20px sans-serif';ctx.textAlign='center';ctx.fillText((kind==='overalls'?'멜빵옷':'교복')+' · 몸통 '+body+' · 다리 '+legs,540,30);
   const a=buildAvatar({...defaults,...clothingPatch(kind),body,legs,tail:'none'});scene.add(a.root);
   const poses=[['정지','still',0],['걷기 A','walk',.4],['걷기 B','walk',1],['춤','dance',.4],['앉아 차 마시기','picnicDrink',3],['앉아 읽기','readTogether',3]];
   for(let row=0;row<poses.length;row++){
    const[label,motion,time]=poses[row];poseAvatar(a,motion,time);a.root.traverse(o=>{if(o.userData.motionProp)o.visible=false;});const focus=.44+(1.54/5.2)*(legs-1)-(['picnicDrink','readTogether'].includes(motion)?.175+(1.54/5.2)*(legs-1)*.6:0);
    for(let col=0;col<3;col++){a.root.rotation.y=[0,1.2,Math.PI][col];camera.position.set(0,focus-2.6,6);camera.lookAt(0,focus,.04);camera.updateProjectionMatrix();renderer.render(scene,camera);ctx.drawImage(renderer.domElement,col*360,45+row*390);ctx.fillStyle='#776758';ctx.font='17px sans-serif';ctx.textAlign='center';ctx.fillText(label+' · 아래 '+['정면','옆','뒤'][col],col*360+180,45+row*390+379);}
   }scene.remove(a.root);disposeAvatar(a);pages.push(canvas.toDataURL().split(',')[1]);
  }renderer.dispose();renderer.forceContextLoss();return pages;
 })()`);
 for(let i=0;i<pages.length;i++)await writeFile('tests/artifacts/clothing-waist-motion-20261003-'+i+'.png',Buffer.from(pages[i],'base64'));
 assert.equal(c.events.filter(e=>e.method==='Runtime.exceptionThrown').length,0);console.log('108 below-angle renders across small/default/large bodies, walking/dancing/seated poses; exceptions: 0');
}finally{c.close();}
