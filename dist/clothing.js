import {garmentSurface} from './garment-surface.js';
import {vestSurface} from './vest-surface.js';
import {armWeights} from './garment-fit.js';
import {addHood} from './hood.js';
import {trouserSurface,trouserFront} from './trouser-surface.js';
import * as T from './vendor/three.module.js';
import {wearableMaterial,roundBox} from './wearable-meshes.js';
import {facetMesh} from './surface.js';
const fitted=new WeakMap();

export function applyClothingFit(group,t={}){
 const anchor=new T.Vector3(...group.userData.clothingAnchor),matrix=new T.Matrix4().compose(anchor.clone().add(new T.Vector3(t.x??0,t.y??0,t.z??0)),new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,1),(t.angle??0)*Math.PI/180),new T.Vector3().setScalar(t.scale??1)).multiply(new T.Matrix4().makeTranslation(-anchor.x,-anchor.y,-anchor.z));
 const normalMatrix=new T.Matrix3().getNormalMatrix(matrix),point=new T.Vector3();
 group.traverse(mesh=>{const base=fitted.get(mesh);if(!base)return;const p=mesh.geometry.attributes.position,n=mesh.geometry.attributes.normal;
  for(let i=0;i<p.count;i++){point.fromArray(base.positions,i*3).applyMatrix4(matrix);p.setXYZ(i,...point.toArray());point.fromArray(base.normals,i*3).applyMatrix3(normalMatrix).normalize();n.setXYZ(i,...point.toArray());}
  p.needsUpdate=true;n.needsUpdate=true;mesh.geometry.computeBoundingBox();mesh.geometry.computeBoundingSphere();
  if(mesh.userData.facetEnabled!==undefined){const enabled=mesh.userData.facetEnabled;mesh.geometry.userData.baseNormals=Array.from(n.array);mesh.userData.facetEnabled=undefined;facetMesh(mesh,enabled);}
 });
 // Attached skinning cancels this parent transform. The rest-pose fit above is
 // what moves the garment while preserving the shared body's animated rig.
 group.position.set(t.x??0,t.y??0,t.z??0);group.scale.setScalar(t.scale??1);group.rotation.z=(t.angle??0)*Math.PI/180;
}

export function addClothing(root,bones,s,skeleton,origin,surface){
 if(s.clothing==='none')return;
 const kind=s.clothing,shift=(1.54/5.2)*(s.legs-1),seg=s.detail==='verylow'?10:18;
 const group=new T.Group();group.name='Clothing';group.userData.accessoryKey='clothing';group.userData.clothingAnchor=[0,.60+shift,0];group.userData.garmentFit=true;root.add(group);
 // Open fabric shells have visible inner faces at the collar, cuff and folds.
 const primary=wearableMaterial(s,'clothingColor',null,{side:T.DoubleSide}),secondary=wearableMaterial(s,'clothingSecondaryColor',null,{side:T.DoubleSide}),trim=wearableMaterial(s,'clothingTrimColor',null,{side:T.DoubleSide});
 const dark=wearableMaterial(s,null,'#50505b'),metal=wearableMaterial(s,null,'#c9bc98',{roughness:.5});
 const long=['coat','raincoat'].includes(kind),hem=long?.13:kind==='puffer'?.245:.216;
 const shirtHem=kind==='uniform'?.47:kind==='overalls'?.455:hem;
 const surfaceFit=garmentSurface(s,kind,shirtHem),radiusAt=surfaceFit.radiusAt;
 const inner=['suit','coat','cardigan'].includes(kind)?garmentSurface(s,'dressShirt',.235):null,vest=kind==='uniform'?vestSurface(s):null;
 let pantsFront=null;
 const front=(x,y,offset=.005)=>Math.max(pantsFront?.(x,y+shift)??0,vest?.front(x,y+shift)??0,surfaceFit.front(x,y+shift)??0,inner?.front(x,y+shift)??0)+offset;
 const influences=(p,type='torso',geometry,index)=>{
  if(type==='chest'){const w=T.MathUtils.smoothstep(p.y-shift,.33,.72);return[[2,1-w],[3,w]];}
  if(type==='torso')return surfaceFit.skin(p);
  if(type==='hood'){const w=Math.max(T.MathUtils.smoothstep(p.y-shift,.94,1.20),T.MathUtils.smoothstep(Math.hypot(p.x/s.body,(p.z+.045)/.79),.22,.52));return[[3,1-w],[5,w]];}
  const side=type.endsWith('left')?1:-1;
  if(type.startsWith('arm'))return armWeights(s,p,side===1?7:11);
  const leg=(type==='trousers'?geometry.attributes.legSide.getX(index)>=0:side===1)?14:17,y=p.y/s.legs,a=T.MathUtils.smoothstep(y,.17,.29),ankle=1-T.MathUtils.smoothstep(y,.055,.145),hips=geometry.attributes.waistWeight?.getX(index)??0,chest=geometry.attributes.chestWeight?.getX(index)??0;return[[leg,a*(1-hips)],[leg+1,(1-a)*(1-ankle)*(1-hips)],[leg+2,(1-a)*ankle*(1-hips)],[2,hips-chest],[3,chest]].filter(([,w])=>w>0);
 };
 function skinned(g,m,name,type='torso'){
  // Keep shared vertices in smooth clothing. Expanding every indexed hood,
  // sleeve and cuff repeats the same skin transform up to six times per face.
  if(!g.attributes.normal)g.computeVertexNormals();
  const p=g.attributes.position,indices=[],weights=[],point=new T.Vector3();
  for(let i=0;i<p.count;i++){point.fromBufferAttribute(p,i);const skin=influences(point,type,g,i);while(skin.length<4)skin.push([0,0]);for(const[index,weight]of skin){indices.push(index);weights.push(weight);}}
  g.setAttribute('skinIndex',new T.Uint16BufferAttribute(indices,4));g.setAttribute('skinWeight',new T.Float32BufferAttribute(weights,4));
  const mesh=new T.SkinnedMesh(g,m);mesh.name=name;mesh.castShadow=true;mesh.userData.clothingPart=true;mesh.userData.smoothAccessory=true;group.add(mesh);mesh.bind(skeleton);
  fitted.set(mesh,{positions:Array.from(p.array),normals:Array.from(g.attributes.normal.array)});return mesh;
 }
 const lathe=points=>new T.LatheGeometry(points.map(([r,y])=>new T.Vector2(r,y)),seg);
 const baseMaterial=['overalls','apron'].includes(kind)?secondary:primary;
 if(inner){const source=inner.geometries[0],p=source.attributes.position,n=source.attributes.normal,positions=[],normals=[];for(let i=0;i<p.count;i+=3){const x=(p.getX(i)+p.getX(i+1)+p.getX(i+2))/3,y=(p.getY(i)+p.getY(i+1)+p.getY(i+2))/3-shift,z=(p.getZ(i)+p.getZ(i+1)+p.getZ(i+2))/3,width=kind==='cardigan'?.064:Math.max(0,(y-.56)*.40)+.023;if(z<0||Math.abs(x)>width||kind!=='cardigan'&&y<.53)continue;for(let j=0;j<3;j++){positions.push(p.getX(i+j),p.getY(i+j),p.getZ(i+j));normals.push(n.getX(i+j),n.getY(i+j),n.getZ(i+j));}}const shirt=new T.BufferGeometry();shirt.setAttribute('position',new T.Float32BufferAttribute(positions,3));shirt.setAttribute('normal',new T.Float32BufferAttribute(normals,3));source.dispose();skinned(shirt,secondary,'InnerShirt','chest');}
 skinned(surfaceFit.geometries[0],baseMaterial,'GarmentTorso');
 if(vest)skinned(vest.geometries[0],secondary,'SchoolVest','chest');
 for(let i=1;i<3;i++)skinned(surfaceFit.geometries[i],secondary,'GarmentTorso');
 for(const {geometry,side}of surfaceFit.sleeves)skinned(geometry,kind==='prison'?[primary,secondary]:['raglan','overalls','apron','varsity'].includes(kind)?secondary:primary,'GarmentSleeve',side===1?'arm-left':'arm-right');
 if(kind==='prison')skinned(surfaceFit.geometries[3],secondary,'PrisonStripe');
 function patch(points,m,name='FabricDetail',depth=.003,back=false){
  const outline=new T.Shape();points.forEach(([x,y],i)=>i?outline.lineTo(x,y):outline.moveTo(x,y));outline.closePath();
  const original=new T.ExtrudeGeometry(outline,{depth,bevelEnabled:false,steps:1});original.translate(0,0,-depth/2);const source=original.attributes.position,values=[];
  function projectTriangle(a,b,c,level=0){
   const distance=(p,q)=>(p[0]-q[0])**2+(p[1]-q[1])**2,edges=[distance(a,b),distance(b,c),distance(c,a)],edge=edges.indexOf(Math.max(...edges));
   const maxEdge=name==='Bib'?.020:.045;
   if(edges[edge]>maxEdge**2&&level<9){const v=[a,b,c],x=v[edge],y=v[(edge+1)%3],z=v[(edge+2)%3],mid=x.map((value,i)=>(value+y[i])/2);projectTriangle(x,mid,z,level+1);projectTriangle(mid,y,z,level+1);return;}
   values.push(...a,...b,...c);
  }
  const indices=original.index?Array.from(original.index.array):Array.from({length:source.count},(_,i)=>i);
  for(let i=0;i<indices.length;i+=3)projectTriangle(...indices.slice(i,i+3).map(j=>[source.getX(j),source.getY(j),source.getZ(j)]));
  original.dispose();const shape=new T.BufferGeometry();shape.setAttribute('position',new T.Float32BufferAttribute(values,3));const p=shape.attributes.position;
  const layer={FoldedCollar:.014,BlazerLapel:.026,Necktie:.014,UniformBow:.020,BowRibbon:.024,SpaceDisplay:.024,PrisonBadge:.020,PrisonNumber:.025,PajamaStar:.020,PocketStitch:.035,RainPocketFlap:.036,Bib:.020,BibStrap:.012,GarmentPocket:['apron','overalls'].includes(kind)?.026:.014}[name]??.010;
  const folded=['FoldedCollar','BlazerLapel','Necktie','UniformBow','BowRibbon'].includes(name),profile=name==='Necktie'&&inner?inner:vest??surfaceFit;
  const smoothFront=(x,y)=>Math.sqrt(Math.max(0,profile.radiusAt(y)**2-(x/s.body)**2))*.79;
  const project=(x,y)=>folded||back?smoothFront(x,y)+layer:front(x,y,layer);
  const facing=[];for(let i=0;i<p.count;i+=3){const a=new T.Vector3().fromBufferAttribute(p,i),b=new T.Vector3().fromBufferAttribute(p,i+1),c=new T.Vector3().fromBufferAttribute(p,i+2);facing.push(b.sub(a).cross(c.sub(a)).normalize().z);}
  for(let i=0;i<p.count;i++){const x=p.getX(i)*s.body,y=p.getY(i);p.setXYZ(i,x,y+shift,project(x,y)+p.getZ(i)*.4);}
  shape.computeVertexNormals();const normals=shape.attributes.normal;
  for(let i=0;i<p.count;i++){const sign=facing[Math.floor(i/3)];if(Math.abs(sign)<.5)continue;const x=p.getX(i),y=p.getY(i)-shift,e=.002,n=new T.Vector3(-(smoothFront(x+e,y)-smoothFront(x-e,y))/(2*e),-(smoothFront(x,y+e)-smoothFront(x,y-e))/(2*e),1).normalize().multiplyScalar(Math.sign(sign));normals.setXYZ(i,n.x,n.y,n.z);}
  if(back)shape.rotateY(Math.PI);return skinned(shape,m,name,'chest');
 }
 function tube(points,m,radius=.008,name='Piping'){
  const vertices=points.map(([x,y,z])=>new T.Vector3(x*s.body,y+shift,z??front(x*s.body,y,name==='PrisonNumber'?.033:name.includes('Pocket')?['apron','overalls'].includes(kind)?.035:.023:.009)));
  let path;if(name==='PocketSeam'){path=new T.CurvePath();for(let i=1;i<vertices.length;i++)path.add(new T.LineCurve3(vertices[i-1],vertices[i]));}else path=new T.CatmullRomCurve3(vertices);
  return skinned(new T.TubeGeometry(path,Math.max(24,vertices.length*2),radius,6,false),m,name,'chest');
 }
 function button(x,y,m=trim,r=.017){const g=new T.SphereGeometry(r,10,7);g.scale(1,1,.42);g.translate(x*s.body,y+shift,front(x*s.body,y,.012));return skinned(g,m,'GarmentButton','chest');}
 function ring(y,r,m,radius=.013,zscale=.82){const g=new T.TorusGeometry(r,radius,6,seg);g.rotateX(Math.PI/2);g.scale(s.body,1,zscale);g.translate(0,y+shift,0);return skinned(g,m,'RibbedHem','chest');}
 function pocket(x,y,width=.12,height=.12,m=primary){
  const points=[[x-width/2,y+height/2],[x+width/2,y+height/2],[x+width/2,y-height*.32],[x,y-height/2],[x-width/2,y-height*.32]],fabric=m.clone();fabric.color.multiplyScalar(.97);fabric.userData={...m.userData,colorScale:(m.userData.colorScale??1)*.97};
  const mesh=patch(points,fabric,'GarmentPocket',.003),thread=m.clone();thread.color.multiplyScalar(.86);thread.userData={...m.userData,colorScale:(m.userData.colorScale??1)*.86};
  const seam=[];for(let i=0;i<points.length;i++)for(let j=0;j<=5;j++){const [x,y]=points[i].map((v,k)=>T.MathUtils.lerp(v,points[(i+1)%points.length][k],j/5));seam.push([x,y,front(x*s.body,y,['apron','overalls'].includes(kind)?.030:.018)]);}tube(seam,thread,.0017,'PocketSeam');return mesh;
 }
 for(const arm of surfaceFit.arms){
  const short=['tee','raglan','uniform','overalls','sailor','apron'].includes(kind),center=arm.start.clone().addScaledVector(arm.axis,arm.end-(short?.002:.025)),rotation=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),arm.axis),profile=short?[[arm.radius+.010,-.018],[arm.radius+.010,.012],[arm.radius-.007,.012],[arm.radius-.007,-.018],[arm.radius+.010,-.018]]:[[arm.radius+.006,-.031],[.106,.030],[.093,.030],[arm.radius-.010,-.031],[arm.radius+.006,-.031]],cuff=new T.LatheGeometry(profile.map(([r,y])=>new T.Vector2(r,y)),32);
  cuff.applyQuaternion(rotation);cuff.translate(...center.toArray());skinned(cuff,['raglan','suit','pajamas','spacesuit','varsity','prison'].includes(kind)?secondary:primary,'GarmentCuff',arm.side===1?'arm-left':'arm-right');
 }
 if(['pajamas','spacesuit','suit','uniform','prison','overalls'].includes(kind)){
  const waist=radiusAt(kind==='overalls'?.455:.47)+(kind==='overalls'?.013:-.012);
  const trousers=trouserSurface(s,kind,waist,radiusAt);if(kind==='overalls')pantsFront=trouserFront(trousers);
  skinned(trousers,kind==='prison'?[primary,secondary]:kind==='uniform'?secondary:primary,kind==='overalls'?'OverallShell':'GarmentTrousers','trousers');
 }
 if(['tee','raglan','sweater','varsity'].includes(kind)){
  ring(.914,radiusAt(.914),trim,.009);ring(.235,radiusAt(.235),kind==='sweater'?trim:primary,.008);
 }
 if(kind==='tee'){pocket(.132,.682,.10,.095,secondary);}
 if(['hoodie','hoodieUp'].includes(kind)){
  const pocketMaterial=primary.clone();pocketMaterial.color.multiplyScalar(.97);pocketMaterial.userData={...primary.userData,colorScale:.97};
  const pocketPoints=[[-.18,.45],[.18,.45],[.18,.327],[.135,.294],[-.135,.294],[-.18,.327]];patch(pocketPoints,pocketMaterial,'KangarooPocket',.003);
  const seam=[];for(let i=0;i<pocketPoints.length;i++)for(let j=0;j<=5;j++){const [x,y]=pocketPoints[i].map((v,k)=>T.MathUtils.lerp(v,pocketPoints[(i+1)%pocketPoints.length][k],j/5));seam.push([x,y,front(x*s.body,y,.014)]);}tube(seam,primary,.0018,'PocketSeam');
  tube([[-.17,.40],[-.12,.35]],primary,.004,'PocketOpening');tube([[.17,.40],[.12,.35]],primary,.004,'PocketOpening');
  // Overlapping rolled front corners are attached to the shirt neckline.
  // Their curved cross section is real cloth depth, rather than a collar decal.
  for(const side of[-1,1]){
   const values=[],faces=[],path=new T.CatmullRomCurve3([new T.Vector3(-side*.16,.866,0),new T.Vector3(-side*.055,.825,0),new T.Vector3(side*.105,.776,0)]),length=28,width=8;
   for(let i=0;i<=length;i++){const t=i/length,center=path.getPoint(t),axis=path.getTangent(t),across=new T.Vector2(-axis.y,axis.x).normalize();for(let j=0;j<=width;j++){const v=j/width,d=(v-.5)*.065,x=(center.x+across.x*d)*s.body,y=center.y+across.y*d;values.push(x,y+shift,front(x,y,.019)+(side===1?.004:0)+Math.sin(v*Math.PI)*.018);}}
   for(let i=0;i<length;i++)for(let j=0;j<width;j++){const a=i*(width+1)+j,b=a+width+1;faces.push(a,b+1,b,a,a+1,b+1);}const collar=new T.BufferGeometry();collar.setAttribute('position',new T.Float32BufferAttribute(values,3));collar.setIndex(faces);collar.computeVertexNormals();skinned(collar,primary,'HoodCrossCollar','chest');
   const eyelet=new T.TorusGeometry(.012,.003,6,12);eyelet.translate(side*.067*s.body,.816+shift,front(side*.067*s.body,.816,.042));skinned(eyelet,trim,'HoodDrawstringEyelet','chest');
   tube([[side*.067,.816,front(side*.067*s.body,.816,.045)],[side*.07,.752,front(side*.07*s.body,.752,.034)],[side*.087,.670,front(side*.087*s.body,.670,.027)]],secondary,.006,'HoodDrawstring');button(side*.087,.664,trim,.010);
  }
  ring(.23,radiusAt(.23),trim,.009);
 }
 if(['pajamas','suit','cardigan','coat','raincoat','varsity'].includes(kind)){
  const width=kind==='suit'?.077:kind==='cardigan'?.06:.008;
  if(!['suit','coat','cardigan'].includes(kind))patch([[-width,.873],[width,.873],[width,.286],[-width,.286]],secondary,'FrontPlacket');
  if(kind!=='suit')for(const y of[.69,.54,.39])button(kind==='coat'?.077:.026,y);
  if(kind==='coat')for(const y of[.69,.54,.39])button(-.077,y);
  if(!['suit','varsity'].includes(kind)){pocket(-.18,.45,.115,.105);pocket(.18,.45,.115,.105);}
 }
 if(['pajamas','suit','coat','uniform','cardigan','sailor','raincoat'].includes(kind)){
  for(const side of[-1,1])patch([[side*.02,.887],[side*.114,.898],[side*.178,.814],[side*.079,.784]],kind==='uniform'?primary:kind==='raincoat'?primary:secondary,'FoldedCollar',.003);
 }
 if(kind==='pajamas'){
  pocket(.14,.691,.105,.11,secondary);
  for(const[x,y]of[[-.145,.64],[.17,.52],[-.11,.36]]){
   const star=[];for(let i=0;i<10;i++){const angle=Math.PI/2+i*Math.PI/5,r=i%2?.010:.026;star.push([x+Math.cos(angle)*r,y+Math.sin(angle)*r]);}patch(star,trim,'PajamaStar',.006);
  }
 }
 if(kind==='suit'){
  const lapel=primary.clone();lapel.color.multiplyScalar(.86);lapel.userData={...primary.userData,colorScale:.86};
  for(const side of[-1,1])patch([[side*.109,.883],[side*.181,.817],[side*.136,.784],[side*.158,.731],[side*.028,.573],[side*.056,.785]],lapel,'BlazerLapel',.003);
  patch([[-.018,.859],[.018,.859],[.024,.754],[0,.720],[-.024,.754]],trim,'Necktie',.003);button(.022,.452,trim,.011);
  patch([[-.16,.51],[-.079,.51],[-.079,.487],[-.16,.487]],secondary,'SuitPocket',.003);
 }
 if(kind==='coat'){
  const lapel=primary.clone();lapel.color.multiplyScalar(.93);lapel.userData={...primary.userData,colorScale:.93};
  for(const side of[-1,1])patch([[side*.109,.883],[side*.181,.817],[side*.136,.784],[side*.161,.731],[side*.034,.575],[side*.054,.785]],lapel,'BlazerLapel',.003);
 }
 if(kind==='uniform'){
  for(const side of[-1,1]){const seam=[];for(let i=0;i<=80;i++){const a=i/80*Math.PI*2,theta=side*Math.PI/2+.62*Math.cos(a),y=.725+.165*Math.sin(a),r=vest.radiusAt(y),p=new T.Vector3(Math.sin(theta)*r*s.body,y+shift,Math.cos(theta)*r*.79),out=new T.Vector3(Math.sin(theta)/s.body,0,Math.cos(theta)/.79).normalize();seam.push(p.addScaledVector(out,.002));}skinned(new T.TubeGeometry(new T.CatmullRomCurve3(seam),160,.0045,6,false),secondary,'VestArmBinding','chest');}
  const edge=[];for(let i=0;i<=16;i++){const y=.752+i/16*.135,x=(y-.752)*.90;edge.push([x/s.body,y,Math.sqrt(Math.max(0,vest.radiusAt(y)**2-(x/s.body)**2))*.79+.004]);}tube([...edge.slice().reverse().map(([x,y,z])=>[-x,y,z]),...edge.slice(1)],secondary,.007,'VestNeckBinding');
  for(const side of[-1,1])patch([[0,.76],[side*.085,.798],[side*.092,.727],[side*.018,.733]],trim,'UniformBow',.003);
  patch([[-.026,.753],[.026,.753],[.045,.632],[0,.655],[-.045,.632]],trim,'BowRibbon',.003);
 }
 if(kind==='prison'){
  patch([[-.19,.69],[-.07,.69],[-.07,.622],[-.19,.622]],primary,'PrisonBadge',.003);
  for(const x of[-.16,-.132,-.102])tube([[x,.645],[x,.675]],trim,.005,'PrisonNumber');
 }
 if(kind==='sweater'){
  for(const x of[-.15,-.05,.05,.15])for(const sign of[-1,1]){
   const points=[];for(let i=0;i<24;i++){const y=.30+i/23*.535;points.push([x+Math.sin(i/23*Math.PI*5)*.018*sign,y]);}tube(points,trim,.005,'KnitCable');
  }
  ring(.891,.183,secondary,.009);
 }
 if(kind==='cardigan'){tube([[-.09,.89],[-.059,.72],[-.035,.36]],trim,.007);tube([[.09,.89],[.059,.72],[.035,.36]],trim,.007);}
 if(['overalls','apron'].includes(kind)){
  if(kind==='apron')patch([[-.16,.78],[.16,.78],[.20,.49],[.267,.26],[-.267,.26],[-.20,.49]],primary,'Bib',.003);
  for(const side of[-1,1]){patch([[side*.115,.919],[side*.17,.904],[side*.14,.735],[side*.09,.74]],primary,'BibStrap',.003);button(side*.12,.756,trim,.021);}
  pocket(0,.50,.204,.144,primary);tube([[-.092,.539],[.092,.539]],trim,.004,'PocketStitch');
  for(const side of[-1,1])patch([[side*.12,.919],[side*.17,.904],[-side*.11,.744],[-side*.16,.758]],primary,'BackStrap',.003,true);
  if(kind==='apron'){
   const belt=[];for(let i=0;i<=24;i++){const theta=Math.PI/2+Math.PI*i/24;belt.push([(radiusAt(.60)+.012)*Math.sin(theta),.60,(radiusAt(.60)*.79+.012)*Math.cos(theta)]);}tube(belt,primary,.014,'ApronWaistTie');
   for(const side of[-1,1])patch([[0,.61],[side*.087,.638],[side*.091,.57],[side*.018,.591]],primary,'ApronBackBow',.003,true);
   patch([[-.018,.588],[.018,.588],[.043,.448],[0,.469],[-.039,.445]],primary,'ApronTieEnds',.003,true);
  }
 }
 if(kind==='spacesuit'){
  for(const y of[.36,.72])ring(y,radiusAt(y)+.001,secondary,.018);
  patch([[-.105,.714],[.105,.714],[.105,.52],[-.105,.52]],secondary,'SpaceControlPanel',.003);
  patch([[-.078,.686],[.078,.686],[.078,.626],[-.078,.626]],dark,'SpaceDisplay',.003);
  for(const x of[-.053,0,.053])button(x,.567,x===0?trim:metal,.016);
  const pack=roundBox(.39,.42,.13,.04);pack.translate(0,.62+shift,-.282);skinned(pack,secondary,'SpaceBackpack','chest');
  for(const side of[-1,1])tube([[side*.19,.76,-.25],[side*.244,.59,-.26],[side*.20,.40,-.20]],trim,.014,'AirHose');
 }
 if(kind==='puffer'){
  for(const y of[.365,.525,.676])ring(y,radiusAt(y)-.002,secondary,.008);
  tube([[0,.925],[0,.24]],trim,.006,'JacketZip');
  for(const side of[-1,1])tube([[side*.13,.41],[side*.21,.475]],trim,.006,'ZippedPocket');
 }
 if(kind==='raincoat'){
  for(const side of[-1,1])patch([[side*.10,.49],[side*.22,.49],[side*.22,.452],[side*.10,.452]],secondary,'RainPocketFlap',.003);
  ring(.158,.349,secondary,.012);
 }
 if(kind==='sailor'){
  patch([[-.17,.91],[.17,.91],[.23,.735],[-.23,.735]],secondary,'SailorBackCollar',.003,true);
  tube([[-.16,.878],[-.19,.784],[-.074,.746],[0,.673],[.074,.746],[.19,.784],[.16,.878]],trim,.006,'SailorCollarStripe');
  for(const side of[-1,1])patch([[0,.735],[side*.079,.779],[side*.088,.706],[side*.018,.707]],trim,'SailorBow',.003);
 }
 if(kind==='varsity'){
  for(const y of[.69,.54,.39])button(.018,y,secondary,.014);
  patch([[-.177,.746],[-.145,.746],[-.145,.639],[-.074,.639],[-.074,.612],[-.177,.612]],secondary,'VarsityLetter',.003);
  for(const y of[.241,.264])ring(y,radiusAt(y),secondary,.007);
 }
 if(['hoodie','raincoat'].includes(kind)){
  const folded=lathe([[.16,.82],[.21,.82],[.265,.862],[.25,.913],[.175,.943],[.15,.905],[.16,.82]]);folded.scale(s.body,1,.8);folded.translate(0,shift,-.045);skinned(folded,primary,'FoldedHood','chest');
 }
 if(kind==='hoodieUp')addHood(bones[5],origin,primary,secondary,skinned);
}
