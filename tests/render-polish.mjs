import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {connect} from './cdp.mjs';
const c=await connect(),sleep=ms=>new Promise(r=>setTimeout(r,ms));
try{
 await c.send('Page.navigate',{url:'http://127.0.0.1:4178/'});
 for(let i=0;i<100&&!await c.evaluate('!!window.pixelPals?.getAvatar()');i++)await sleep(100);
 const result=await c.evaluate(`(async()=>{
 const T=await import('./vendor/three.module.js'),{buildAvatar,disposeAvatar,defaults}=await import('./avatar.js'),{clearAccessories}=await import('./accessories.js');
 const r=new T.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});r.setSize(280,300);r.outputColorSpace=T.SRGBColorSpace;r.toneMapping=T.ACESFilmicToneMapping;r.toneMappingExposure=1.02;
 const scene=new T.Scene();scene.add(new T.HemisphereLight('#ffffff','#9d9181',.95));const key=new T.DirectionalLight('#fffaf2',2.35);key.position.set(-3,8,4);scene.add(key);const fill=new T.DirectionalLight('#efe9e0',.75);fill.position.set(4,3,-2);scene.add(fill);
 const camera=new T.OrthographicCamera(-1.9,1.9,2.035,-2.035,.1,30),entries=[];
 for(const head of[.75,1,1.3])for(const view of['front','side'])entries.push(['head '+head+' / '+view,{species:'puppy',head,ears:1},view]);
 for(const ears of[.6,1.4])entries.push(['ears '+ears,{species:'puppy',ears},'side']);
 const cvs=document.createElement('canvas');cvs.width=1120;cvs.height=660;const ctx=cvs.getContext('2d');ctx.fillStyle='#f3f0e9';ctx.fillRect(0,0,cvs.width,cvs.height);
 const earDepths=[];
 for(let i=0;i<entries.length;i++){
  const[label,patch,view]=entries[i],a=buildAvatar({...defaults,...clearAccessories,...patch,motion:'still'});scene.add(a.root);
  if(view==='front')camera.position.set(0,1.35,7);else camera.position.set(4,1.65,5);camera.lookAt(0,1.35,0);r.render(scene,camera);
  const x=i%4*280,y=Math.floor(i/4)*330;ctx.drawImage(r.domElement,x,y);ctx.fillStyle='#71665b';ctx.font='14px sans-serif';ctx.textAlign='center';ctx.fillText(label,x+140,y+317);
  a.root.getObjectByName('AnimalEars')?.traverse(o=>{if(o.isMesh&&o.userData.role==='ears'){o.geometry.computeBoundingBox();earDepths.push(o.geometry.boundingBox.getSize(new T.Vector3()).z);}});
  scene.remove(a.root);disposeAvatar(a);
 }
 r.dispose();r.forceContextLoss();return{data:cvs.toDataURL().split(',')[1],earDepths};})()`);
 assert.equal(result.earDepths.length,16);assert.ok(result.earDepths.every(d=>d>.13),JSON.stringify(result.earDepths));
 await writeFile('tests/artifacts/padded-puppy.png',Buffer.from(result.data,'base64'));
 assert.equal(c.events.filter(e=>e.method==='Runtime.exceptionThrown').length,0);
 console.log('PASS padded puppy ears, 3 head sizes, 3 ear sizes, solid colors and front/side renders');
}finally{c.close();}
