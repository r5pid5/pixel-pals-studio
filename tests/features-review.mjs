import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {connect} from './cdp.mjs';
const c=await connect(),sleep=ms=>new Promise(r=>setTimeout(r,ms));
try{
 c.events.length=0;await c.send('Emulation.setDeviceMetricsOverride',{width:1440,height:1180,deviceScaleFactor:1,mobile:false});await c.send('Page.navigate',{url:'http://127.0.0.1:4178/'});await sleep(2600);
 assert.equal(await c.evaluate('document.querySelectorAll("#species-grid [data-species]").length'),18);
 assert.equal(await c.evaluate('document.querySelectorAll("#species-grid img").length'),18);
 assert.equal(await c.evaluate('document.querySelectorAll("[data-tail]").length'),15);
 for(const [key,value]of[['tail','whale'],['tailSize',1.3],['tufts','crown'],['halo',true],['haloColor','#ebc78b'],['wings','devil'],['hatStyle','y2k'],['hairClip','mixed'],['background','transparent'],['shading',false],['shadows',false]]){
  await c.evaluate(`{const el=document.querySelector('[data-setting="${key}"]');el.value=${JSON.stringify(value)};if(el.type==='checkbox')el.checked=${JSON.stringify(value)};el.dispatchEvent(new Event(el.type==='range'?'input':'change',{bubbles:true}));}`);await sleep(140);assert.equal(await c.evaluate(`window.pixelPals.getState().${key}`),value);
 }
 assert.equal(await c.evaluate('window.pixelPals.getRenderer().shadowMap.enabled'),false);
 await c.evaluate(`for(let i=0;i<30;i++)document.querySelector('[data-add-mark="dots"]').click();document.querySelector('[data-add-mark="stitch"]').click();`);await sleep(250);assert.equal(await c.evaluate('window.pixelPals.getState().dots.length'),30);
 for(const[prop,value]of[['width',1.8],['height',.65],['angle',38],['color','#b45f6c']])await c.evaluate(`{const e=document.querySelector('[data-mark-prop="${prop}"][data-kind="scars"]');e.value=${JSON.stringify(value)};e.dispatchEvent(new Event('input',{bubbles:true}));}`);await sleep(200);
 const scar=await c.evaluate('window.pixelPals.getState().scars[0]');assert.equal(scar.width,1.8);assert.equal(scar.height,.65);assert.equal(scar.angle,38);assert.equal(scar.color,'#b45f6c');
 const mouths=await c.evaluate(`(async()=>{const{faceTexture}=await import('./face.js'),{enumRules}=await import('./options.js');return enumRules.mouth.map(mouth=>{const t=faceTexture({...window.pixelPals.getState(),mouth}),url=t.image.toDataURL();t.dispose();return url;});})()`);assert.equal(new Set(mouths).size,10);
 await c.evaluate('document.querySelector("#reset-character").click()');await sleep(300);
 const sheets=await c.evaluate(`(async()=>{
  const T=await import('./vendor/three.module.js'),{buildAvatar,disposeAvatar,defaults}=await import('./avatar.js'),{speciesOptions,tailOptions}=await import('./options.js');
  const renderer=new T.WebGLRenderer({antialias:true,alpha:true});renderer.setPixelRatio(1);renderer.setSize(240,280);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;
  const scene=new T.Scene();scene.background=new T.Color('#f3f0e9');scene.add(new T.HemisphereLight('#ffffff','#9d9181',1.2));const key=new T.DirectionalLight('#fffaf2',2.2);key.position.set(-3,7,5);scene.add(key);
  const camera=new T.OrthographicCamera(-1.65,1.65,1.925,-1.925,.1,50);camera.position.set(0,1.55,8);camera.lookAt(0,1.55,0);
  const make=(items,options)=>{const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=Math.ceil(items.length/5)*310;const ctx=canvas.getContext('2d');ctx.fillStyle='#f3f0e9';ctx.fillRect(0,0,canvas.width,canvas.height);
   items.forEach(([value,label],i)=>{const a=buildAvatar({...defaults,motion:'still',...options(value)});scene.add(a.root);renderer.render(scene,camera);ctx.drawImage(renderer.domElement,i%5*240,Math.floor(i/5)*310);ctx.fillStyle='#514d48';ctx.font='14px sans-serif';ctx.textAlign='center';ctx.fillText(label,i%5*240+120,Math.floor(i/5)*310+294);scene.remove(a.root);disposeAvatar(a);});return canvas.toDataURL().split(',')[1];};
  const ears=make(speciesOptions,v=>({species:v,tail:'none'}));camera.position.set(2.2,2.1,8);camera.lookAt(0,1.4,0);
  const tails=make(tailOptions,v=>({tail:v,tailSize:1.3}));
  const accessories=make([['y2k','Y2K 모자'],['bucket','버킷햇'],['beanie','비니'],['devil','소악마 날개'],['angel','천사 날개'],['mixed','별과 실핀'],['small','원뿔 뿔'],['candyBasket','사탕바구니'],['pumpkin','펌킨호박'],['mug','둥근 머그컵'],['halo','천사링'],['tufts','삐죽한 털 · 머리'],['cheeks','삐죽한 털 · 볼'],['wisps','띄엄띄엄 얇은 털 선'],['pairedWisps','두 가닥씩 얇은 털 선']],v=>['y2k','bucket','beanie','candyBasket'].includes(v)?{hat:true,hatStyle:v}:['devil','angel'].includes(v)?{wings:v}:v==='mixed'?{hairClip:v}:v==='small'?{horns:true}:v==='pumpkin'?{bodyCostume:v}:v==='mug'?{mug:true}:v==='halo'?{halo:true}:v==='tufts'?{tufts:'crown'}:{tufts:v});
  camera.position.set(0,1.55,8);camera.lookAt(0,1.55,0);const variants=make([['chibiCat','치비 고양이'],['floppy','처진 강아지'],['upright','쫑긋 강아지'],['small','작은 늘어진 토끼'],['large','큰 롭이어'],['antler','사슴 뿔 색상']],v=>['floppy','upright'].includes(v)?{species:'puppy',dogEars:v}:v==='antler'?{species:'antler',antlerColor:'#a67965'}:v==='chibiCat'?{species:v}:{species:'lop',lopEarStyle:v});renderer.dispose();return{ears,tails,accessories,variants};
 })()`);
 for(const [name,data]of Object.entries(sheets))await writeFile('tests/artifacts/'+name+'-review.png',Buffer.from(data,'base64'));
 const rect=await c.evaluate(`(()=>{const r=document.querySelector('#stage').getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,scale:1};})()`),shot=await c.send('Page.captureScreenshot',{format:'png',clip:rect});await writeFile('tests/artifacts/body-final.png',Buffer.from(shot.data,'base64'));
 const exceptions=c.events.filter(e=>e.method==='Runtime.exceptionThrown');if(exceptions.length)console.log(JSON.stringify(exceptions));assert.equal(exceptions.length,0);console.log('PASS 18 animal buttons, 15 tails, tail size, accessories, transparent background and independent shading/shadow controls; captured live mesh sheets');
}finally{c.close();}
