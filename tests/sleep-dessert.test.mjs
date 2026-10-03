import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import * as T from '../dist/vendor/three.module.js';
import {buildAvatar,defaults,poseAvatar,resetPose,collectModel,disposeAvatar} from '../dist/avatar.js';
import {clothingPatch} from '../dist/clothing-options.js';
import {dessertBaseOptions,dessertFamilies} from '../dist/dessert-options.js';
import {createDessertBase,createWhippedCream} from '../dist/dessert-bases.js';
import {strawberryHalfGeometry} from '../dist/dessert-shapes.js';
import {sleepFootprint} from '../dist/sleep-motion.js';
import {iceCreamFootprint} from '../dist/ice-cream-motion.js';
import {handCenter} from '../dist/social-motion.js';
import {updateAvatarColors} from '../dist/colors.js';
import {exportPMX,validateState} from '../dist/mmd.js';
const context={clearRect(){},quadraticCurveTo(){},fillRect(){},drawImage(){},beginPath(){},closePath(){},moveTo(){},lineTo(){},bezierCurveTo(){},clip(){},stroke(){},ellipse(){},fill(){},save(){},restore(){},translate(){},scale(){},rotate(){},createLinearGradient(){return{addColorStop(){}};},createRadialGradient(){return{addColorStop(){}};}};
globalThis.document={createElement(){return{width:0,height:0,getContext:()=>context};}};
const sample=a=>{a.root.updateMatrixWorld(true);const points=[];a.root.traverse(o=>{if(!o.isMesh||o.userData.outline)return;for(let p=o;p;p=p.parent)if(p.userData.motionProp||p.userData.dessertBase)return;if(o.isSkinnedMesh)o.skeleton.update();const attr=o.geometry.attributes.position;for(let i=0;i<attr.count;i+=11){const v=new T.Vector3().fromBufferAttribute(attr,i);if(o.isSkinnedMesh)o.applyBoneTransform(i,v);points.push(v.applyMatrix4(o.matrixWorld));}});return points;};

test('both sleeping poses independently ground the head and torso across sizes, clothing and tails',()=>{
 for(const motion of['sleepSprawl','sleepProne'])for(const[clothing,head,body,legs]of[['pajamas',1,1.2,1],['hoodieUp',.75,.75,.65],['uniform',1.3,1.35,1.45]]){
  const a=buildAvatar({...defaults,...clothingPatch(clothing),head,body,legs,dessertBase:'cake-strawberry'}),awake=a.face.material.map;
  poseAvatar(a,motion,0,1);const f=sleepFootprint(a),points=sample(a);assert.ok(f.headLift>.05);assert.ok(points.every(v=>v.y>.029),'geometry clears the grass');assert.ok(points.every(v=>Math.hypot(v.x-f.x,v.z-f.z)<f.radius-.15),'round grass contains the character');assert.equal(a.dessertBase.visible,false);assert.notEqual(a.face.material.map,awake);
  poseAvatar(a,motion,6,1);const loop=sample(a);points.forEach((v,i)=>assert.ok(v.distanceTo(loop[i])<1e-5,'six-second breathing loop'));
  poseAvatar(a,'still',0);assert.equal(a.face.material.map,awake);assert.equal(a.dessertBase.visible,true);assert.equal(a.root.getObjectByName('MotionProp-sleepGrass').visible,false);a.bones.forEach(b=>assert.ok(b.position.equals(b.userData.restPosition)));
  poseAvatar(a,motion,2);const next={...a.root.userData.pixelPals.state,eyeColor:'#123456'};updateAvatarColors(a,next,['eyeColor']);const recolored=a.face.material.map;poseAvatar(a,motion,3);resetPose(a);assert.equal(a.face.material.map,recolored);disposeAvatar(a);
 }
});

test('ice cream paws track the cone lip and the exact full body restores after switching, recoloring and exporting',()=>{
 for(const[clothing,head,body,legs]of[['pajamas',1,1.2,1],['hoodieUp',.75,.75,.65],['uniform',1.3,1.35,1.45]]){
  const s={...defaults,...clothingPatch(clothing),head,body,legs,dessertBase:'tart-apple',armSeparate:true,outline:true},a=buildAvatar(s),mesh=a.root.getObjectByName('SculptedBody'),original=mesh.geometry,before=collectModel(a).vertices;
  poseAvatar(a,'iceCream',0,1);assert.notEqual(mesh.geometry,original);assert.equal(a.root.getObjectByName('Clothing').visible,false);assert.equal(a.dessertBase.visible,false);const f=iceCreamFootprint(a);
  for(const[index,side]of[[7,1],[11,-1]]){const x=side*f.radius*.37,z=Math.sqrt(f.radius**2-x*x)+.018;assert.ok(handCenter(a,index).distanceTo(new T.Vector3(x,f.top-.045,z))<.004,'paw must remain at the rim');}
  const atZero=sample(a);poseAvatar(a,'iceCream',6,1);sample(a).forEach((v,i)=>assert.ok(v.distanceTo(atZero[i])<1e-5));
  poseAvatar(a,'sleepSprawl',0,1);assert.equal(mesh.geometry,original);assert.equal(a.root.getObjectByName('Clothing').visible,true);assert.equal(a.root.getObjectByName('MotionProp-iceCream').visible,false);
  poseAvatar(a,'iceCream',1);assert.deepEqual(collectModel(a).vertices,before,'model export restores full original geometry and excludes transient cone/grass');
  poseAvatar(a,'iceCream',1);updateAvatarColors(a,{...s,bodyColor:'#aabbcc'},['bodyColor']);assert.equal(mesh.geometry,original);poseAvatar(a,'iceCream',2);resetPose(a);assert.equal(mesh.geometry,original);assert.equal(a.root.getObjectByName('Clothing').visible,true);disposeAvatar(a);
 }
});

test('twenty detailed pastries keep their toppings, thin plate and foot support when their height changes',()=>{
 assert.equal(dessertBaseOptions.length,20);for(const[family]of dessertFamilies)assert.equal(dessertBaseOptions.filter(x=>x.family===family).length,4);
 for(const option of dessertBaseOptions){
  const base=createDessertBase({...defaults,dessertBase:option.id,dessertBaseHeight:1}),tall=createDessertBase({...defaults,dessertBase:option.id,dessertBaseHeight:1.9});assert.ok(tall.userData.supportHeight>base.userData.supportHeight*1.7);assert.ok(base.children.length<=18);
  const positions=g=>g.children.flatMap(m=>Array.from(m.geometry.attributes.position.array));assert.ok(positions(tall).every(Number.isFinite));assert.ok(positions(base).length/3<125000,'tiny pastry details must not consume hundreds of thousands of vertices');
  const plate=g=>g.children.find(m=>m.userData.pastryParts.includes('DessertPlate'));assert.deepEqual(Array.from(plate(base).geometry.attributes.position.array),Array.from(plate(tall).geometry.attributes.position.array),'plate remains thin');
  for(const x of[-.147,.147]){const ray=new T.Raycaster(new T.Vector3(x,tall.userData.supportHeight+.02,0),new T.Vector3(0,-1,0));const hit=ray.intersectObject(tall,true)[0];assert.ok(hit,option.id);assert.ok(Math.abs(hit.point.y-tall.userData.supportHeight)<.02,'center has a flat two-foot landing area: '+option.id);}
  disposeAvatar({root:base});disposeAvatar({root:tall});
 }
});

test('four creams and five pastry families retain real decoration and independently parse as PMX',()=>{
 const{Parser}=createRequire(import.meta.url)('../dist/vendor/mmdparser.cjs');
 const parts=[];for(const whippedCream of['plain','strawberry','cherry','chocolate']){const g=createWhippedCream({...defaults,whippedCream});parts.push(g.children.flatMap(m=>m.userData.pastryParts).sort().join(','));disposeAvatar({root:g});}assert.equal(new Set(parts).size,4);const decorated=buildAvatar({...defaults,whippedCream:'strawberry'});poseAvatar(decorated,'guitarPlay',1);let creams=0;decorated.root.traverse(o=>{if(o.name==='WhippedCream')creams++});assert.equal(creams,1,'social props must not create duplicate head cream');disposeAvatar(decorated);
 for(const dessertBase of['cake-strawberry','pudding-custard','roll-matcha','castella-honey','tart-apple']){const s=validateState({...defaults,dessertBase,whippedCream:'cherry',dessertBaseHeight:1.7,motion:'iceCream'},defaults),a=buildAvatar(s);poseAvatar(a,'iceCream',2);const data=collectModel(a),bytes=exportPMX(a,s).bytes,parsed=new Parser().parsePmx(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),true);assert.equal(parsed.metadata.vertexCount,data.vertices.length/3);assert.equal(parsed.metadata.boneCount,22);assert.ok(data.skinWeights.every(Number.isFinite));disposeAvatar(a);}
 assert.throws(()=>validateState({dessertBaseHeight:2},defaults));
});

test('sleep cap warm cache preserves pom-pom scale and rotation after switching outfits',()=>{
 for(const species of['cat','puppy']){const s={...defaults,species,head:1.1,sleepCap:true},cold=buildAvatar({...s,...clothingPatch('spacesuit')}),cap=cold.root.getObjectByName('Accessory-sleepCap')??cold.root.getObjectByName('Accessory-sleep-cap')??cold.root.getObjectByName('SleepCap');assert.ok(cap);const transforms=cap.children.map(o=>[o.name,o.position.toArray(),o.scale.toArray(),o.quaternion.toArray()]);disposeAvatar(cold);const warm=buildAvatar({...s,...clothingPatch('pajamas')}),again=warm.root.getObjectByName(cap.name);assert.deepEqual(again.children.map(o=>[o.name,o.position.toArray(),o.scale.toArray(),o.quaternion.toArray()]),transforms);disposeAvatar(warm);}
});

test('sleeping neck base sits under the actual head rim, and the standing model restores exactly',()=>{
 for(const motion of['sleepSprawl','sleepProne'])for(const[head,body,legs]of[[.75,1.35,1.45],[1,1.2,1],[1.3,.75,.65]])for(const clothing of['none','pajamas','hoodieUp']){
  const a=buildAvatar({...defaults,...clothingPatch(clothing),head,body,legs,tail:'curl'}),standing=collectModel(a).vertices;
  for(const time of[0,1.5,3]){poseAvatar(a,motion,time,1);a.root.updateMatrixWorld(true);a.face.skeleton.update();a.face.computeBoundingBox();a.face.computeBoundingSphere();const shift=(1.54/5.2)*(legs-1),bind=new T.Vector3(0,.838+shift,0).applyMatrix4(a.face.skeleton.boneInverses[3]),junction=a.bones[3].localToWorld(bind),ray=new T.Raycaster(new T.Vector3(4,junction.y,junction.z),new T.Vector3(-1,0,0)),hit=ray.intersectObject(a.face)[0];assert.ok(hit&&hit.point.x>.05,'neck base must be covered by the real head in side view: '+[motion,head,body,legs,clothing]);}
  assert.deepEqual(collectModel(a).vertices,standing,'sleep-only torso tuck cannot change model export');disposeAvatar(a);
 }
});

test('strawberries have a closed half-volume with visible cut flesh and heart in every strawberry dessert and cream',()=>{
 const geo=strawberryHalfGeometry([[0,0],[.13,.10],[.25,.28],[.34,.52],[.36,.70],[.31,.86],[.22,.96],[0,.99]]),p=geo.attributes.position,index=geo.index.array,edges=new Map(),key=i=>[p.getX(i),p.getY(i),p.getZ(i)].map(x=>x.toFixed(6)).join(':');
 for(let i=0;i<index.length;i+=3){const triangle=[key(index[i]),key(index[i+1]),key(index[i+2])];assert.equal(new Set(triangle).size,3,'no degenerate cap triangles');for(let k=0;k<3;k++){const edge=[triangle[k],triangle[(k+1)%3]].sort().join('|');edges.set(edge,(edges.get(edge)||0)+1);}}assert.ok([...edges.values()].every(n=>n===2),'cut plane closes the fruit');assert.ok([...p.array].every(Number.isFinite));assert.ok(Array.from({length:p.count},(_,i)=>p.getZ(i)).every(z=>z<1e-7));geo.dispose();
 for(const dessertBase of dessertBaseOptions.filter(x=>x.flavor==='strawberry').map(x=>x.id)){const g=createDessertBase({...defaults,dessertBase}),parts=new Set(g.children.flatMap(m=>m.userData.pastryParts));for(const part of['StrawberrySkin','StrawberryCutFlesh','StrawberryWhiteHeart'])assert.ok(parts.has(part),dessertBase+' '+part);disposeAvatar({root:g});}
 const g=createWhippedCream({...defaults,whippedCream:'strawberry'}),cut=g.children.find(m=>m.userData.pastryParts.includes('StrawberryCutFlesh'));assert.ok(cut);cut.geometry.computeBoundingBox();const size=cut.geometry.boundingBox.getSize(new T.Vector3());assert.ok(size.x>size.y,'strawberry cut should be plump rather than tall');disposeAvatar({root:g});
});
