import test from 'node:test';import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three.module.js';
import {buildAvatar,defaults,disposeAvatar,poseAvatar} from '../dist/avatar.js';
import {handCenter} from '../dist/social-motion.js';
const context={clearRect(){},quadraticCurveTo(){},fillRect(){},drawImage(){},beginPath(){},closePath(){},moveTo(){},lineTo(){},bezierCurveTo(){},clip(){},stroke(){},ellipse(){},fill(){},save(){},restore(){},translate(){},scale(){},rotate(){},createLinearGradient(){return{addColorStop(){}};},createRadialGradient(){return{addColorStop(){}};}};globalThis.document={createElement(){return{width:0,height:0,getContext:()=>context};}};
test('hands meet cup handle, book edges and syringe barrel throughout their cycles, including scaled studio actors',()=>{
 let maximum=0;for(const scale of[.65,1,1.25]){const a=buildAvatar({...defaults,clothing:'none'});a.root.scale.setScalar(scale);a.root.rotation.y=.8;
 for(const motion of['picnicDrink','picnicEat','readTogether','toast','syringeHold','guitarPlay','laptopWork'])for(let i=0;i<=24;i++){poseAvatar(a,motion,i/4);a.root.updateMatrixWorld(true);const prop=a.root.getObjectByName('MotionProp-'+({picnicDrink:'drink',picnicEat:'kimbap',readTogether:'book',toast:'toast',syringeHold:'syringe',guitarPlay:'guitar',laptopWork:'laptop'}[motion]));assert.ok(prop?.visible,motion);for(const grip of prop.userData.grips??[]){const target=prop.localToWorld(new T.Vector3(...grip.point)),actual=handCenter(a,grip.arm),error=target.distanceTo(actual);maximum=Math.max(maximum,error);assert.ok(error<.015*scale,motion+' grip '+error.toFixed(4));}}
 disposeAvatar(a);}console.log('Maximum grip error:',maximum.toFixed(5));
});
test('book page normals face up toward the reader and mug body stays outside the gripping hand',()=>{
 const a=buildAvatar({...defaults});for(let i=0;i<12;i++){poseAvatar(a,'readTogether',i/2);a.root.updateMatrixWorld(true);const book=a.root.getObjectByName('MotionProp-book'),normal=new T.Vector3(0,0,1).transformDirection(book.matrixWorld),reader=a.bones[5].getWorldPosition(new T.Vector3()).sub(book.getWorldPosition(new T.Vector3())).normalize();assert.ok(normal.dot(reader)>.75,'pages must face reader');poseAvatar(a,'picnicDrink',i/2);const cup=a.root.getObjectByName('MotionProp-drink'),hand=cup.worldToLocal(handCenter(a,7));assert.ok(Math.hypot(hand.x,hand.z)-.089>.078,'hand must not cut through mug body');}disposeAvatar(a);
});
test('at the drinking peak the cup rim reaches the face mouth for different head sizes and dressed actors',()=>{
 for(const head of[.75,1,1.3]){const a=buildAvatar({...defaults,head,clothing:'hoodie'});a.root.scale.setScalar(.8);a.root.rotation.y=.6;poseAvatar(a,'picnicDrink',3);a.root.updateMatrixWorld(true);const cup=a.root.getObjectByName('MotionProp-drink'),rim=cup.localToWorld(new T.Vector3(0,.080,-.071)),mouth=a.bones[5].localToWorld(new T.Vector3(.02,.956-a.headOrigin[1],a.headSurface.front(0,.956)+.012));assert.ok(rim.distanceTo(mouth)<.002,'rim must reach mouth at peak');for(const grip of cup.userData.grips)assert.ok(handCenter(a,grip.arm).distanceTo(cup.localToWorld(new T.Vector3(...grip.point)))<.012);disposeAvatar(a);}
});
test('helmet keeps original ears and stays at skull height instead of stretching to ear tips',()=>{
 for(const species of['cat','fox','wolf','bunny','puppy']){const plain=buildAvatar({...defaults,species}),helmet=buildAvatar({...defaults,species,spaceHelmet:true});assert.deepEqual(helmet.face.geometry.attributes.position.array,plain.face.geometry.attributes.position.array);assert.equal(Boolean(plain.root.getObjectByName('AnimalEars')),Boolean(helmet.root.getObjectByName('AnimalEars')));const crown=helmet.root.getObjectByName('HelmetCrown');assert.ok(crown);const bounds=new T.Box3().setFromObject(crown),skullTop=helmet.headSurface.top(0,0)+.10;assert.ok(bounds.max.y<skullTop+.30);disposeAvatar(plain);disposeAvatar(helmet);}
});
test('shared raglan torso vertices retain matching weights across material boundaries',()=>{
 const a=buildAvatar({...defaults,clothing:'raglan'}),map=new Map();let shared=0;
 for(const mesh of a.root.getObjectByName('Clothing').children.filter(o=>o.name==='GarmentTorso')){const p=mesh.geometry.attributes.position,bi=mesh.geometry.attributes.skinIndex,bw=mesh.geometry.attributes.skinWeight;
  for(let i=0;i<p.count;i++){const key=[p.getX(i),p.getY(i),p.getZ(i)].map(x=>x.toFixed(6)).join(','),weights=new Map();for(let j=0;j<4;j++){const bone=bi.array[i*4+j];weights.set(bone,(weights.get(bone)??0)+bw.array[i*4+j]);}
   if(map.has(key)){const previous=map.get(key);if(previous.mesh!==mesh){shared++;for(const[bone,w]of weights)assert.ok(Math.abs(w-(previous.weights.get(bone)??0))<1e-4,'raglan color seam');}}else map.set(key,{mesh,weights});
  }
 }
 assert.ok(shared>30,'check actual vertices shared by two material panels');disposeAvatar(a);
});
test('changing between short sleeves, long sleeves and no clothes restores the appropriate visible skin',async()=>{
 const {mergedBody}=await import('../dist/merged-body.js');let previous;
 for(const clothing of['hoodie','tee','none','raglan','coat','tee']){const s={...defaults,body:1.193,clothing},g=mergedBody(s),p=g.attributes.position;const arms=Array.from({length:p.count},(_,i)=>[p.getX(i),p.getY(i),p.getZ(i)]).filter(([x,y])=>y>.37&&Math.abs(x)>.26);
  if(clothing==='hoodie')previous=arms.length;if(clothing==='tee')assert.ok(arms.length>previous,'short sleeves must restore the forearm after a long-sleeved garment');if(clothing==='none')assert.ok(arms.length>previous,'removing clothes must restore covered skin');
  const fresh=mergedBody({...s,body:1.1930001});assert.equal(p.count,fresh.attributes.position.count,'cached coverage must match a fresh geometry');g.dispose();fresh.dispose();
 }
});
