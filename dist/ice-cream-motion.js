import * as T from './vendor/three.module.js';
import {turned,pastryBuilder,batchPastry} from './dessert-shapes.js';
import {hand as aimHand} from './social-motion.js';

export const iceCreamMotionNames={iceCream:'아이스크림 · 와플 콘'};
const cache=new WeakMap();

function armGeometry(geometry){
 const result=new T.BufferGeometry(),selected=[],skin=geometry.attributes.skinIndex,weights=geometry.attributes.skinWeight;
 const indices=geometry.index?.array??Array.from({length:skin.count},(_,i)=>i);
 const isArm=i=>{let total=0;for(let k=0;k<4;k++)if(skin.array[i*4+k]>=7&&skin.array[i*4+k]<=13)total+=weights.array[i*4+k];return total>.7;};
 for(let i=0;i<indices.length;i+=3)if([indices[i],indices[i+1],indices[i+2]].every(isArm))selected.push(indices[i],indices[i+1],indices[i+2]);
 for(const[name,attr]of Object.entries(geometry.attributes)){const array=new attr.array.constructor(selected.length*attr.itemSize);selected.forEach((i,j)=>array.set(attr.array.subarray(i*attr.itemSize,(i+1)*attr.itemSize),j*attr.itemSize));result.setAttribute(name,new T.BufferAttribute(array,attr.itemSize,attr.normalized));}
 if(geometry.groups.length){let offset=0;for(const g of geometry.groups){let count=0;for(let i=g.start;i<g.start+g.count;i+=3)if([indices[i],indices[i+1],indices[i+2]].every(isArm))count+=3;result.addGroup(offset,count,g.materialIndex);offset+=count;}}
 return result;
}
function makeCone(s,r,height){
 const g=new T.Group();g.name='MotionProp-iceCream';g.userData.motionProp=true;
 const p=pastryBuilder(s),profile=[[0,0],[.018,.022],[r*.13,height*.16],[r*.50,height*.52],[r*.91,height*.91],[r,height],[r-.024,height+.002],[0,height+.002]];
 p.add(g,turned(profile,64),'#d4b17e',[0,0,0],[1,1,1],'BakedWaffleCone');
 // Two sets of helical ridges form raised diamonds on the actual cone.
 for(const direction of[-1,1])for(let j=0;j<14;j++){
  const points=[];for(let i=0;i<=40;i++){const t=.045+i/40*.95,a=j/14*Math.PI*2+direction*t*3.5,rad=r*t+.002;points.push([Math.cos(a)*rad,height*t,Math.sin(a)*rad]);}
  p.tube(g,points,'#bd9668',.007,'WaffleDiamondRidge');
 }
 const rim=p.add(g,new T.TorusGeometry(r,.018,8,80),'#dfc192',[0,height,0],[1,1,1],'WaffleRim');rim.rotation.x=Math.PI/2;
 p.add(g,turned([[0,0],[r*.83,0],[r*.97,.025],[r*.92,.075],[r*.78,.095],[0,.095]],64,{lobes:10,amplitude:.025}),'#f4e7cf',[0,height-.014,0],[1,1,1],'ScoopBase');
 return batchPastry(g);
}
function headBounds(a){
 a.root.updateMatrixWorld(true);a.face.skeleton.update();const box=new T.Box3(),v=new T.Vector3(),inverse=a.root.matrixWorld.clone().invert(),p=a.face.geometry.attributes.position;
 for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);a.face.applyBoneTransform(i,v);v.applyMatrix4(a.face.matrixWorld).applyMatrix4(inverse);box.expandByPoint(v);}return box;
}
function entry(a){
 let e=cache.get(a);if(e)return e;
 const s=a.root.userData.pixelPals.state,body=a.root.getObjectByName('SculptedBody'),bounds=headBounds(a),radius=(bounds.max.x-bounds.min.x)*.39,top=bounds.min.y+.035,height=top-.025;
 const cone=makeCone(s,radius,height);cone.position.y=.025;a.root.add(cone);
 const hidden=[];a.root.traverse(o=>{if(o.name==='Clothing'||o.name==='Accessory-tail'||o.name==='Accessory-bodyCostume'||o.name==='Accessory-mug'||o.name==='Accessory-guitar'||o.name==='Accessory-laptop'||o.name==='Accessory-syringe'||o.parent===a.bones[3]&&o.isMesh||o.parent===body&&o.userData.outline)hidden.push([o,o.visible]);});
 e={body,original:body.geometry,arms:armGeometry(body.geometry),cone,radius,top,hidden};cache.set(a,e);return e;
}
export function resetIceCreamMotion(a){
 const e=cache.get(a);if(!e||!e.active)return;
 e.body.geometry=e.original;e.cone.visible=false;for(const[o,visible]of e.hidden)o.visible=visible;if(a.dessertBase)a.dessertBase.visible=true;e.active=false;
}
export function disposeIceCreamMotion(a){resetIceCreamMotion(a);const e=cache.get(a);e?.arms.dispose();cache.delete(a);}
export function iceCreamFootprint(a){const e=cache.get(a);return e?{radius:e.radius,top:e.top}:undefined;}
export function poseIceCream(a,motion,t){
 if(motion!=='iceCream'){resetIceCreamMotion(a);return false;}
 a.bones[0].position.y-=a.dessertBaseHeight??0;a.bones[1].position.y+=.50;
 const e=entry(a),p=t*Math.PI/3,sway=.018*Math.sin(p*2);e.active=true;e.body.geometry=e.arms;e.cone.visible=true;for(const[o]of e.hidden)o.visible=false;if(a.dessertBase)a.dessertBase.visible=false;
 a.bones[5].rotation.z+=sway;a.bones[5].position.y+=.008*(.5-.5*Math.cos(p*2));
 // Both paws hang over the front lip, while their arms remain joined to
 // the original rig inside the cone. Clothing and the full body restore
 // on every exit, recolor or model export.
 for(const[index,side]of[[7,1],[11,-1]]){const x=side*e.radius*.37,z=Math.sqrt(e.radius**2-x*x)+.018,target=a.root.localToWorld(new T.Vector3(x,e.top-.045,z));aimHand(a,index,target,[side,-1,.2]);}
 a.root.updateMatrixWorld(true);return true;
}
