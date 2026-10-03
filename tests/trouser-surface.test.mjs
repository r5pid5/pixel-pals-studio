import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three.module.js';
import {buildAvatar,defaults,poseAvatar,disposeAvatar} from '../dist/avatar.js';
import {clothingPatch} from '../dist/clothing-options.js';
const context={clearRect(){},quadraticCurveTo(){},fillRect(){},drawImage(){},beginPath(){},closePath(){},moveTo(){},lineTo(){},bezierCurveTo(){},clip(){},stroke(){},ellipse(){},fill(){},save(){},restore(){},translate(){},scale(){},rotate(){},createLinearGradient(){return{addColorStop(){}};},createRadialGradient(){return{addColorStop(){}};}};
globalThis.document={createElement(){return{width:0,height:0,getContext:()=>context};}};
const kinds=['pajamas','spacesuit','suit','uniform','prison','overalls'];
const pointKey=p=>p.toArray().map(v=>Math.round(v*1e7)).join('|');
function topology(mesh){
 const g=mesh.geometry,p=g.attributes.position,ii=g.index?Array.from(g.index.array):Array.from({length:p.count},(_,i)=>i),edges=new Map(),adjacency=new Map(),points=new Map(),v=new T.Vector3();
 for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);points.set(i,pointKey(v));}
 for(let i=0;i<ii.length;i+=3){const tri=ii.slice(i,i+3),positions=tri.map(j=>new T.Vector3().fromBufferAttribute(p,j));assert.ok(positions[1].clone().sub(positions[0]).cross(positions[2].clone().sub(positions[0])).lengthSq()>1e-30,'non-degenerate face');
  for(let j=0;j<3;j++){const a=points.get(tri[j]),b=points.get(tri[(j+1)%3]);if(a===b)continue;const key=[a,b].sort().join(' / ');if(!edges.has(key))edges.set(key,{a,b,count:0,balance:0});const edge=edges.get(key);edge.count++;edge.balance+=a<b?1:-1;if(!adjacency.has(a))adjacency.set(a,new Set());if(!adjacency.has(b))adjacency.set(b,new Set());adjacency.get(a).add(b);adjacency.get(b).add(a);}
 }
 const connected=start=>{const visited=new Set([start]),queue=[start];for(const a of queue)for(const b of adjacency.get(a)??[])if(!visited.has(b)){visited.add(b);queue.push(b);}return visited;};
 return{edges:[...edges.values()],connected:connected(adjacency.keys().next().value).size,total:adjacency.size};
}
test('trousers have one connected waist and crotch with only a waist and two cuff boundaries',()=>{
 for(const kind of kinds)for(const[body,legs]of[[.75,.65],[1.2,1],[1.35,1.45]]){
  const a=buildAvatar({...defaults,...clothingPatch(kind),body,legs,tail:'none'}),m=a.root.getObjectByName(kind==='overalls'?'OverallShell':'GarmentTrousers'),g=m.geometry,p=g.attributes.position;
  assert.ok(m,kind+' continuous trousers');assert.ok(Array.from(p.array).every(Number.isFinite));
  let data;try{data=topology(m);}catch(error){error.message+=' / '+kind+' / '+body+' / '+legs;throw error;}assert.equal(data.connected,data.total,kind+' must be one connected surface');
  assert.ok(data.edges.every(e=>e.count<=2&&e.count>0),kind+' no non-manifold edge');assert.ok(data.edges.filter(e=>e.count===2).every(e=>e.balance===0),kind+' consistent faces');
  const boundary=new Map();for(const e of data.edges.filter(e=>e.count===1)){if(!boundary.has(e.a))boundary.set(e.a,new Set());if(!boundary.has(e.b))boundary.set(e.b,new Set());boundary.get(e.a).add(e.b);boundary.get(e.b).add(e.a);}
  assert.ok([...boundary.values()].every(v=>v.size===2),kind+' no extra tears or branching edges');
  let loops=0;const visited=new Set();for(const start of boundary.keys()){if(visited.has(start))continue;loops++;const queue=[start];visited.add(start);for(const key of queue)for(const next of boundary.get(key))if(!visited.has(next)){visited.add(next);queue.push(next);}}
  assert.equal(loops,3,kind+' only waist/bib edge and two cuff loops');
  const si=g.attributes.skinIndex,sw=g.attributes.skinWeight;for(let i=0;i<p.count;i++){let sum=0;for(let j=0;j<4;j++){sum+=sw.array[i*4+j];assert.ok(si.array[i*4+j]<22);}assert.ok(Math.abs(sum-1)<1e-5,kind+' normalized skin weights');}
  disposeAvatar(a);
 }
});
test('the shared trouser seam stays joined through standing, walking and seated poses',()=>{
 for(const kind of kinds){const a=buildAvatar({...defaults,...clothingPatch(kind),tail:'none'}),m=a.root.getObjectByName(kind==='overalls'?'OverallShell':'GarmentTrousers'),p=m.geometry.attributes.position,shared=new Map();for(let i=0;i<p.count;i++){const key=pointKey(new T.Vector3().fromBufferAttribute(p,i));if(!shared.has(key))shared.set(key,[]);shared.get(key).push(i);}
  for(const motion of['still','walk','dance','picnicDrink','readTogether'])for(const time of[.4,1.5,3,4.5]){poseAvatar(a,motion,time);a.root.updateMatrixWorld(true);m.skeleton.update();for(const vertices of shared.values()){if(vertices.length<2)continue;const first=m.applyBoneTransform(vertices[0],new T.Vector3().fromBufferAttribute(p,vertices[0]));for(const i of vertices.slice(1))assert.ok(first.distanceTo(m.applyBoneTransform(i,new T.Vector3().fromBufferAttribute(p,i)))<2e-5,kind+' coincident seam must not separate');}}
  disposeAvatar(a);
 }
});
test('low waist rays from all eight directions reach blue overalls or the vest and shorts without exposed shirt or skin',()=>{
 for(const kind of['overalls','uniform'])for(const[body,legs]of[[.75,.65],[1.2,1],[1.35,1.45]]){
  const a=buildAvatar({...defaults,...clothingPatch(kind),body,legs,tail:'none'});poseAvatar(a,'still',0);a.root.updateMatrixWorld(true);a.root.traverse(m=>{if(m.isSkinnedMesh){m.skeleton.update();m.computeBoundingSphere();}});
  const meshes=[];a.root.traverse(m=>{if(m.isMesh&&!m.userData.outline)meshes.push(m);});const color=kind==='uniform'?'clothingSecondaryColor':'clothingColor',shift=(1.54/5.2)*(legs-1);
  // Ray/triangle arithmetic can miss the exact shared x=0 edge. Its joined
  // topology is checked above; sample both sides immediately beside it here.
  for(let direction=0;direction<8;direction++)for(const x of[-.20,-.10,-.00001,.00001,.10,.20]){
   const angle=direction*Math.PI/4,tangent=new T.Vector3(Math.cos(angle),0,-Math.sin(angle)),scale=1/Math.hypot(tangent.x/body,tangent.z/.79),target=tangent.multiplyScalar(x*scale).add(new T.Vector3(0,.32+shift,0)),origin=target.clone().add(new T.Vector3(Math.sin(angle)*4,-1,Math.cos(angle)*4)),ray=new T.Raycaster(origin,target.clone().sub(origin).normalize());const hit=ray.intersectObjects(meshes,false)[0];assert.ok(hit,kind+' waist covered '+x+' / '+body+' / '+legs+' / '+direction);const m=Array.isArray(hit.object.material)?hit.object.material[hit.face.materialIndex]:hit.object.material;assert.equal(m.userData.colorSetting,color,kind+' waist has no exposed shirt/skin at '+x+' / '+body+' / '+legs+' / '+direction+' hit '+hit.object.name);
  }disposeAvatar(a);
 }
});
test('pants conceal upper leg skin while preserving the visible feet and restoring bare legs when removed',async()=>{
 const {bodyGeometry}=await import('../dist/body-sculpt.js'),{mergedBody}=await import('../dist/merged-body.js');
 for(const kind of kinds)for(const side of[12,15]){
  const s={...defaults,...clothingPatch(kind),body:.75,legs:.65},g=bodyGeometry(side,s),bare=bodyGeometry(side,{...s,clothing:'none'}),cut=((kind==='uniform'?.165:.08)+.018)*s.legs;
  const points=geometry=>new Set(Array.from({length:geometry.attributes.position.count},(_,i)=>{const p=new T.Vector3().fromBufferAttribute(geometry.attributes.position,i);return p.y<(kind==='uniform'?.165:.08)*s.legs-.001?pointKey(p):null;}).filter(Boolean));
  assert.ok(Array.from({length:g.attributes.position.count},(_,i)=>g.attributes.position.getY(i)).every(y=>y<=cut+1e-7),kind+' upper leg hidden');assert.deepEqual(points(g),points(bare),kind+' visible feet unchanged');g.dispose();bare.dispose();
 }
 const s={...defaults,body:.913,legs:.927},bare=mergedBody({...s,clothing:'tee'});for(const clothing of['uniform','overalls','hoodie','tee']){const g=mergedBody({...s,clothing});if(clothing==='tee')assert.deepEqual(g.attributes.position.array,bare.attributes.position.array,'cache restores bare leg geometry');g.dispose();}bare.dispose();
});
test('the complete overalls pocket remains outside the sewn bib and waist in all three body proportions',()=>{
 for(const[body,legs]of[[.75,.65],[1.2,1],[1.35,1.45]]){
  const a=buildAvatar({...defaults,...clothingPatch('overalls'),body,legs,tail:'none'}),shell=a.root.getObjectByName('OverallShell'),pocket=a.root.getObjectByName('GarmentPocket');poseAvatar(a,'still',0);a.root.updateMatrixWorld(true);shell.skeleton.update();shell.computeBoundingSphere();
  const p=pocket.geometry.attributes.position,n=pocket.geometry.attributes.normal;let checked=0;
  for(let i=0;i<p.count;i+=3){if(n.getZ(i)<.5)continue;const center=new T.Vector3();for(let j=0;j<3;j++)center.add(pocket.applyBoneTransform(i+j,new T.Vector3().fromBufferAttribute(p,i+j)));center.multiplyScalar(1/3);const ray=new T.Raycaster(new T.Vector3(center.x,center.y,3),new T.Vector3(0,0,-1)),hit=ray.intersectObject(shell,false)[0];assert.ok(hit,'pocket lies on fabric');assert.ok(center.z>hit.point.z+.006,'pocket must not disappear into the waist');checked++;}
  assert.ok(checked>20);disposeAvatar(a);
 }
});
