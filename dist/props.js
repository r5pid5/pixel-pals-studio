import {addGuitar} from './guitar.js';
import {addWhippedCream} from './dessert-bases.js';
import {addSpaceHelmet} from './space-helmet.js';
import {addSyringe} from './syringe.js';
import {addSleepCap} from './sleep-cap.js';
import * as T from './vendor/three.module.js';
import {wearableMaterial,solidMesh,ball,lineTube,fabricShape,roundBox} from './wearable-meshes.js';

export function addProps(head,spine,bones,s,origin,surface,headGeometry){
 if(surface&&origin)addWhippedCream(head,s,origin,surface);
 if(s.syringe)addSyringe(spine,s);
 const material=(key,color,options)=>wearableMaterial(s,key,color,options);
 const dark=material(null,'#494653'),silver=material(null,'#c0c3c7',{roughness:.45}),cream=material(null,'#f4eddf');
 const group=(name,parent,position=[0,0,0])=>{const g=new T.Group();g.name=name;g.position.fromArray(position);parent.add(g);return g;};

 if(s.sleepCap)addSleepCap(head,s,origin,surface);
 if(s.spaceHelmet)addSpaceHelmet(head,s,origin,surface,headGeometry);

 if(s.guitar)addGuitar(spine,s);
 for(const costume of [false,true]){
  if(!(costume?s.bodyCostume==='burger':s.burger))continue;const burger=group(costume?'BurgerCostume':'Burger',costume?spine:bones[9],costume?[0,-.018,0]:[.015,-.027,.166]);if(costume)burger.scale.set(s.body*2,1.75,2.10);else burger.scale.setScalar(.82);const bread=material('burgerColor'),meat=material(null,'#765341'),cheese=material(null,'#edc260'),lettuce=material(null,'#a6b478'),tomato=material(null,'#c97e6e');
  const lathe=points=>new T.LatheGeometry(points.map(p=>new T.Vector2(...p)),24);
  solidMesh(burger,lathe([[0,-.14],[.12,-.14],[.18,-.12],[.193,-.085],[.184,-.061],[0,-.061]]),bread,[0,0,0],[1,1,.9]);
  solidMesh(burger,new T.CylinderGeometry(.179,.177,.043,20),meat,[0,-.041,0],[1,1,.9]);
  solidMesh(burger,roundBox(.34,.32,.012,.035),cheese,[0,-.012,0],[1,1,1]).rotation.x=Math.PI/2;
  solidMesh(burger,fabricShape([[-.12,.019],[.075,.014],[.028,-.044]],.012),cheese,[.025,-.013,.167]);
  solidMesh(burger,new T.CylinderGeometry(.171,.171,.019,24),tomato,[0,.008,0],[1,1,.9]);
  const positions=[],indices=[],segments=32;
  for(const layer of[-1,1]){positions.push(0,.037+layer*.005,0);for(let i=0;i<segments;i++){const angle=i/segments*Math.PI*2,r=.181+.012*Math.sin(angle*7);positions.push(Math.cos(angle)*r,.037+Math.sin(angle*5)*.008+layer*.005,Math.sin(angle)*r*.90);}}
  for(let i=0;i<segments;i++){const a=1+i,b=1+(i+1)%segments,c=a+segments+1,d=b+segments+1;indices.push(0,b,a,segments+1,c,d,a,b,d,a,d,c);}
  const leaves=new T.BufferGeometry();leaves.setAttribute('position',new T.Float32BufferAttribute(positions,3));leaves.setIndex(indices);leaves.computeVertexNormals();solidMesh(burger,leaves,lettuce);
  solidMesh(burger,lathe([[0,.056],[.190,.056],[.195,.085],[.18,.135],[.146,.175],[.081,.196],[0,.201]]),bread,[0,0,0],[1,1,.9],'BurgerBun');
  for(let i=0;i<13;i++){const angle=i*2.4,r=.045+.009*(i%7),x=Math.cos(angle)*r,z=Math.sin(angle)*r*.9,y=.078+.12*Math.sqrt(1-(r/.18)**2);const seed=ball(burger,cream,[x,y+.004,z],[.013,.003,.004]);seed.rotation.y=angle;}
 }
 if(s.laptop){
  const laptop=group('Laptop',spine,[.04,-.113,.455]),aluminum=material('laptopColor'),display=new T.MeshBasicMaterial({color:'#586b79'}),window=new T.MeshBasicMaterial({color:'#bdccd1'}),text=new T.MeshBasicMaterial({color:'#e8e0c8'});
  laptop.rotation.y=Math.PI;
  solidMesh(laptop,roundBox(.49,.32,.027,.026),aluminum,[0,0,0]).rotation.x=-Math.PI/2;
  solidMesh(laptop,roundBox(.148,.074,.004,.009),silver,[0,.019,.087]).rotation.x=-Math.PI/2;
  for(let row=0;row<4;row++)for(let col=0;col<9;col++){const key=solidMesh(laptop,roundBox(.033,.015,.004,.003),dark,[(col-4)*.041,.020,-.119+row*.034]);key.rotation.x=-Math.PI/2;}
  const hinge=solidMesh(laptop,new T.CylinderGeometry(.016,.016,.425,14),silver,[0,.021,-.153]);hinge.rotation.z=Math.PI/2;
  const screen=new T.Group();screen.position.set(0,.026,-.154);screen.rotation.x=-.19;laptop.add(screen);
  solidMesh(screen,roundBox(.49,.314,.028,.028),aluminum,[0,.162,0],[1,1,1],'LaptopScreenFrame');
  solidMesh(screen,roundBox(.424,.244,.006,.016),display,[0,.167,.020]);
  solidMesh(screen,roundBox(.278,.155,.004,.009),window,[.014,.155,.025]);
  for(let i=0;i<4;i++)solidMesh(screen,roundBox(.12+i%2*.058,.008,.003,.002),text,[-.025,.203-i*.027,.029]);
  ball(screen,silver,[0,.162,-.019],[.026,.026,.002]);
  ball(screen,dark,[0,.294,.022],[.005,.005,.002]);
 }
}
