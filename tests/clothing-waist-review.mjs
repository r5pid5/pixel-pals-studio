import {writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {connect} from './cdp.mjs';
const tag=process.argv.find(v=>v.startsWith('--tag='))?.slice(6)??'before';
assert.match(tag,/^[a-z0-9-]+$/);
const c=await connect();
try{
 await c.send('Page.navigate',{url:'http://127.0.0.1:4178/'});
 for(let i=0;i<200;i++){if(await c.evaluate('!!window.pixelPals?.getAvatar()'))break;await new Promise(r=>setTimeout(r,50));}
 const images=await c.evaluate(`(async()=>{
  const T=await import('./vendor/three.module.js'),{buildAvatar,defaults,poseAvatar,disposeAvatar}=await import('./avatar.js'),{clothingStyles,clothingPatch}=await import('./clothing-options.js'),{createStudioLighting,applyStudioLighting}=await import('./lighting.js');
  const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(320,320);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;
  const scene=new T.Scene();scene.background=new T.Color('#f3f0e9');applyStudioLighting(createStudioLighting(scene),{...defaults,shadeStrength:.4});
  const camera=new T.OrthographicCamera(-.58,.58,.58,-.58,.1,30),pages=[];
  function shot(a,angle,below){a.root.rotation.y=angle;camera.position.set(0,below?-2.3:1.1,6);camera.lookAt(0,.44,0);camera.updateProjectionMatrix();renderer.render(scene,camera);}
  for(let page=0;page<3;page++){
   const canvas=document.createElement('canvas');canvas.width=960;canvas.height=2100;const ctx=canvas.getContext('2d');ctx.fillStyle='#f3f0e9';ctx.fillRect(0,0,canvas.width,canvas.height);
   for(let row=0;row<6;row++){
    const style=clothingStyles[page*6+row],a=buildAvatar({...defaults,...clothingPatch(style.id),tail:'none',motion:'still'});scene.add(a.root);poseAvatar(a,'still',0);
    for(let col=0;col<3;col++){shot(a,[0,1.2,Math.PI][col],true);ctx.drawImage(renderer.domElement,col*320,row*350);ctx.fillStyle='#776758';ctx.font='16px sans-serif';ctx.textAlign='center';ctx.fillText(style.label+' · 아래 '+['정면','옆','뒤'][col],col*320+160,row*350+340);}
    scene.remove(a.root);disposeAvatar(a);
   }pages.push(canvas.toDataURL().split(',')[1]);
  }
  renderer.setSize(400,400);camera.left=-.5;camera.right=.5;camera.top=.5;camera.bottom=-.5;
  const canvas=document.createElement('canvas');canvas.width=1600;canvas.height=450;const ctx=canvas.getContext('2d');ctx.fillStyle='#f3f0e9';ctx.fillRect(0,0,canvas.width,canvas.height);
  for(let i=0;i<4;i++){const kind=i<2?'overalls':'uniform',a=buildAvatar({...defaults,...clothingPatch(kind),tail:'none',motion:'still'});scene.add(a.root);poseAvatar(a,'still',0);shot(a,0,i%2===1);ctx.drawImage(renderer.domElement,i*400,0);ctx.fillStyle='#776758';ctx.font='18px sans-serif';ctx.textAlign='center';ctx.fillText((kind==='overalls'?'멜빵옷':'교복')+' · '+(i%2?'아래':'정면'),i*400+200,432);scene.remove(a.root);disposeAvatar(a);}
  pages.push(canvas.toDataURL().split(',')[1]);renderer.dispose();renderer.forceContextLoss();return pages;
 })()`);
 for(let i=0;i<images.length;i++)await writeFile('tests/artifacts/clothing-waist-'+tag+'-'+i+'.png',Buffer.from(images[i],'base64'));
 assert.equal(c.events.filter(e=>e.method==='Runtime.exceptionThrown').length,0);
 console.log('54 below/front/side/back clothing views + 4 waist closeups; exceptions: 0; tag='+tag);
}finally{c.close();}
