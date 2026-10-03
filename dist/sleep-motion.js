import * as T from './vendor/three.module.js';
import {headTexture} from './head-texture.js';
import {faceTexture} from './face.js';

export const sleepMotionNames={sleepSprawl:'풀밭 · 대자로 자기',sleepProne:'풀밭 · 엎드려 자기'};
export const sleepMotions=new Set(Object.keys(sleepMotionNames));
const cache=new WeakMap(),axisX=new T.Vector3(1,0,0),axisY=new T.Vector3(0,1,0);

// One colored mesh for the turf, short edge blades and tiny daisies. No
// animated particles or per-blade scene objects are needed for a quiet nap.
export function createGrassPatch(){
 const positions=[],colors=[],green=new T.Color(),v=(x,y,z,color)=>{positions.push(x,y,z);green.set(color);colors.push(green.r,green.g,green.b);};
 const triangle=(a,b,c,color)=>{v(...a,color);v(...b,color);v(...c,color);};
 const count=144,ring=Array.from({length:count},(_,i)=>{const t=i/count*Math.PI*2,r=1+.006*Math.sin(i*1.7)+.004*Math.sin(i*3.3);return[Math.cos(t)*r,.025,Math.sin(t)*r];});
 for(let i=0;i<count;i++){
  const a=ring[i],b=ring[(i+1)%count];
  const edgeTone=point=>new T.Color('#9cbba2').lerp(new T.Color('#b3cba6'),.4+.18*Math.sin(Math.atan2(point[2],point[0])*3)).getHex();
  v(0,.025,0,'#afc8a8');v(...b,edgeTone(b));v(...a,edgeTone(a));
  triangle(a,b,[b[0],-.008,b[2]],'#89aa8b');triangle(a,[b[0],-.008,b[2]],[a[0],-.008,a[2]],'#89aa8b');
  const r=.89+.07*(.5+.5*Math.sin(i*2.1)),t=i/count*Math.PI*2,x=Math.cos(t)*r,z=Math.sin(t)*r,w=.009,h=.020+.012*(.5+.5*Math.sin(i*3.1));
  triangle([x-w,.026,z],[x+.004,h+.026,z-.009],[x+w,.026,z],i%3?'#bcd3aa':'#8eaf94');
  triangle([a[0]-.007,.026,a[2]],[a[0]*1.019,.035,a[2]*1.019],[a[0]+.007,.026,a[2]],'#a9c49f');
 }
 for(let i=0;i<7;i++){
  const angle=.4+i*2.4,r=.82+.05*Math.sin(i*1.9),x=Math.cos(angle)*r,z=Math.sin(angle)*r;
  for(let j=0;j<20;j++){
   const a=j/20*Math.PI*2,b=(j+1)/20*Math.PI*2,ra=.018+.008*Math.cos(a*5),rb=.018+.008*Math.cos(b*5);
   triangle([x,.029,z],[x+Math.cos(b)*rb,.029,z+Math.sin(b)*rb],[x+Math.cos(a)*ra,.029,z+Math.sin(a)*ra],'#f4eed9');
  }
  for(let j=0;j<8;j++){const a=j/8*Math.PI*2,b=(j+1)/8*Math.PI*2;triangle([x,.030,z],[x+Math.cos(b)*.006,.030,z+Math.sin(b)*.006],[x+Math.cos(a)*.006,.030,z+Math.sin(a)*.006],'#d8b86a');}
 }
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));geometry.computeVertexNormals();
 const group=new T.Group();group.name='MotionProp-sleepGrass';group.userData.motionProp=true;group.userData.sleepGrass=true;
 const mesh=new T.Mesh(geometry,new T.MeshStandardMaterial({vertexColors:true,roughness:1,side:T.DoubleSide}));mesh.name='RoundGrass';mesh.receiveShadow=true;group.add(mesh);return group;
}
function entry(a){let e=cache.get(a);if(!e){e={fits:new Map(),grass:createGrassPatch(),awake:a.face.material.map};a.root.add(e.grass);cache.set(a,e);}return e;}
export function restoreSleepFace(a){const e=cache.get(a);if(e&&a.face.material.map===e.asleep)a.face.material.map=e.awake;}
export function resetSleepMotion(a){const e=cache.get(a);if(e){e.grass.visible=false;if(e.tail){e.tail.node.quaternion.copy(e.tail.quaternion);e.tail=null;}}if(a.dessertBase)a.dessertBase.visible=true;restoreSleepFace(a);}
export function disposeSleepMotion(a){const e=cache.get(a);if(!e)return;restoreSleepFace(a);e.asleep?.dispose();cache.delete(a);}
export function sleepFootprint(a){return cache.get(a)?.footprint;}

function sleepingFace(a,e,s){
 if(e.faceState!==s){
  e.asleep?.dispose();const state={...s,expression:'sleepy',rightExpression:'sleepy',independentEyes:false};
  e.asleep=a.fromProvidedModel?headTexture(state):faceTexture(state);e.faceState=s;
 }
 a.face.material.map=e.asleep;
}
function basePose(a,motion,t,headLift=0,tuck=0){
 for(const bone of a.bones){bone.position.copy(bone.userData.restPosition);bone.quaternion.copy(bone.userData.restQuaternion);}
 const b=a.bones,prone=motion==='sleepProne',phase=t*Math.PI/3,breath=.5-.5*Math.cos(phase*2);
 b[1].quaternion.setFromAxisAngle(axisX,prone?Math.PI/2:-Math.PI/2);
 if(prone)b[1].quaternion.premultiply(new T.Quaternion().setFromAxisAngle(axisY,Math.PI));
 b[0].position.y-=a.dessertBaseHeight??0;
 // Bring the small torso up to the head's lower rim while leaving the head
 // at its independently grounded position. Moving only the neck vertically
 // exposes the torso's tapered top as a long horizontal neck in side views.
 b[2].position.y+=tuck;b[4].position.y-=tuck;
 // Only sleeping separates their support heights: the small body lies flat
 // while the large head rests beside it. Standing proportions stay intact.
 b[4].position.z+=(prone?-1:1)*headLift;
 b[5].rotation.x+=prone?-.12:.12;
 b[3].position.z+=(prone?-.008:.008)*breath;
 if(prone){
  // Face rests on a cheek, with elbows out and hands beside the pillow-like
  // head. Bent knees lift the feet slightly instead of driving them down.
  b[5].rotation.y-=.85;b[5].rotation.z+=.045+.008*Math.sin(phase*2);
  b[7].rotation.z+=.52;b[11].rotation.z-=.52;
  b[7].rotation.x-=.65;b[11].rotation.x-=.65;
  b[8].rotation.x-=.65;b[12].rotation.x-=.65;
  b[14].rotation.z+=.10;b[17].rotation.z-=.10;
  b[15].rotation.x+=.30+.025*Math.sin(phase*2);b[18].rotation.x+=.30-.025*Math.sin(phase*2);
 }else{
  b[7].rotation.z+=.92;b[11].rotation.z-=.92;
  b[8].rotation.z-=.08;b[12].rotation.z+=.08;
  b[14].rotation.z+=.23;b[17].rotation.z-=.23;
  b[5].rotation.z+=.010*Math.sin(phase*2);
 }
 a.root.updateMatrixWorld(true);
}
function neckTuck(a){
 // Locate the head's actual lower rim at the torso's neck-base height.
 // This is evaluated once per fit so small heads and long legs also meet.
 const s=a.root.userData.pixelPals.state,shift=(1.54/5.2)*(s.legs-1),bind=new T.Vector3(0,.838+shift,0).applyMatrix4(a.face.skeleton.boneInverses[3]),junction=a.root.worldToLocal(a.bones[3].localToWorld(bind)),ray=new T.Ray(junction,new T.Vector3(0,0,-1)),inverse=a.root.matrixWorld.clone().invert(),p=a.face.geometry.attributes.position,indices=a.face.geometry.index?.array??Array.from({length:p.count},(_,i)=>i),vertices=[],hit=new T.Vector3();
 a.face.skeleton.update();for(let i=0;i<p.count;i++){const v=new T.Vector3().fromBufferAttribute(p,i);a.face.applyBoneTransform(i,v);vertices.push(v.applyMatrix4(a.face.matrixWorld).applyMatrix4(inverse));}
 let distance=Infinity;for(let i=0;i<indices.length;i+=3)if(ray.intersectTriangle(vertices[indices[i]],vertices[indices[i+1]],vertices[indices[i+2]],true,hit))distance=Math.min(distance,junction.distanceTo(hit));
 return Number.isFinite(distance)?distance+.035:0;
}
function fit(a){
 const inverse=a.root.matrixWorld.clone().invert(),point=new T.Vector3(),box=new T.Box3(),points=[];
 let headMin=Infinity,bodyMin=Infinity;
 a.root.traverse(o=>{
  if(!o.isMesh||o.userData.outline)return;
  for(let parent=o;parent;parent=parent.parent)if(parent.userData.motionProp||parent.userData.dessertBase)return;
  const attr=o.geometry.attributes.position;if(!attr)return;if(o.isSkinnedMesh)o.skeleton.update();
  for(let i=0;i<attr.count;i++){
   point.fromBufferAttribute(attr,i);if(o.isSkinnedMesh)o.applyBoneTransform(i,point);point.applyMatrix4(o.matrixWorld).applyMatrix4(inverse);
   box.expandByPoint(point);points.push(point.x,point.z);
   const sk=o.geometry.attributes.skinIndex,sw=o.geometry.attributes.skinWeight;
   let onHead=o===a.face;for(let parent=o;parent;parent=parent.parent)if(parent===a.bones[5])onHead=true;
   if(sk&&sw)for(let j=0;j<4;j++)if(sk.array[i*4+j]===5&&sw.array[i*4+j]>.5)onHead=true;
   if(onHead)headMin=Math.min(headMin,point.y);
   if(['SculptedBody','GarmentTorso','GarmentTrousers','OverallShell'].includes(o.name))bodyMin=Math.min(bodyMin,point.y);
  }
 });
 const x=(box.min.x+box.max.x)/2,z=(box.min.z+box.max.z)/2;let radius=0;
 for(let i=0;i<points.length;i+=2)radius=Math.max(radius,Math.hypot(points[i]-x,points[i+1]-z));
 return{lift:.042-box.min.y,x,z,radius:radius+.20,headMin,bodyMin};
}
export function poseSleep(a,motion,t){
 if(!sleepMotions.has(motion)){resetSleepMotion(a);return false;}
 const e=entry(a),s=a.root.userData.pixelPals.state,key=motion+JSON.stringify(s.accessoryTransforms??{});
 const tail=a.root.getObjectByName('Accessory-tail');if(tail){e.tail??={node:tail,quaternion:tail.quaternion.clone()};tail.quaternion.copy(e.tail.quaternion).multiply(new T.Quaternion().setFromAxisAngle(axisX,motion==='sleepProne'?-Math.PI/2:Math.PI/2));}
 if(a.dessertBase)a.dessertBase.visible=false;
 if(!e.fits.has(key)){
  // Ground fitting runs once per new avatar/pose/placement, never in the
  // playback loop. Quiet breathing leaves a small grass-height clearance.
  basePose(a,motion,0);const rest=fit(a),headLift=Math.max(0,rest.bodyMin-rest.headMin);
  basePose(a,motion,0,headLift);const tuck=neckTuck(a);basePose(a,motion,0,headLift,tuck);e.fits.set(key,{...fit(a),headLift,tuck});
 }
 const f=e.fits.get(key);basePose(a,motion,t,f.headLift,f.tuck);a.bones[1].position.y+=f.lift;
 e.grass.position.set(f.x,0,f.z);e.grass.scale.set(f.radius,1,f.radius);e.grass.visible=!a.sharedGrass;e.footprint=f;
 sleepingFace(a,e,s);a.root.updateMatrixWorld(true);return true;
}
