import * as T from './vendor/three.module.js';
import {addWhaleTail} from './whale-tail.js';
import {addSquirrelTail} from './squirrel-tail.js';

export function addTail(hips,s){
 if(s.tail==='none')return;
 const anchor=new T.Vector3(0,.035,-.24),group=new T.Group();group.position.copy(anchor);group.name='Tail';group.userData.role='tail';group.scale.setScalar(s.tailSize);hips.add(group);
 const length=s.tailLength??1,thickness=s.tailThickness??1,point=p=>new T.Vector3(...p).sub(anchor).multiplyScalar(length).add(anchor);
 const color=s.tailSeparate?s.tailColor:s.bodyColor,material=new T.MeshStandardMaterial({color,roughness:.78});material.userData.colorSetting=s.tailSeparate?'tailColor':'bodyColor';const tip=(roughness)=>{const m=new T.MeshStandardMaterial({color:s.tailTipColor,roughness});m.userData.colorSetting='tailTipColor';return m;};
 if(s.tail==='whale'){addWhaleTail(group,material,anchor,s);return;}
 if(s.tail==='squirrel'){addSquirrelTail(group,material,anchor,s);return;}
 const add=(g,absolute=true)=>{if(absolute)g.translate(-anchor.x,-anchor.y,-anchor.z);const o=new T.Mesh(g,material);o.castShadow=true;o.userData.role='tail';group.add(o);return o;};
 const oval=(position,scale)=>{const o=add(new T.SphereGeometry(1,14,10),false);o.position.copy(point(position)).sub(anchor);o.scale.fromArray(scale).multiplyScalar(thickness);return o;};
 if(s.tail==='puff'){const o=oval([0,.015,-.37],[.21,.21,.21]);o.scale.z*=length;return;}
 if(s.tail==='stub'){const o=oval([0,.015,-.39],[.13,.13,.29]);o.scale.z*=length;o.rotation.y=0;return;}
 if(s.tail==='pig'){
  const points=[new T.Vector3(0,.035,-.24),new T.Vector3(0,.035,-.40)];for(let i=0;i<=30;i++){const a=i/30*Math.PI*3.5;points.push(new T.Vector3(Math.cos(a)*.07,.045+Math.sin(a)*.07,-.46-i*.007));}add(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>point(p.toArray()))),50,.034*thickness,8,false));oval(points.at(-1).toArray(),[.034,.034,.034]);return;
 }
 const paths={curl:[[0,.04,-.23],[.03,.04,-.47],[.11,.12,-.71],[.20,.28,-.90],[.18,.44,-.95]],long:[[0,.035,-.24],[.02,-.015,-.46],[.09,.025,-.80],[.12,.08,-1.10]],curled:[[0,.035,-.24],[.05,-.02,-.44],[.11,.15,-.64],[.13,.39,-.70],[.05,.53,-.66],[-.025,.40,-.57]],fluffy:[[0,.035,-.24],[.04,0,-.48],[.12,-.02,-.72],[.20,.035,-.91],[.21,.15,-1.02]]};
 paths.raccoon=paths.long;paths.fish=[[0,.035,-.24],[.02,.035,-.43],[.05,.10,-.62],[.07,.18,-.79]];paths.devil=[[0,.035,-.24],[.04,.08,-.46],[.13,.23,-.67],[.16,.42,-.78],[.08,.56,-.75]];paths.wolf=[[0,.035,-.24],[.03,-.035,-.47],[.12,-.10,-.68],[.16,-.06,-.84]];paths.dog=[[0,.035,-.24],[.03,.09,-.41],[.08,.25,-.56],[.11,.45,-.61]];
 const points=paths[s.tail].map(point),curve=new T.CatmullRomCurve3(points),count=24,fluffy=['fluffy','wolf'].includes(s.tail),radius=s.tail==='raccoon'?.115:s.tail==='devil'?.039:.065;
 const g=new T.TubeGeometry(curve,count,1,fluffy?12:10,false),p=g.attributes.position;
 for(let ring=0;ring<=count;ring++){
  const t=ring/count,center=curve.getPointAt(t),r=fluffy?.012+(.055+.17*Math.pow(Math.sin(Math.PI*t),.8))*(t>.91?Math.sqrt((1-t)/.09):1):radius;
  for(let j=0;j<=g.parameters.radialSegments;j++){const i=ring*(g.parameters.radialSegments+1)+j,v=new T.Vector3().fromBufferAttribute(p,i).sub(center).multiplyScalar(r*thickness).add(center);p.setXYZ(i,...v.toArray());}
 }
 g.computeVertexNormals();const normals=g.attributes.normal;for(let ring=0;ring<=count;ring++){const first=ring*(g.parameters.radialSegments+1),last=first+g.parameters.radialSegments,n=new T.Vector3().fromBufferAttribute(normals,first).add(new T.Vector3().fromBufferAttribute(normals,last)).normalize();normals.setXYZ(first,...n.toArray());normals.setXYZ(last,...n.toArray());}
 const portion=(start,end,m)=>{const part=g.clone();part.setIndex(Array.from(g.index.array).slice(start,end));const o=add(part);o.material=m;return o;};
 if(s.tail==='fluffy'){
  const split=18*g.parameters.radialSegments*6;portion(0,split,material);portion(split,g.index.count,tip(.9));g.dispose();
 }else if(s.tail==='raccoon'){
  const band=4*g.parameters.radialSegments*6;for(let i=0;i<6;i++)portion(i*band,(i+1)*band,i%2?tip(.8):material);g.dispose();
 }else add(g);
 const rootRadius=fluffy?.067:radius;oval(new T.Vector3(...paths[s.tail][0]).toArray(),[rootRadius,rootRadius,rootRadius]);if(fluffy)oval(paths[s.tail].at(-1),[.012,.012,.012]);else oval(paths[s.tail].at(-1),[radius,radius,radius]);
 if(['fish','devil'].includes(s.tail)){
  const sh=new T.Shape();
  if(s.tail==='fish'){sh.moveTo(0,-.035);sh.quadraticCurveTo(-.10,.08,-.19,.29);sh.quadraticCurveTo(-.08,.27,0,.19);sh.quadraticCurveTo(.08,.27,.19,.29);sh.quadraticCurveTo(.10,.08,0,-.035);}else{sh.moveTo(0,-.05);sh.bezierCurveTo(-.05,-.025,-.11,.015,-.13,.065);sh.quadraticCurveTo(-.14,.135,-.085,.16);sh.quadraticCurveTo(-.03,.18,0,.245);sh.quadraticCurveTo(.03,.18,.085,.16);sh.quadraticCurveTo(.14,.135,.13,.065);sh.bezierCurveTo(.11,.015,.05,-.025,0,-.05);}sh.closePath();const fin=add(new T.ExtrudeGeometry(sh,{depth:s.tail==='whale'?.10:.045,bevelEnabled:true,bevelSize:s.tail==='whale'?.065:.018,bevelThickness:s.tail==='whale'?.065:.018,bevelSegments:5,curveSegments:20}),false);fin.geometry.scale(1,1,thickness);fin.position.copy(points.at(-1)).sub(anchor);fin.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),curve.getTangentAt(1).normalize());if(s.tail==='fish')fin.rotateY(Math.PI/2);fin.userData.smoothAccessory=true;
 }
}
