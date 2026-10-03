import {writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {connect} from './cdp.mjs';
const c=await connect(),stage=process.argv[2]==='before'?'before':'fixed';
try{
 await c.send('Page.navigate',{url:'http://127.0.0.1:4178/'});await c.send('Page.bringToFront');for(let i=0;i<200;i++){if(await c.evaluate('!!window.pixelPals?.getAvatar()'))break;await new Promise(r=>setTimeout(r,50));}
 const result=await c.evaluate(`(async()=>{
  const T=await import('./vendor/three.module.js'),{buildAvatar,defaults,poseAvatar,disposeAvatar}=await import('./avatar.js'),{clothingPatch}=await import('./clothing-options.js'),{createStudioLighting,applyStudioLighting}=await import('./lighting.js');
  const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(400,510);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;const scene=new T.Scene();scene.background=new T.Color('#f4f1eb');applyStudioLighting(createStudioLighting(scene),{...defaults,shadeStrength:.45});const camera=new T.OrthographicCamera(-1.4,1.4,1.785,-1.785,.1,30),pages=[],checks=[];
  for(const[motion,label]of[['highFive','하이파이브'],['toast','건배'],['picnicDrink','한 모금'],['picnicEat','김밥'],['picnicChat','도란도란']]){
   const sheet=document.createElement('canvas');sheet.width=1600;sheet.height=1100;const ctx=sheet.getContext('2d');ctx.fillStyle='#f4f1eb';ctx.fillRect(0,0,1600,1100);
   let row=0;for(const clothing of['none','hoodie']){
    const a=buildAvatar({...defaults,...clothingPatch(clothing),bodyColor:'#e7a01b',eyeColor:'#443d41',tail:'none',dessertBase:'castella-strawberry',dessertBaseHeight:1.9,speed:1});scene.add(a.root);
    for(let view=0;view<4;view++){const t=[0,1.5,3,4.5][view];poseAvatar(a,motion,t,1);const target=new T.Vector3(0,1.55,0);camera.position.copy(target).add(new T.Vector3(...(view===3?[4,1.3,3]:[0,.65,5])));camera.lookAt(target);renderer.render(scene,camera);ctx.drawImage(renderer.domElement,view*400,row*550);ctx.fillStyle='#776b61';ctx.font='18px sans-serif';ctx.textAlign='center';ctx.fillText(label+' · '+clothing+' · '+t+'초'+(view===3?' 옆':''),view*400+200,row*550+537);}
    checks.push({motion,clothing,height:a.dessertBaseHeight});scene.remove(a.root);disposeAvatar(a);row++;
   }pages.push(sheet.toDataURL().split(',')[1]);
  }renderer.dispose();return{pages,checks};
 })()`);
 for(let i=0;i<result.pages.length;i++)await writeFile('tests/artifacts/pedestal-social-'+stage+'-20261004-'+i+'.png',Buffer.from(result.pages[i],'base64'));assert.equal(c.events.filter(e=>e.method==='Runtime.exceptionThrown').length,0);console.log(JSON.stringify({stage,checks:result.checks,views:40,exceptions:0}));
}finally{c.close();}
