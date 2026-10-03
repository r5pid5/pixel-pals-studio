import test from 'node:test';import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three.module.js';
import {buildAvatar,defaults,poseAvatar,disposeAvatar} from '../dist/avatar.js';
import {handBindX} from '../dist/garment-fit.js';import {handCenter} from '../dist/social-motion.js';
const context={clearRect(){},quadraticCurveTo(){},fillRect(){},drawImage(){},beginPath(){},closePath(){},moveTo(){},lineTo(){},bezierCurveTo(){},clip(){},stroke(){},ellipse(){},fill(){},save(){},restore(){},translate(){},scale(){},rotate(){},createLinearGradient(){return{addColorStop(){}};},createRadialGradient(){return{addColorStop(){}};}};globalThis.document={createElement(){return{width:0,height:0,getContext:()=>context};}};
const cloth=a=>a.root.getObjectByName('Clothing').children.filter(m=>['GarmentTorso','GarmentSleeve'].includes(m.name));
function edges(meshes){const map=new Map();for(const m of meshes){const p=m.geometry.attributes.position,index=m.geometry.index,count=index?.count??p.count;for(let i=0;i<count;i+=3)for(let j=0;j<3;j++){const a=index?index.getX(i+j):i+j,b=index?index.getX(i+(j+1)%3):i+(j+1)%3,x=new T.Vector3().fromBufferAttribute(p,a),y=new T.Vector3().fromBufferAttribute(p,b),key=[x.toArray().map(n=>n.toFixed(5)).join(','),y.toArray().map(n=>n.toFixed(5)).join(',')].sort().join('|');if(!map.has(key))map.set(key,{count:0,m,a,b,x,y});map.get(key).count++;}}return[...map.values()];}
const posed=(m,i)=>m.applyBoneTransform(i,new T.Vector3().fromBufferAttribute(m.geometry.attributes.position,i));
test('hoodie cuff openings retain a circular rigid shape when raised to drink',()=>{
 for(const body of[.85,1.2,1.5]){const a=buildAvatar({...defaults,body,clothing:'hoodie'}),shift=(1.54/5.2)*(defaults.legs-1),rings=[];
 for(const side of[-1,1]){const start=new T.Vector3(side*.20*body,.79+shift,0),axis=new T.Vector3(side*handBindX({...defaults,body,clothing:'hoodie'}),.494+shift,.03).sub(start),end=axis.length()*1.02;axis.normalize();const found=[];
 for(const m of cloth(a).filter(m=>m.name==='GarmentSleeve')){const p=m.geometry.attributes.position;for(let i=0;i<p.count;i++){const v=new T.Vector3().fromBufferAttribute(p,i),along=v.clone().sub(start).dot(axis);if(Math.abs(along-end)<1e-5&&Math.sign(v.x)===side)found.push({m,i,v});}}assert.ok(found.length>20,'cuff vertices exist');rings.push(found);}
 poseAvatar(a,'picnicDrink',3);a.root.updateMatrixWorld(true);a.face.skeleton.update();for(const ring of rings){const first=ring[0];for(const v of ring){const actual=posed(v.m,v.i).distanceTo(posed(first.m,first.i)),bind=v.v.distanceTo(first.v);assert.ok(Math.abs(actual-bind)<.00002,'cuff must not stretch into a ribbon');}}disposeAvatar(a);
 }
});
test('cloth boundary edges do not stretch into long tears during the drinking cycle',()=>{
 for(const kind of['hoodie','uniform','tee']){const a=buildAvatar({...defaults,clothing:kind}),boundary=edges(cloth(a)).filter(e=>e.count===1);assert.ok(boundary.length>0);let maximum=0;
 for(const time of[0,1.5,3,4.5,6]){poseAvatar(a,'picnicDrink',time);a.root.updateMatrixWorld(true);a.face.skeleton.update();for(const e of boundary){const length=posed(e.m,e.a).distanceTo(posed(e.m,e.b));maximum=Math.max(maximum,length);assert.ok(length<.06,kind+' unexpected long tear '+length);}}console.log(kind+' longest boundary edge: '+maximum.toFixed(5));disposeAvatar(a);}
});
test('school vest is an open shell without non-manifold armhole walls or limb-driven vertices',()=>{
 const a=buildAvatar({...defaults,clothing:'uniform'}),m=a.root.getObjectByName('SchoolVest'),p=m.geometry.attributes.position,bi=m.geometry.attributes.skinIndex,bw=m.geometry.attributes.skinWeight;assert.ok(m);
 let minimum=Infinity,at;for(let i=0;i<p.count;i++){for(let j=0;j<4;j++)if(bw.array[i*4+j]>.00001)assert.ok([2,3].includes(bi.array[i*4+j]),'vest follows torso');const theta=Math.atan2(p.getX(i)/defaults.body,p.getZ(i)/.79),center=(p.getX(i)>=0?1:-1)*Math.PI/2,delta=Math.atan2(Math.sin(theta-center),Math.cos(theta-center)),hole=(delta/.62)**2+((p.getY(i)-.725)/.165)**2;if(hole<minimum){minimum=hole;at=[p.getX(i),p.getY(i),p.getZ(i)];}}assert.ok(minimum>.997,'no cloth/wall inside an armhole: '+minimum+' at '+at);
 const all=edges([m]);assert.ok(all.every(e=>e.count<=2),'surface edges must not join three faces');assert.ok(all.some(e=>e.count===1),'neck, hem and armholes remain open');disposeAvatar(a);
});
test('lowered hood stays on the neck when the arms change pose',()=>{
 const a=buildAvatar({...defaults,clothing:'hoodie'}),m=a.root.getObjectByName('FoldedHood');poseAvatar(a,'still',0);a.root.updateMatrixWorld(true);a.face.skeleton.update();const rest=[];for(let i=0;i<m.geometry.attributes.position.count;i+=15)rest.push([i,posed(m,i)]);
 poseAvatar(a,'picnicDrink',3);a.root.updateMatrixWorld(true);a.face.skeleton.update();for(const[i,v]of rest){const expected=v.clone().add(new T.Vector3(0,-.175,0));assert.ok(posed(m,i).distanceTo(expected)<.00001,'hood must not be dragged by an arm');}disposeAvatar(a);
});
test('free picnic hand stays at lap height with the elbow outside the torso',()=>{
 const a=buildAvatar({...defaults,clothing:'hoodie'});a.root.scale.setScalar(.8);a.root.rotation.y=.75;
 for(const t of[0,.75,1.5,2.25,3,4.5,6]){poseAvatar(a,'picnicDrink',t);a.root.updateMatrixWorld(true);const hand=a.root.worldToLocal(handCenter(a,11)),elbow=a.root.worldToLocal(a.bones[12].getWorldPosition(new T.Vector3()));assert.ok(hand.distanceTo(new T.Vector3(-.30,.27,.37))<.002,'free hand rests on lap');assert.ok(elbow.x<hand.x-.03,'elbow rests outwards');assert.ok(elbow.y<.52,'free elbow must not stay beside the face');}disposeAvatar(a);
});
test('reading and conversation elbows stay down and outside rather than folding up beside the face',()=>{
 for(const kind of['hoodie','cardigan']){const a=buildAvatar({...defaults,clothing:kind});a.root.rotation.y=.7;a.root.scale.setScalar(.8);for(const motion of['readTogether','picnicChat'])for(const time of[0,1.5,3,4.5,6]){poseAvatar(a,motion,time);a.root.updateMatrixWorld(true);for(const[index,side]of[[7,1],[11,-1]]){const shoulder=a.root.worldToLocal(a.bones[index].getWorldPosition(new T.Vector3())),elbow=a.root.worldToLocal(a.bones[index+1].getWorldPosition(new T.Vector3()));assert.ok(elbow.y<shoulder.y-.08,motion+' elbow stays down');assert.ok(side*(elbow.x-shoulder.x)>.05,motion+' elbow stays outwards');}}disposeAvatar(a);}
});
