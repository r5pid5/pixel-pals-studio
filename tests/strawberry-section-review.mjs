import {writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {connect} from './cdp.mjs';
const c=await connect();
try{
 await c.send('Page.navigate',{url:'http://127.0.0.1:4178/'});await c.send('Page.bringToFront');for(let i=0;i<200;i++){if(await c.evaluate('!!window.pixelPals?.getAvatar()'))break;await new Promise(r=>setTimeout(r,50));}
 const result=await c.evaluate(`(async()=>{
  const T=await import('./vendor/three.module.js'),{pastryBuilder,batchPastry}=await import('./dessert-shapes.js'),{defaults,disposeAvatar}=await import('./avatar.js'),{createStudioLighting,applyStudioLighting}=await import('./lighting.js');const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(400,440);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;const scene=new T.Scene();scene.background=new T.Color('#f4f1eb');applyStudioLighting(createStudioLighting(scene),defaults);const camera=new T.OrthographicCamera(-.63,.63,.693,-.693,.1,30),sheet=document.createElement('canvas');sheet.width=1600;sheet.height=490;const ctx=sheet.getContext('2d');ctx.fillStyle='#f4f1eb';ctx.fillRect(0,0,1600,490);
  let column=0;for(const[label,thin,angle]of[['기존 세로 비율',true,0],['수정 · 통통한 단면',false,0],['수정 · 옆',false,Math.PI/2],['수정 · 뒤',false,Math.PI]]){const g=new T.Group(),p=pastryBuilder(defaults),fruit=p.strawberry(g,[0,0,0],1);if(thin)fruit.scale.setScalar(1);g.rotation.y=angle;batchPastry(g);scene.add(g);camera.position.set(0,.6,4);camera.lookAt(0,.47,0);renderer.render(scene,camera);ctx.drawImage(renderer.domElement,column*400,0);ctx.fillStyle='#776b61';ctx.font='19px sans-serif';ctx.textAlign='center';ctx.fillText(label,column*400+200,470);scene.remove(g);disposeAvatar({root:g});column++;}renderer.dispose();return sheet.toDataURL().split(',')[1];
 })()`);
 await writeFile('tests/artifacts/strawberry-section-20261004.png',Buffer.from(result,'base64'));assert.equal(c.events.filter(e=>e.method==='Runtime.exceptionThrown').length,0);console.log(JSON.stringify({views:4,exceptions:0}));
}finally{c.close();}
