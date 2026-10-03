import {writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {connect} from './cdp.mjs';
const c=await connect();
try{
 await c.send('Page.navigate',{url:'http://127.0.0.1:4178/'});await c.send('Page.bringToFront');
 for(let i=0;i<200;i++){if(await c.evaluate('!!window.pixelPals?.getAvatar()'))break;await new Promise(r=>setTimeout(r,50));}
 const result=await c.evaluate(`(async()=>{
  const T=await import('./vendor/three.module.js'),{buildAvatar,defaults,poseAvatar,disposeAvatar}=await import('./avatar.js'),{dessertFamilies,dessertBaseOptions,creamOptions}=await import('./dessert-options.js'),{createDessertBase}=await import('./dessert-bases.js'),{createStudioLighting,applyStudioLighting}=await import('./lighting.js');
  const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(400,360);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;
  const scene=new T.Scene();scene.background=new T.Color('#f4f1eb');applyStudioLighting(createStudioLighting(scene),{...defaults,shadeStrength:.65});
  const camera=new T.OrthographicCamera(-1.1,1.1,.99,-.99,.1,30),pages=[],checks=[];
  for(const[family]of dessertFamilies){
   const sheet=document.createElement('canvas');sheet.width=1600;sheet.height=810;const ctx=sheet.getContext('2d');ctx.fillStyle='#f4f1eb';ctx.fillRect(0,0,1600,810);
   let column=0;for(const choice of dessertBaseOptions.filter(x=>x.family===family)){
    const g=createDessertBase({...defaults,dessertBase:choice.id});scene.add(g);
    for(let view=0;view<2;view++){
     camera.position.set(...[[1.5,2.2,3],[0,g.userData.supportHeight*.55,4]][view]);camera.lookAt(0,g.userData.supportHeight*.55,0);renderer.render(scene,camera);ctx.drawImage(renderer.domElement,column*400,view*400);
     ctx.fillStyle='#776b61';ctx.font='19px sans-serif';ctx.textAlign='center';ctx.fillText(choice.label+' · '+['비스듬히','단면'][view],column*400+200,view*400+383);
    }
    checks.push({id:choice.id,meshes:g.children.length,vertices:g.children.reduce((n,m)=>n+m.geometry.attributes.position.count,0),supportHeight:g.userData.supportHeight});scene.remove(g);disposeAvatar({root:g});column++;
   }pages.push(sheet.toDataURL());
  }
  renderer.setSize(400,550);camera.left=-1.60;camera.right=1.60;camera.top=2.2;camera.bottom=-2.2;camera.updateProjectionMatrix();
  const creamSheet=document.createElement('canvas');creamSheet.width=1600;creamSheet.height=600;const ctx=creamSheet.getContext('2d');ctx.fillStyle='#f4f1eb';ctx.fillRect(0,0,1600,600);
  let column=0;for(const[whippedCream,label]of creamOptions.filter(x=>x[0]!=='none')){
   const a=buildAvatar({...defaults,whippedCream,dessertBase:'cake-strawberry',clothing:'pajamas',tail:'none',motion:'still'});poseAvatar(a,'still',0);scene.add(a.root);camera.position.set(1.2,2.5,7);camera.lookAt(0,1.75,0);renderer.render(scene,camera);ctx.drawImage(renderer.domElement,column*400,0);ctx.fillStyle='#776b61';ctx.font='20px sans-serif';ctx.textAlign='center';ctx.fillText(label,column*400+200,580);scene.remove(a.root);disposeAvatar(a);column++;
  }pages.push(creamSheet.toDataURL());renderer.dispose();return{pages,checks};
 })()`);
 for(let i=0;i<result.pages.length;i++)await writeFile(new URL('./artifacts/dessert-models-20261004-'+i+'.png',import.meta.url),Buffer.from(result.pages[i].split(',')[1],'base64'));
 assert.equal(result.checks.length,20);assert.ok(result.checks.every(x=>x.meshes<18));assert.equal(c.events.filter(e=>e.method==='Runtime.exceptionThrown').length,0);
 console.log(JSON.stringify({models:result.checks,renders:44,exceptions:0}));
}finally{c.close();}
