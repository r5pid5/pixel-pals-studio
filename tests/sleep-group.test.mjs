import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three.module.js';
import {buildAvatar,defaults,poseAvatar,disposeAvatar} from '../dist/avatar.js';
import {sleepFootprint} from '../dist/sleep-motion.js';
import {clothingPatch} from '../dist/clothing-options.js';
const context={clearRect(){},quadraticCurveTo(){},fillRect(){},drawImage(){},beginPath(){},closePath(){},moveTo(){},lineTo(){},bezierCurveTo(){},clip(){},stroke(){},ellipse(){},fill(){},save(){},restore(){},translate(){},scale(){},rotate(){},createLinearGradient(){return{addColorStop(){}};},createRadialGradient(){return{addColorStop(){}};}};
globalThis.document={createElement(){return{width:0,height:0,getContext:()=>context};}};

test('first sleep fitting is identical inside a newly positioned studio parent',()=>{
 let conditions=0,maximum=0;
 for(const motion of['sleepSprawl','sleepProne'])for(const patch of[{species:'cat',tail:'none'},{species:'puppy',head:1.25,body:1.35,legs:1.45,...clothingPatch('pajamas')},{species:'bunny',head:.75,body:.75,legs:.65,...clothingPatch('hoodieUp')}]){
  const state={...defaults,...patch},single=buildAvatar(state);poseAvatar(single,motion,0,1);const expected={...sleepFootprint(single)};
  for(const[x,z,angle,scale]of[[-.775,0,0,.82],[.775,0,0,.82],[1,.4,Math.PI,.65],[-1,-.5,-.9,1.4]]){
   const a=buildAvatar(state),group=new T.Group();group.add(a.root);group.position.set(x,0,z);group.rotation.y=angle;group.scale.setScalar(scale);poseAvatar(a,motion,0,1);const actual=sleepFootprint(a);
   for(const key of['tuck','headLift','lift','x','z','radius']){const error=Math.abs(actual[key]-expected[key]);maximum=Math.max(maximum,error);assert.ok(error<1e-6,'studio parent changed '+key+' for '+motion+' '+x);}
   for(const t of[0,1.5,3,6]){
    // Move the same fitted friend without rebuilding or pre-updating the parent.
    group.position.x+=.03;group.rotation.y+=.1;poseAvatar(a,motion,t,1);poseAvatar(single,motion,t,1);
    a.face.skeleton.update();single.face.skeleton.update();const p=a.face.geometry.attributes.position;
    for(let i=0;i<p.count;i+=41){const v=a.face.applyBoneTransform(i,new T.Vector3().fromBufferAttribute(p,i)).applyMatrix4(a.face.matrixWorld),local=a.root.worldToLocal(v),reference=single.face.applyBoneTransform(i,new T.Vector3().fromBufferAttribute(p,i)).applyMatrix4(single.face.matrixWorld);assert.ok(local.distanceTo(reference)<1e-6,'parent transform must not deform sleeping head');}
    conditions++;
   }
   disposeAvatar(a);
  }disposeAvatar(single);
 }console.log('Studio parent sleep samples:',conditions,'maximum fit difference:',maximum.toExponential(3));
});

test('floppy dogs keep their cheek and neck connected in both sleeping motions',()=>{
 for(const motion of['sleepSprawl','sleepProne'])for(const[head,body,legs,ears]of[[1,1.2,1,1],[1.25,1.35,1.45,1],[1.25,1.2,1,1],[.75,1.35,.65,1.5],[1.3,.75,1.45,.75]])for(const clothing of['none','pajamas','hoodieUp','spacesuit','varsity']){
  const a=buildAvatar({...defaults,...clothingPatch(clothing),species:'puppy',head,body,legs,ears}),group=new T.Group();group.add(a.root);group.position.set(.8,0,.2);group.rotation.y=.7;group.scale.setScalar(.82);
  for(let step=0;step<=24;step++){const t=step/4;poseAvatar(a,motion,t,1);a.face.skeleton.update();a.face.computeBoundingBox();a.face.computeBoundingSphere();const shift=(1.54/5.2)*(legs-1),junction=a.root.worldToLocal(a.bones[3].localToWorld(new T.Vector3(0,.838+shift,0).applyMatrix4(a.face.skeleton.boneInverses[3]))),ray=new T.Raycaster(a.root.localToWorld(new T.Vector3(4,junction.y,junction.z)),new T.Vector3(-1,0,0).transformDirection(a.root.matrixWorld)),hit=ray.intersectObject(a.face)[0];assert.ok(hit&&a.root.worldToLocal(hit.point.clone()).x>.05,'dog neck covered '+[motion,head,body,legs,ears,clothing,t]);}
  disposeAvatar(a);
 }
});
