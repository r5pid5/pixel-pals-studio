import * as T from './vendor/three.module.js';
import {addHatShape} from './hats.js';
import {addBandana} from './bandana.js';
import {seatOnHead,addEarJewelry} from './head-attachments.js';

export function addExtras(head,spine,s,origin,surface){
 const material=(color,key)=>{const m=new T.MeshStandardMaterial({color,roughness:.72,side:T.DoubleSide});if(key)m.userData.colorSetting=key;return m;};
 const accent=material(s.hatColor,'hatColor'),dark=material('#423f4c'),silver=material(s.clipColor,'clipColor'),horn=material(s.hornsColor,'hornsColor');
 const mesh=(g,m,parent,pos,scale=[1,1,1])=>{const o=new T.Mesh(g,m);o.position.fromArray(pos);o.scale.fromArray(scale);o.castShadow=true;parent.add(o);return o;};
 const globe=(m,parent,pos,scale)=>mesh(new T.SphereGeometry(1,14,8),m,parent,pos,scale);
 const crown=surface.top(0,0),y=world=>world-2.05+crown-origin[1];
 const star=(radius=.12)=>{const shape=new T.Shape();for(let i=0;i<10;i++){const a=Math.PI/2+i*Math.PI/5,r=i%2?radius*.43:radius;const p=[Math.cos(a)*r,Math.sin(a)*r];i?shape.lineTo(...p):shape.moveTo(...p);}shape.closePath();return new T.ExtrudeGeometry(shape,{depth:.025,bevelEnabled:true,bevelSize:.006,bevelThickness:.006,bevelSegments:1});};
 if(s.horns)for(const side of[-1,1]){
  const o=mesh(new T.ConeGeometry(.086,.28,10),horn,head,[side*.28,y(2.13),.21]);o.rotation.z=-side*.17;}
 if(s.wings!=='none'){
  const group=new T.Group();group.name='Wings';group.position.set(0,.035,-.25);group.scale.setScalar(s.accessorySize);spine.add(group);
  if(s.wings==='devil')for(const side of[-1,1]){
   const shape=new T.Shape();shape.moveTo(.07,0);shape.quadraticCurveTo(.20,.30,.55,.43);shape.quadraticCurveTo(.75,.39,.91,.12);shape.quadraticCurveTo(.77,.15,.69,-.04);shape.quadraticCurveTo(.56,.04,.49,-.13);shape.quadraticCurveTo(.33,-.025,.19,-.19);shape.closePath();
   const o=mesh(new T.ExtrudeGeometry(shape,{depth:.045,bevelEnabled:true,bevelSize:.018,bevelThickness:.015,bevelSegments:1}),material(s.devilWingColor,'devilWingColor'),group,[0,0,0],[side*.76,.76,1]);o.rotation.y=-side*.24;
  }else for(const side of[-1,1]){
   const sh=new T.Shape();sh.moveTo(.06,0);sh.bezierCurveTo(.02,.34,.20,.46,.43,.43);sh.bezierCurveTo(.61,.38,.73,.32,.94,.34);sh.bezierCurveTo(1.04,.36,1.08,.22,.94,.14);sh.bezierCurveTo(.85,.08,.72,.10,.62,.14);sh.bezierCurveTo(.73,.02,.68,-.05,.56,-.045);sh.bezierCurveTo(.45,-.03,.43,0,.38,.07);sh.bezierCurveTo(.43,-.08,.32,-.14,.23,-.12);sh.bezierCurveTo(.10,-.11,.11,-.035,.06,0);sh.closePath();
   const o=mesh(new T.ExtrudeGeometry(sh,{depth:.08,bevelEnabled:true,bevelSize:.06,bevelThickness:.06,bevelSegments:4,curveSegments:18}),material(s.angelWingColor,'angelWingColor'),group,[0,0,0],[side*.72,.72,1]);o.rotation.y=-side*.12;
  }
 }
 if(s.hat){
  const group=new T.Group();group.name='Hat';group.userData.role='hat';head.add(group);
  if(s.hatStyle==='candyBasket'){
   const basket=material(s.basketColor,'basketColor');mesh(new T.CylinderGeometry(.53,.44,.30,18,1,true),basket,group,[0,y(2.21),-.05],[1,1,.80]);const lip=mesh(new T.TorusGeometry(.53,.025,8,20),basket,group,[0,y(2.36),-.05],[1,.80,1]);lip.rotation.x=Math.PI/2;
   mesh(new T.CylinderGeometry(.44,.44,.022,18),basket,group,[0,y(2.07),-.05],[1,1,.80]);mesh(new T.TorusGeometry(.48,.025,8,22,Math.PI),basket,group,[0,y(2.35),-.05]);
   const colors=['#e9a9bc','#a7cfc0','#ead285','#b8a2cd'];for(let i=0;i<9;i++){const angle=i*2.4,r=.18+.055*(i%3),pos=[Math.cos(angle)*r,y(2.39)+.012*(i%3),-.05+Math.sin(angle)*r*.70],candy=new T.Group();candy.position.fromArray(pos);candy.rotation.set(i*.32,i*.71,i*.43);group.add(candy);globe(material(colors[i%4]),candy,[0,0,0],[.09,.057,.057]);for(const side of[-1,1]){const wrap=mesh(new T.ConeGeometry(.045,.06,5),material(colors[i%4]),candy,[side*.105,0,0]);wrap.rotation.z=side*Math.PI/2;}}
   group.position.y=-.08;
  }else{
   addHatShape(group,s,crown,origin,star,surface);
  }
 }
 if(s.hairClip!=='none'){
  const x=-.55,py=surface.top(x,0)-.16,pz=surface.front(x,py);const group=new T.Group();group.name='HairClip';group.position.set(x,py-origin[1],pz+.014);group.rotation.z=-.30;group.rotation.y=0;group.scale.setScalar(s.accessorySize);head.add(group);
  if(s.hairClip==='star'||s.hairClip==='mixed')mesh(star(.12),silver,group,[0,0,0]);
  if(s.hairClip==='heart'){
   const sh=new T.Shape();sh.moveTo(0,-.12);sh.bezierCurveTo(-.27,.04,-.15,.22,0,.095);sh.bezierCurveTo(.15,.22,.27,.04,0,-.12);mesh(new T.ExtrudeGeometry(sh,{depth:.025,bevelEnabled:true,bevelSize:.006,bevelThickness:.006,bevelSegments:1}),silver,group,[0,0,0]);
  }else if(['cross','bar','mixed'].includes(s.hairClip))for(let i=0;i<2;i++){const o=mesh(new T.CapsuleGeometry(.014,.222,3,8).rotateZ(Math.PI/2),silver,group,[0,s.hairClip==='mixed'?-.16-i*.055:i*.08,0]);if(s.hairClip==='cross')o.rotation.z=i?-.55:.55;}
  seatOnHead(group,surface,origin);
 }
 if(s.earrings!=='none')addEarJewelry(head,s,origin,surface);
 if(s.neckAccessory!=='none'){
  if(s.neckAccessory==='choker'){const collar=mesh(new T.TorusGeometry(.18,.025,8,24),material(s.neckColor,'neckColor'),spine,[0,.275,0],[1,1,1.28]);collar.rotation.x=Math.PI/2;}
  else addBandana(spine,s);
 }
 if(s.ribbon!=='none'){
  const ribbon=material(s.ribbonColor,'ribbonColor');
  const bow=(parent,pos)=>{const g=new T.Group();g.name='Ribbon';g.userData.role='ribbon';g.position.fromArray(pos);g.scale.setScalar(s.ribbonSize);parent.add(g);for(const side of[-1,1]){const geo=new T.SphereGeometry(1,24,16),p=geo.attributes.position;for(let i=0;i<p.count;i++){const u=(p.getX(i)+1)/2;p.setXYZ(i,side*(.025+.35*u),p.getY(i)*(.065+.15*u),.105+p.getZ(i)*(.075+.025*Math.sin(Math.PI*u)));}if(side<0){const indices=geo.index.array;for(let i=0;i<indices.length;i+=3)[indices[i+1],indices[i+2]]=[indices[i+2],indices[i+1]];}geo.computeVertexNormals();const lobe=mesh(geo,ribbon,g,[0,0,0]);lobe.userData.smoothAccessory=true;}const knot=globe(ribbon,g,[0,0,.080],[.075,.085,.080]);knot.userData.smoothAccessory=true;if(parent===head)seatOnHead(g,surface,origin);};
  for(const side of[-1,1])if(s.ribbon==='both'||s.ribbon===(side<0?'left':'right')){const x=side*.51,py=surface.top(x,.17)-.22;bow(head,[x,py-origin[1],surface.front(x,py)??.30]);}
  if(s.ribbon==='top'){const py=crown-.10;bow(head,[0,py-origin[1],surface.front(0,py)??.15]);}
  if(s.ribbon==='neck')bow(spine,[0,.28,.245]);
  if(s.ribbon==='chest')bow(spine,[0,.11,.29]);
 }
 if(s.bodyCostume==='pumpkin'){
  const group=new T.Group();group.name='PumpkinCostume';group.position.y=.01;spine.add(group);const g=new T.SphereGeometry(1,64,28),p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),y=p.getY(i),lobe=Math.cos(Math.atan2(z,x)*8),belt=1-y*y,r=1-.28*(.5-.5*lobe)*belt,py=Math.sign(y)*Math.pow(Math.abs(y),.82)*(.86+.10*lobe*Math.pow(Math.max(0,belt),.2));p.setXYZ(i,x*r,py,z*r);}g.computeVertexNormals();const stem=mesh(new T.CylinderGeometry(.037,.052,.12,8),material('#82643f'),group,[0,.38,-.01]);stem.rotation.z=-.18;const pumpkinMaterial=material(s.pumpkinColor,'pumpkinColor');pumpkinMaterial.roughness=.95;const pumpkin=mesh(g,pumpkinMaterial,group,[0,0,0],[.46*s.body,.44,.50]);
  pumpkin.userData.smoothAccessory=true;
  for(const side of[-1,1]){const sh=new T.Shape();sh.moveTo(-.067,0);sh.lineTo(.067,0);sh.lineTo(0,.08);sh.closePath();mesh(new T.ExtrudeGeometry(sh,{depth:.007,bevelEnabled:false}),dark,group,[side*.145,.05,.377]);}
  const grin=new T.Shape();grin.moveTo(-.16,-.01);grin.quadraticCurveTo(0,-.13,.16,-.01);grin.lineTo(.07,-.023);grin.lineTo(.035,-.067);grin.lineTo(-.005,-.025);grin.lineTo(-.05,-.07);grin.closePath();mesh(new T.ExtrudeGeometry(grin,{depth:.009,bevelEnabled:false}),dark,group,[0,-.05,.383]);
  group.updateWorldMatrix(true,true);const ray=new T.Raycaster(),direction=new T.Vector3(0,0,-1).transformDirection(group.matrixWorld);for(const mark of group.children.filter(o=>o.material===dark)){mark.updateMatrix();const inverse=mark.matrix.clone().invert(),positions=mark.geometry.attributes.position;for(let i=0;i<positions.count;i++){const v=new T.Vector3().fromBufferAttribute(positions,i).applyMatrix4(mark.matrix),depth=v.z-mark.position.z,start=new T.Vector3(v.x,v.y,3).applyMatrix4(group.matrixWorld);ray.set(start,direction);const hit=ray.intersectObject(pumpkin,false)[0];if(hit){group.worldToLocal(hit.point);v.z=hit.point.z+depth+.003;v.applyMatrix4(inverse);positions.setXYZ(i,...v.toArray());}}mark.geometry.computeVertexNormals();}
 }
 if(s.mug){
  const group=new T.Group();group.name='MugCostume';group.position.y=-.015;spine.add(group);const ceramic=new T.MeshStandardMaterial({color:s.mugColor,roughness:.38});ceramic.userData.colorSetting='mugColor';
  const profile=[[.22,-.235],[.28,-.235],[.33,-.21],[.35,-.15],[.35,.17],[.345,.235],[.327,.25],[.305,.235],[.313,.205],[.313,-.15],[.28,-.195],[.22,-.195]],g=new T.LatheGeometry(profile.map(([r,y])=>new T.Vector2(r,y)),24);mesh(g,ceramic,group,[0,0,0],[s.body*1.1,1.3,1.14]);
  const handle=mesh(new T.TorusGeometry(.145,.037,10,24),ceramic,group,[.385*s.body+.08,-.01,0],[.85,1,1]);handle.userData.smoothAccessory=true;
 }
}
