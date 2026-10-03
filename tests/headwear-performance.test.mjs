import test from 'node:test';import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three.module.js';
import {buildAvatar,defaults,poseAvatar,disposeAvatar} from '../dist/avatar.js';
import {clothingPatch} from '../dist/clothing-options.js';
import {garmentSurface} from '../dist/garment-surface.js';
import {vestSurface} from '../dist/vest-surface.js';
const context={clearRect(){},quadraticCurveTo(){},fillRect(){},drawImage(){},beginPath(){},closePath(){},moveTo(){},lineTo(){},bezierCurveTo(){},clip(){},stroke(){},ellipse(){},fill(){},save(){},restore(){},translate(){},scale(){},rotate(){},createLinearGradient(){return{addColorStop(){}};},createRadialGradient(){return{addColorStop(){}};}};globalThis.document={createElement(){return{width:0,height:0,getContext:()=>context};}};

test('hood neckline remains attached to the chest while its outer shell follows scaled and animated heads',()=>{
 for(const head of[.75,1,1.3])for(const body of[1,1.3]){
  const a=buildAvatar({...defaults,...clothingPatch('hoodieUp'),head,body}),hood=a.root.getObjectByName('FittedFabricHood'),p=hood.geometry.attributes.position,w=hood.geometry.attributes.skinWeight,bi=hood.geometry.attributes.skinIndex,neck=[],outer=[];
  assert.ok(hood.isSkinnedMesh);for(let i=0;i<p.count;i++){const radius=Math.hypot(p.getX(i)/body,(p.getZ(i)+.045)/.79);if(Math.abs(p.getY(i)-hood.userData.hoodNeckY)<.018&&radius<.22)neck.push(i);if(radius>.56&&p.getY(i)<1.15)outer.push(i);}
  assert.ok(neck.length>20);assert.ok(outer.length>100);for(const i of neck){assert.equal(bi.getX(i),3);assert.ok(w.getX(i)>.99);}for(const i of outer)assert.ok(w.getY(i)>.99,'wide underside belongs to the head, not a rigid chest ring');
  const sample=i=>a.bones[3].worldToLocal(hood.localToWorld(hood.applyBoneTransform(i,new T.Vector3().fromBufferAttribute(p,i))));
  poseAvatar(a,'still',0);a.root.updateMatrixWorld(true);a.face.skeleton.update();const rest=neck.map(sample);
  for(const motion of['wave','picnicDrink','readTogether']){poseAvatar(a,motion,3);a.root.updateMatrixWorld(true);a.face.skeleton.update();neck.forEach((i,j)=>assert.ok(sample(i).distanceTo(rest[j])<1e-5,'neck seam must stay attached'));}disposeAvatar(a);
 }
});

test('hood lining stays underneath the crown and coincident roof vertices share smooth normals',()=>{
 for(const detail of['verylow','low','smooth']){
  const a=buildAvatar({...defaults,...clothingPatch('hoodieUp'),detail}),g=a.root.getObjectByName('FittedFabricHood').geometry,p=g.attributes.position,n=g.attributes.normal,index=g.index.array,layer=p.count/2,outer=g.groups[0];
  let checked=0;for(let j=outer.start;j<outer.start+outer.count;j+=3){const ids=[index[j],index[j+1],index[j+2]],points=ids.map(i=>new T.Vector3().fromBufferAttribute(p,i));if(points.some(v=>v.y<2.1))continue;checked++;const normal=points[1].clone().sub(points[0]).cross(points[2].clone().sub(points[0])).normalize();for(let k=0;k<3;k++)assert.ok(new T.Vector3().fromBufferAttribute(p,ids[k]+layer).sub(points[k]).dot(normal)<-.0001,'lining must not appear above the outside roof');}assert.ok(checked>100);
  const columns=g.userData.hoodRingSegments;for(let row=0;row<layer-1;row+=columns+1)assert.ok(new T.Vector3().fromBufferAttribute(n,row).distanceTo(new T.Vector3().fromBufferAttribute(n,row+columns))<1e-6,'periodic roof seam must be smooth');disposeAvatar(a);
 }
});

test('the hood roof arches across the center without a sunken forehead cap',()=>{
 const a=buildAvatar({...defaults,...clothingPatch('hoodieUp')}),g=a.root.getObjectByName('FittedFabricHood').geometry,p=g.attributes.position,index=g.index.array,outer=g.groups[0],hit=new T.Vector3();
 const height=(x,z)=>{const ray=new T.Ray(new T.Vector3(x,4,z),new T.Vector3(0,-1,0));let maximum=-Infinity;for(let j=outer.start;j<outer.start+outer.count;j+=3){const triangle=[index[j],index[j+1],index[j+2]].map(i=>new T.Vector3().fromBufferAttribute(p,i));if(ray.intersectTriangle(...triangle,true,hit))maximum=Math.max(maximum,hit.y);}assert.ok(Number.isFinite(maximum));return maximum;};
 for(const z of[.22,.14,.06,-.04,-.12]){const middle=height(0,z);assert.ok(middle>=Math.max(height(-.08,z),height(.08,z))-.002,'roof center must not dip beneath either side');}disposeAvatar(a);
});

test('sleep cap is closed with consistently oriented shared edges and cloth above the skull',()=>{
 for(const detail of['verylow','low','smooth']){
  const a=buildAvatar({...defaults,detail,sleepCap:true}),cap=a.root.getObjectByName('SleepCap'),mesh=a.root.getObjectByName('FloppySleepCap'),p=mesh.geometry.attributes.position,index=mesh.geometry.index.array,edges=new Map();
  for(let j=0;j<index.length;j+=3)for(let k=0;k<3;k++){const x=index[j+k],y=index[j+(k+1)%3],key=[x,y].sort((a,b)=>a-b).join(':');const value=edges.get(key)??{count:0,sign:0};value.count++;value.sign+=x<y?1:-1;edges.set(key,value);}
  for(const {count,sign}of edges.values()){assert.equal(count,2,'no uncapped edge');assert.equal(sign,0,'faces agree on their outward orientation');}
  const crown=a.headSurface.top(0,0);for(let i=0;i<p.count-1;i++){const top=a.headSurface.top(p.getX(i),p.getZ(i));if(top!==null)assert.ok(p.getY(i)+crown>top+.018,'fabric may not pass through skull');}disposeAvatar(a);
 }
});

test('new glasses replace the original model front while retaining its exact bridge, temples and placement',()=>{
 const original=buildAvatar({...defaults,glasses:true,glassesStyle:'square'}),part=(a,name)=>{const result=[];a.root.traverse(m=>{if(m.name===name){const p=m.geometry.attributes.position;result.push(Array.from({length:p.count},(_,i)=>a.bones[5].worldToLocal(m.localToWorld(new T.Vector3().fromBufferAttribute(p,i))).toArray()).flat());}});return result;},reference={bridge:part(original,'GlassesBridge'),temples:part(original,'GlassesTemple')};
 for(const style of['sunglasses','dropSunglasses','tearRound','tearSquare']){
  const a=buildAvatar({...defaults,glasses:true,glassesStyle:style}),g=a.root.getObjectByName('Accessory-glasses'),frames=g.children.filter(m=>m.name==='GlassesFrame');assert.equal(frames.length,2);assert.equal(a.root.getObjectByName('DesignerGlasses'),undefined,'no independent head-conforming model');
  for(const [name,expected]of[['GlassesBridge',reference.bridge],['GlassesTemple',reference.temples]]){const actual=part(a,name);assert.equal(actual.length,expected.length);for(let i=0;i<actual.length;i++)for(let j=0;j<actual[i].length;j++)assert.ok(Math.abs(actual[i][j]-expected[i][j])<1e-6,style+' keeps original '+name);}
  for(const frame of frames){const p=frame.geometry.attributes.position;let min=Infinity,max=-Infinity;for(let i=0;i<p.count;i++){assert.ok([p.getX(i),p.getY(i),p.getZ(i)].every(Number.isFinite));min=Math.min(min,p.getZ(i));max=Math.max(max,p.getZ(i));}assert.ok(max-min<.05,'front geometry stays planar');const center=a.bones[5].worldToLocal(frame.getWorldPosition(new T.Vector3()));assert.ok(Math.abs(Math.abs(center.x)-.42)<1e-6);assert.ok(Math.abs(center.y-.04)<1e-6);assert.ok(Math.abs(center.z-.71)<1e-6);}disposeAvatar(a);
 }
 disposeAvatar(original);
});

test('cached garment surfaces return independent editable geometry and preserve color partitions',()=>{
 for(const kind of['hoodieUp','raglan','prison','suit']){
  const s={...defaults,body:1.083,legs:.98},one=garmentSurface(s,kind,.216),before=one.geometries.map(g=>Array.from(g.attributes.position.array)),sleeves=one.sleeves.map(s=>Array.from(s.geometry.attributes.position.array));
  one.geometries[0].translate(.4,.2,.1);for(const {geometry}of one.sleeves){geometry.translate(1,0,0);geometry.dispose();}for(const g of one.geometries)g.dispose();const two=garmentSurface({...s,clothingColor:'#ff0000'},kind,.216);two.geometries.forEach((g,i)=>assert.deepEqual(Array.from(g.attributes.position.array),before[i]));two.sleeves.forEach((s,i)=>assert.deepEqual(Array.from(s.geometry.attributes.position.array),sleeves[i]));if(kind==='prison')assert.deepEqual(two.sleeves[0].geometry.groups.map(g=>g.materialIndex),[0,1]);for(const g of[...two.geometries,...two.sleeves.map(s=>s.geometry)])g.dispose();
 }
 const v=vestSurface(defaults),before=Array.from(v.geometries[0].attributes.position.array);v.geometries[0].translate(0,1,0);v.geometries[0].dispose();const next=vestSurface(defaults);assert.deepEqual(Array.from(next.geometries[0].attributes.position.array),before);next.geometries[0].dispose();
});
