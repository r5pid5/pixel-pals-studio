import {writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {connect} from './cdp.mjs';
const c=await connect(),stage=process.argv[2]==='before'?'before':'fixed';
try{
 await c.send('Page.navigate',{url:'http://127.0.0.1:4178/'});await c.send('Page.bringToFront');for(let i=0;i<200;i++){if(await c.evaluate('!!window.pixelPals?.getAvatar()'))break;await new Promise(r=>setTimeout(r,50));}
 const result=await c.evaluate(`(async()=>{
  const T=await import('./vendor/three.module.js'),{buildAvatar,defaults,poseAvatar,disposeAvatar}=await import('./avatar.js'),{createGrassPatch,sleepFootprint}=await import('./sleep-motion.js'),{createStudioLighting,applyStudioLighting}=await import('./lighting.js');
  const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(600,530);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;const scene=new T.Scene();scene.background=new T.Color('#f4f1eb');applyStudioLighting(createStudioLighting(scene),defaults);const camera=new T.OrthographicCamera(-2.3,2.3,2.032,-2.032,.1,30),pages=[],checks=[];
  for(const motion of['sleepSprawl','sleepProne']){
   const sheet=document.createElement('canvas');sheet.width=1800;sheet.height=590;const ctx=sheet.getContext('2d');ctx.fillStyle='#f4f1eb';ctx.fillRect(0,0,1800,590);
   const actors=[];for(let i=0;i<2;i++){const a=buildAvatar({...defaults,name:i?'밤이':'모찌',species:i?'puppy':'cat',tail:i?'curl':'none',head:i?1.25:1,bodyColor:i?'#424143':'#e7a01b',earSeparate:true,earColor:i?'#cececc':'#e7a01b'}),g=new T.Group();g.add(a.root);g.position.set(i?.775:-.775,0,0);g.rotation.y=i?.7:0;g.scale.setScalar(i?.82:1);scene.add(g);a.sharedGrass=true;poseAvatar(a,motion,0,1);actors.push({a,g});checks.push({motion,index:i,fit:{...sleepFootprint(a)}});}
   const grass=createGrassPatch();grass.position.z=-.45;grass.scale.set(2.1,1,2.1);scene.add(grass);
   for(let view=0;view<3;view++){const target=new T.Vector3(0,.25,-.35);camera.position.copy(target).add(new T.Vector3(...[[0,5,.01],[4,2.5,4],[4,.3,0]][view]));camera.lookAt(target);renderer.render(scene,camera);ctx.drawImage(renderer.domElement,view*600,0);ctx.fillStyle='#776b61';ctx.font='20px sans-serif';ctx.textAlign='center';ctx.fillText((motion==='sleepProne'?'엎드려':'대자로')+' 함께 자기 · '+['위','비스듬히','옆'][view],view*600+300,565);}
   for(const{a,g}of actors){scene.remove(g);disposeAvatar(a);}scene.remove(grass);disposeAvatar({root:grass});pages.push(sheet.toDataURL().split(',')[1]);
  }renderer.dispose();return{pages,checks};
 })()`);
 for(let i=0;i<result.pages.length;i++)await writeFile('tests/artifacts/sleep-group-'+stage+'-20261004-'+i+'.png',Buffer.from(result.pages[i],'base64'));assert.equal(c.events.filter(e=>e.method==='Runtime.exceptionThrown').length,0);console.log(JSON.stringify({stage,checks:result.checks,views:6,exceptions:0}));
}finally{c.close();}
