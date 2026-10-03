import * as T from './vendor/three.module.js';
import {solidMesh,ball,lineTube,roundBox,wearableMaterial} from './wearable-meshes.js';
import {addProps} from './props.js';
import {addHeadset} from './headset.js';
import {handBindX} from './garment-fit.js';

export const socialMotionNames={picnicDrink:'피크닉 · 한 모금',picnicEat:'피크닉 · 김밥 먹기',picnicChat:'피크닉 · 도란도란',readTogether:'나란히 책 읽기',guitarPlay:'기타 연주',laptopWork:'노트북 톡톡',highFive:'하이파이브',toast:'짠, 건배',musicListen:'음악에 까딱까딱',syringeHold:'커다란 주사기 들기'};
export const socialMotions=new Set(Object.keys(socialMotionNames));
const seated=new Set(['picnicDrink','picnicEat','picnicChat','readTogether','guitarPlay','laptopWork']);
const cache=new WeakMap();
function create(a,id){
 const s=a.root.userData.pixelPals.state,g=new T.Group();g.name='MotionProp-'+id;g.userData.motionProp=true;
 const material=color=>s.shading?new T.MeshStandardMaterial({color,roughness:.9}):new T.MeshBasicMaterial({color});
 const cream=material('#f0e8d9'),pink=material('#caa6a0'),dark=material('#494750'),green=material('#667b60');
 if(id==='blanket'){
  a.root.add(g);g.userData.picnicBlanket=true;g.position.set(0,.018,.24);
  const base=solidMesh(g,roundBox(1.65,1.28,.012,.09),cream);base.rotation.x=-Math.PI/2;
  for(let x=0;x<6;x++)for(let z=0;z<5;z++)if((x+z)%2===0){const tile=solidMesh(g,roundBox(.266,.249,.002,.002),pink,[(x-2.5)*.266,.009,(z-2)*.249]);tile.rotation.x=-Math.PI/2;}
  for(const side of[-1,1])for(let i=0;i<20;i++)solidMesh(g,lineTube([[side*.817,.003,(i-9.5)*.06],[side*.864,.002,(i-9.5)*.06]],.002,2),cream);
 }else if(id==='drink'||id==='toast'){
  a.bones[id==='toast'?13:9].add(g);
  const cup=new T.LatheGeometry([[0,-.08],[.062,-.08],[.078,.078],[.069,.082],[.058,-.069],[0,-.069]].map(p=>new T.Vector2(...p)),20);
  solidMesh(g,cup,cream);const liquid=solidMesh(g,new T.CylinderGeometry(.069,.069,.006,20),material('#b79061'),[0,.071,0]);
  solidMesh(g,new T.TorusGeometry(.044,.010,8,24),pink,[.105,.004,0],[1,1,1],'CupHandle');
  solidMesh(g,new T.TorusGeometry(.071,.006,6,20),pink,[0,.080,0]).rotation.x=Math.PI/2;
 }else if(id==='kimbap'){
  a.bones[9].add(g);
  solidMesh(g,new T.CylinderGeometry(.081,.081,.103,20),green).rotation.x=Math.PI/2;
  solidMesh(g,new T.CylinderGeometry(.069,.069,.105,20),cream).rotation.x=Math.PI/2;
  for(const[x,y,color]of[[-.023,-.014,'#d4b567'],[.019,.019,'#c58e6a'],[.016,-.020,'#849266'],[-.018,.025,'#d8bb80']])ball(g,material(color),[x,y,.054],[.017,.015,.003]);
 }else if(id==='picnicPlate'){
  a.bones[0].add(g);g.position.set(.57,.04,.39);
  const plate=solidMesh(g,roundBox(.33,.24,.018,.025),material('#b49b7d'));plate.rotation.x=-Math.PI/2;
  for(let i=0;i<3;i++){const roll=new T.Group();roll.position.set((i-1)*.092,.046,0);roll.rotation.x=-Math.PI/2;g.add(roll);solidMesh(roll,new T.CylinderGeometry(.041,.041,.050,16),green).rotation.x=Math.PI/2;solidMesh(roll,new T.CylinderGeometry(.033,.033,.052,16),cream).rotation.x=Math.PI/2;ball(roll,material('#d8ad67'),[.008,0,.028],[.013,.012,.002]);}
 }else if(id==='book'){
  a.bones[3].add(g);g.position.set(0,-.020,.44);g.rotation.x=-1.92;
  for(const side of[-1,1]){const half=new T.Group();half.rotation.y=side*.17;half.position.x=side*.115;g.add(half);
   solidMesh(half,roundBox(.232,.282,.031,.011),pink,[0,0,-.01]);solidMesh(half,roundBox(.208,.255,.025,.004),cream,[0,0,.010]);
   for(let i=0;i<7;i++)solidMesh(half,roundBox(.14-(i%3)*.018,.004,.001,.001),material('#bbb3a3'),[0,.085-i*.024,.026]);
  }
  solidMesh(g,lineTube([[0,-.14,.032],[0,.14,.032]],.003,3),dark);
 }else if(id==='guitar'||id==='laptop'||id==='syringe'){
  const name=id==='guitar'?'Guitar':id==='laptop'?'Laptop':'Syringe',before=new Set(a.bones[3].children);
  addProps(a.bones[5],a.bones[3],a.bones,{...s,bodyCostume:'none',whippedCream:'none',syringe:id==='syringe',glasses:false,sleepCap:false,spaceHelmet:false,guitar:id==='guitar',laptop:id==='laptop',burger:false},a.headOrigin,a.headSurface,a.face.geometry);
  const prop=a.bones[3].children.find(o=>!before.has(o)&&o.name===name);g.position.copy(prop.position);g.quaternion.copy(prop.quaternion);prop.position.set(0,0,0);prop.quaternion.identity();g.add(prop);a.bones[3].add(g);
 }else if(id==='headset'){
  const before=new Set(a.bones[5].children);addHeadset(a.bones[5],s,a.headOrigin,a.headSurface);
  const prop=a.bones[5].children.find(o=>!before.has(o)&&o.name==='Headset');g.add(prop);a.bones[5].add(g);
 }
 return g;
}
function prop(a,id){let entries=cache.get(a);if(!entries){entries=new Map();cache.set(a,entries);}if(!entries.has(id))entries.set(id,create(a,id));return entries.get(id);}
function restoreProps(a){for(const g of cache.get(a)?.values()??[])g.visible=false;for(const name of ['Guitar','Laptop','Headset','Syringe']){const g=a.root.getObjectByName('Accessory-'+name.toLowerCase());if(g)g.visible=true;}}
export const hideMotionProps=restoreProps;
// Two-bone hand aiming keeps the prop, wrist and soft arm connected. Chibi
// arms stretch only as far as their target needs, then reset on the next pose.
function aimWrist(a,index,target,bend=1){
 const arm=a.bones[index],elbow=a.bones[index+1],wrist=a.bones[index+2];a.root.updateMatrixWorld(true);
 const start=arm.getWorldPosition(new T.Vector3()),d=target.clone().sub(start),distance=d.length();if(distance<.001)return;d.normalize();
 const worldScale=arm.getWorldScale(new T.Vector3()).x;let l1=elbow.userData.restPosition.length()*worldScale,l2=wrist.userData.restPosition.length()*worldScale;const stretch=Math.max(1,(distance+.008*worldScale)/(l1+l2));elbow.position.copy(elbow.userData.restPosition).multiplyScalar(stretch);wrist.position.copy(wrist.userData.restPosition).multiplyScalar(stretch);l1*=stretch;l2*=stretch;
 const along=T.MathUtils.clamp((distance*distance+l1*l1-l2*l2)/(2*distance),0,l1),height=Math.sqrt(Math.max(0,l1*l1-along*along));
 const pole=(Array.isArray(bend)?new T.Vector3(...bend):new T.Vector3(index===7?.90:-.90,-.65,.15*bend)).applyQuaternion(a.root.getWorldQuaternion(new T.Quaternion())),perp=pole.addScaledVector(d,-pole.dot(d)).normalize();
 const joint=start.clone().addScaledVector(d,along).addScaledVector(perp,height),local=arm.parent.worldToLocal(joint.clone()).sub(arm.position);
 arm.quaternion.setFromUnitVectors(elbow.userData.restPosition.clone().normalize(),local.normalize());a.root.updateMatrixWorld(true);
 const aim=elbow.parent.worldToLocal(target.clone()).sub(elbow.position);elbow.quaternion.setFromUnitVectors(wrist.userData.restPosition.clone().normalize(),aim.normalize());a.root.updateMatrixWorld(true);
 return wrist;
}
export function handCenter(a,index){const s=a.root.userData.pixelPals.state,bind=new T.Vector3((index===7?1:-1)*handBindX(s),.494+(1.54/5.2)*(s.legs-1),.03),offset=bind.applyMatrix4(a.face.skeleton.boneInverses[index+2]);return a.bones[index+2].localToWorld(offset);}
export function hand(a,index,target,bend=1){
 const s=a.root.userData.pixelPals.state,bind=new T.Vector3((index===7?1:-1)*handBindX(s),.494+(1.54/5.2)*(s.legs-1),.03),offset=bind.applyMatrix4(a.face.skeleton.boneInverses[index+2]),wrist=a.bones[index+2];
 for(let i=0;i<6;i++){a.root.updateMatrixWorld(true);const delta=wrist.localToWorld(offset.clone()).sub(wrist.getWorldPosition(new T.Vector3()));aimWrist(a,index,target.clone().sub(delta),bend);}
 return wrist;
}
// Character-relative hand targets follow the rig's support elevation. The
// outer root also contains the grounded pastry and picnic blanket, so using
// it here would leave these targets at floor height while the shoulders rise.
function point(a,x,y,z){return a.bones[0].localToWorld(new T.Vector3(x,y,z));}
function hold(a,g,target,index=7,tilt=0){
 if(g.parent!==a.root)a.root.add(g);g.visible=true;g.position.copy(a.root.worldToLocal(target.clone()));g.rotation.set(tilt,index===7?0:Math.PI,0);a.root.updateMatrixWorld(true);
 const grip=new T.Vector3(g.name.includes('kimbap')?.17:.19,0,.005);g.userData.grips=[{arm:index,point:grip.toArray()}];hand(a,index,g.localToWorld(grip));
}
export function poseSocial(a,motion,t){
 restoreProps(a);if(!socialMotions.has(motion))return;
 const b=a.bones,p=t*Math.PI/3,s=Math.sin(p),beat=Math.sin(p*6),shift=(1.54/5.2)*(a.root.userData.pixelPals.state.legs-1),side=a.socialSide??1;
 if(seated.has(motion)){b[1].position.y-=.175+shift*.6;b[14].rotation.x-=1.22;b[17].rotation.x-=1.22;b[15].rotation.x+=.22;b[18].rotation.x+=.22;b[5].rotation.z+=.018*s;}
 if(motion.startsWith('picnic')){prop(a,'blanket').visible=!a.sharedBlanket;prop(a,'picnicPlate').visible=true;}
 a.root.updateMatrixWorld(true);
 if(motion==='picnicDrink'||motion==='picnicEat'){
  const lift=(.5-.5*Math.cos(p))**2,drink=motion==='picnicDrink',y=.956,z=a.headSurface.front(0,y),tilt=drink?-.52*lift:Math.PI/2*.10;b[5].rotation.x+=.03*lift;a.root.updateMatrixWorld(true);
  const headTarget=b[5].localToWorld(new T.Vector3(drink?.02:.06,y-a.headOrigin[1],z+(drink?.012:.084)));
  if(drink){const rim=new T.Vector3(0,.080,-.071).applyAxisAngle(new T.Vector3(1,0,0),tilt).applyMatrix3(new T.Matrix3().setFromMatrix4(a.root.matrixWorld));headTarget.sub(rim);}
  const rest=point(a,.12,.47+shift,.40),target=rest.lerp(headTarget,lift);hold(a,prop(a,drink?'drink':'kimbap'),target,7,tilt);
  // The free hand rests on the outside of the lap. An outward elbow pole
  // avoids the raised elbow/vertical dangling forearm of a forward pole.
  hand(a,11,point(a,-.30,.27+shift,.37),[-1,-.35,.05]);
 }else if(motion==='picnicChat'){
  hand(a,7,point(a,.34,.46+shift+.05*s,.35));hand(a,11,point(a,-.28,.41+shift+.045*Math.sin(p+.7),.35));b[5].rotation.y+=.11*s;b[5].rotation.x+=.025*Math.sin(p*3);
 }else if(motion==='readTogether'){
  const book=prop(a,'book');book.visible=true;book.rotation.x=-1.92+.025*s;b[5].rotation.x+=.13+.022*s;
  a.root.updateMatrixWorld(true);book.userData.grips=[{arm:7,point:[.29,-.06,.07]},{arm:11,point:[-.29,-.06,.07]}];for(const grip of book.userData.grips)hand(a,grip.arm,book.localToWorld(new T.Vector3(...grip.point)));
 }else if(motion==='guitarPlay'){
  const guitar=prop(a,'guitar');guitar.visible=true;const manual=a.root.getObjectByName('Accessory-guitar');if(manual)manual.visible=false;
  a.root.updateMatrixWorld(true);guitar.userData.grips=[{arm:7,point:[.055,-.05+.025*beat,.148]},{arm:11,point:[-.121,.40+.018*s,.025]}];for(const grip of guitar.userData.grips)hand(a,grip.arm,guitar.localToWorld(new T.Vector3(...grip.point)));b[5].rotation.z+=.038*Math.sin(p*3);b[5].rotation.x+=.05;
 }else if(motion==='laptopWork'){
  const laptop=prop(a,'laptop');laptop.visible=true;const manual=a.root.getObjectByName('Accessory-laptop');if(manual)manual.visible=false;
  b[5].rotation.x+=.12+.017*Math.sin(p*3);a.root.updateMatrixWorld(true);
  laptop.userData.grips=[{arm:7,point:[-.105,.109+.006*beat,-.06]},{arm:11,point:[.105,.109-.006*beat,-.06]}];for(const grip of laptop.userData.grips)hand(a,grip.arm,laptop.localToWorld(new T.Vector3(...grip.point)));
 }else if(motion==='highFive'){
  const clap=(.5-.5*Math.cos(p*2))**2;hand(a,side>0?7:11,point(a,side*(.38+.41*clap),.92+shift+.16*clap,.17));b[5].rotation.z+=side*.055*clap;b[1].position.y+=.02*clap;
 }else if(motion==='toast'){
  const clink=(.5-.5*Math.cos(p))**2,group=prop(a,'toast');if(group.parent!==b[side>0?9:13])b[side>0?9:13].add(group);
  hold(a,group,point(a,side*(.34+.34*clink),.73+shift+.18*clink,.39),side>0?7:11);b[5].rotation.z+=side*.034*clink;
 }else if(motion==='musicListen'){
  const headset=a.root.getObjectByName('Accessory-headset')??prop(a,'headset');headset.visible=true;
  b[5].rotation.z+=.055*beat;b[5].rotation.x+=.035*Math.sin(p*6+.35);b[2].rotation.z+=.025*beat;b[1].position.y+=.012*(1-Math.cos(p*12));
  b[7].rotation.z+=.055*beat;b[11].rotation.z-=.055*beat;
 }else if(motion==='syringeHold'){
  const syringe=prop(a,'syringe');syringe.visible=true;const manual=a.root.getObjectByName('Accessory-syringe');if(manual)manual.visible=false;
  syringe.rotation.z=1.22+.025*Math.sin(p*2);syringe.position.y=-.12+.014*s;b[5].rotation.z-=.035*s;b[1].position.y+=.014*(1-Math.cos(p*4));a.root.updateMatrixWorld(true);
  syringe.userData.grips=[{arm:7,point:[.192,-.20,.025]},{arm:11,point:[-.192,.11,.025]}];for(const grip of syringe.userData.grips)hand(a,grip.arm,syringe.localToWorld(new T.Vector3(...grip.point)));
 }
 a.root.updateMatrixWorld(true);
}

export function updateMotionPropColors(a,state){for(const group of cache.get(a)?.values()??[])group.traverse(o=>{if(o.material?.userData?.colorSetting)o.material.color.set(state[o.material.userData.colorSetting]).multiplyScalar(o.material.userData.colorScale??1);});}
export function createSharedBlanket(){const fake={root:new T.Group()};fake.root.userData.pixelPals={state:{shading:false}};const blanket=create(fake,'blanket');blanket.removeFromParent();return blanket;}
