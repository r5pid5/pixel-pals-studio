import test from 'node:test';import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three.module.js';
import {buildAvatar,defaults,poseAvatar,disposeAvatar} from '../dist/avatar.js';
import {clothingPatch,clothingStyles} from '../dist/clothing-options.js';
import {handCenter} from '../dist/social-motion.js';
const context={clearRect(){},quadraticCurveTo(){},fillRect(){},drawImage(){},beginPath(){},closePath(){},moveTo(){},lineTo(){},bezierCurveTo(){},clip(){},stroke(){},ellipse(){},fill(){},save(){},restore(){},translate(){},scale(){},rotate(){},createLinearGradient(){return{addColorStop(){}};},createRadialGradient(){return{addColorStop(){}};}};
globalThis.document={createElement(){return{width:0,height:0,getContext:()=>context};}};

test('the raised hood covers the crown with outward-facing fabric instead of an open ring',()=>{
 for(const detail of['verylow','low','smooth']){
  const a=buildAvatar({...defaults,...clothingPatch('hoodieUp'),hoodEarMode:'outside',detail}),mesh=a.root.getObjectByName('FittedFabricHood'),p=mesh.geometry.attributes.position,indices=mesh.geometry.index?.array,range=mesh.geometry.groups.find(g=>g.materialIndex===0),points=[new T.Vector2(0,-.045)],offset=a.bones[5].getWorldPosition(new T.Vector3()).y-a.headOrigin[1];
  for(let i=0;i<32;i++){const angle=i/32*Math.PI*2;points.push(new T.Vector2(.04*Math.sin(angle),-.045+.04*Math.cos(angle)));}
  for(const point of points){const ray=new T.Ray(new T.Vector3(point.x,4,point.y),new T.Vector3(0,-1,0)),hit=new T.Vector3();let height=-Infinity;
   for(let j=range.start;j<range.start+range.count;j+=3){const tri=[0,1,2].map(k=>new T.Vector3().fromBufferAttribute(p,indices?indices[j+k]:j+k));if(ray.intersectTriangle(...tri,true,hit))height=Math.max(height,hit.y);}
   assert.ok(Number.isFinite(height),'crown must intercept a ray coming down from above');assert.ok(height>a.headSurface.top(point.x,point.y)+offset+.015,'head must stay underneath the fabric');
  }
  const bare=buildAvatar({...defaults,detail});assert.deepEqual(a.face.geometry.attributes.position.array,bare.face.geometry.attributes.position.array,'original ears and skull remain unchanged');disposeAvatar(bare);disposeAvatar(a);
 }
});

test('equipping any of the 18 garments preserves the bare character arm pose',()=>{
 const bare=buildAvatar({...defaults,clothing:'none'});
 for(const style of clothingStyles){const dressed=buildAvatar({...defaults,...clothingPatch(style.id)});
  for(const motion of['still','float','wave'])for(const time of[0,1.5,3]){
   poseAvatar(bare,motion,time);poseAvatar(dressed,motion,time);bare.root.updateMatrixWorld(true);dressed.root.updateMatrixWorld(true);
   for(const arm of[7,11])assert.ok(handCenter(bare,arm).distanceTo(handCenter(dressed,arm))<1e-6,style.id+' must not automatically spread or bend an arm');
  }
  disposeAvatar(dressed);
 }
 disposeAvatar(bare);
});

test('raising the sleeves leaves the torso fabric in place',()=>{
 for(const kind of['hoodie','varsity','apron']){
  const a=buildAvatar({...defaults,...clothingPatch(kind)}),torso=a.root.getObjectByName('Clothing').children.filter(m=>m.name==='GarmentTorso'),samples=[];
  const local=(m,i)=>a.bones[3].worldToLocal(m.localToWorld(m.applyBoneTransform(i,new T.Vector3().fromBufferAttribute(m.geometry.attributes.position,i))));
  poseAvatar(a,'still',0);a.root.updateMatrixWorld(true);a.face.skeleton.update();for(const m of torso)for(let i=0;i<m.geometry.attributes.position.count;i+=97)samples.push([m,i,local(m,i)]);
  for(const motion of['wave','picnicDrink','readTogether']){poseAvatar(a,motion,3);a.root.updateMatrixWorld(true);a.face.skeleton.update();for(const[m,i,initial]of samples)assert.ok(local(m,i).distanceTo(initial)<1e-5,kind+' torso must not be pulled by a wrist');}
  disposeAvatar(a);
 }
});

test('varsity fabric has a colored torso and white sleeves, including its side panels',()=>{
 const state={...defaults,...clothingPatch('varsity')},a=buildAvatar(state),parts=a.root.getObjectByName('Clothing').children,torso=parts.filter(m=>m.name==='GarmentTorso'&&m.geometry.attributes.position.count),sleeves=parts.filter(m=>m.name==='GarmentSleeve');
 assert.equal(torso.length,1);assert.equal(sleeves.length,2);assert.equal(torso[0].material.color.getHexString(),state.clothingColor.slice(1));assert.ok(sleeves.every(m=>m.material.color.getHexString()==='ffffff'));
 const p=torso[0].geometry.attributes.position;assert.ok(Array.from({length:p.count},(_,i)=>i).some(i=>Math.abs(p.getX(i))>.28*state.body&&p.getY(i)<.55),'the side of the torso belongs to the colored body fabric');
 disposeAvatar(a);
});

test('independent prison sleeves preserve their alternating fabric stripes',()=>{
 const a=buildAvatar({...defaults,...clothingPatch('prison')});
 for(const sleeve of a.root.getObjectByName('Clothing').children.filter(m=>m.name==='GarmentSleeve')){
  assert.equal(sleeve.material.length,2);assert.ok(sleeve.geometry.groups.every(g=>g.count>0));assert.deepEqual(sleeve.geometry.groups.map(g=>g.materialIndex),[0,1]);
 }
 disposeAvatar(a);
});
