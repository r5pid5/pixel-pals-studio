import * as T from './vendor/three.module.js';
import {solidMesh,roundBox,lineTube} from './wearable-meshes.js';

// A closed piped/turned volume, with a single vertex at each tip. Scallops,
// twist and an offset tip are geometry, so they read in every camera view.
export function turned(profile,segments=48,{lobes=0,amplitude=0,twist=0,bend=0}={}){
 const positions=[],indices=[],rings=[];
 for(let j=0;j<profile.length;j++){
  const[r,y]=profile[j],t=j/(profile.length-1),cx=bend*t**3;
  const ring=[];
  if(r===0){ring.push(positions.length/3);positions.push(cx,y,0);}
  else for(let i=0;i<segments;i++){const a=i/segments*Math.PI*2,rr=r*(1+amplitude*Math.cos(lobes*(a-t*twist))),angle=a;ring.push(positions.length/3);positions.push(cx+Math.cos(angle)*rr,y,Math.sin(angle)*rr);}
  rings.push(ring);
 }
 for(let j=1;j<rings.length;j++){
  const a=rings[j-1],b=rings[j];for(let i=0;i<segments;i++){const k=(i+1)%segments;if(a.length===1)indices.push(a[0],b[i],b[k]);else if(b.length===1)indices.push(a[i],b[0],a[k]);else indices.push(a[i],b[i],b[k],a[i],b[k],a[k]);}
 }
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;
}
// A solid longitudinal half, closed along its cut plane. The sliced fruit
// retains its curved red skin in side/rear views instead of becoming a decal.
export function strawberryHalfGeometry(profile,segments=24){
 const positions=[],indices=[],rings=[];
 for(const[r,y]of profile){const ring=[];if(!r){ring.push(positions.length/3);positions.push(0,y,0);}else for(let i=0;i<=segments;i++){const a=Math.PI+i/segments*Math.PI;ring.push(positions.length/3);positions.push(Math.cos(a)*r,y,Math.sin(a)*r);}rings.push(ring);}
 for(let row=1;row<rings.length;row++){
  const a=rings[row-1],b=rings[row];for(let i=0;i<segments;i++){if(a.length===1)indices.push(a[0],b[i],b[i+1]);else if(b.length===1)indices.push(a[i],b[0],a[i+1]);else indices.push(a[i],b[i],b[i+1],a[i],b[i+1],a[i+1]);}
  const al=a[0],ar=a.at(-1),bl=b[0],br=b.at(-1);if(a.length===1)indices.push(al,br,bl);else if(b.length===1)indices.push(al,ar,bl);else indices.push(al,ar,br,al,br,bl);
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();return g;
}
export function pastryBuilder(state){
 const mats=new Map();
 const material=(color,key,roughness=.82)=>{const id=(key??color)+'/'+roughness;if(!mats.has(id)){const m=state.shading?new T.MeshStandardMaterial({color:key?state[key]:color,roughness}):new T.MeshBasicMaterial({color:key?state[key]:color});if(key)m.userData.colorSetting=key;mats.set(id,m);}return mats.get(id);};
 const add=(group,geometry,color,position=[0,0,0],scale=[1,1,1],name='',roughness=.82,key)=>{const mesh=solidMesh(group,geometry,material(color,key,roughness),position,scale,name);mesh.userData.smoothAccessory=true;return mesh;};
 const sphere=(group,color,position,scale,name='',roughness=.8)=>add(group,new T.SphereGeometry(1,/Seed|Pore|Crumb/.test(name)?6:16,/Seed|Pore|Crumb/.test(name)?4:10),color,position,scale,name,roughness);
 const tube=(group,points,color,r=.008,name='Stem')=>add(group,lineTube(points,r,Math.min(192,Math.max(20,points.length*2))),color,[0,0,0],[1,1,1],name);
 const dollop=(group,position,size=.15,color='#fff1dc',key)=>{
  const profile=[[0,0],[.47,.01],[.53,.10],[.50,.23],[.43,.39],[.34,.54],[.25,.68],[.17,.81],[.08,.93],[0,1.05]];
  const mesh=add(group,turned(profile,48,{lobes:7,amplitude:.13,twist:1.12,bend:.14}),color,position,[size,size,size],'PipedCream',.91,key);return mesh;
 };
 const leaf=(group,position,size=.1,angle=0)=>{
  const geometry=new T.SphereGeometry(1,12,8),p=geometry.attributes.position;
  for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);p.setXYZ(i,x*.36,(y+1)*.48,z*.055*(.5+.5*(1-y*y)));}geometry.computeVertexNormals();
  const mesh=add(group,geometry,'#78955b',position,[size,size,size],'FruitLeaf');mesh.rotation.z=angle;return mesh;
 };
 const strawberry=(group,position,size=.23,angle=0,{garnish=true}={})=>{
  const fruit=new T.Group();fruit.name='StrawberrySection';fruit.position.fromArray(position);fruit.scale.set(size*1.25,size*.82,size);fruit.rotation.z=angle;group.add(fruit);
  const profile=[[0,0],[.13,.10],[.25,.28],[.34,.52],[.36,.70],[.31,.86],[.22,.96],[0,.99]];
  add(fruit,strawberryHalfGeometry(profile),'#da626e',[0,0,0],[1,1,1],'StrawberrySkin',.62);
  const flesh=new T.Shape();flesh.moveTo(0,.035);flesh.bezierCurveTo(-.09,.09,-.37,.43,-.34,.72);flesh.bezierCurveTo(-.30,.88,-.21,.96,0,.96);flesh.bezierCurveTo(.21,.96,.30,.88,.34,.72);flesh.bezierCurveTo(.37,.43,.09,.09,0,.035);flesh.closePath();
  add(fruit,new T.ShapeGeometry(flesh,24),'#ee858a',[0,.03,.004],[.86,.92,1],'StrawberryCutFlesh',.88);
  const heart=new T.Shape();heart.moveTo(0,.17);heart.bezierCurveTo(-.11,.17,-.19,.27,-.17,.48);heart.bezierCurveTo(-.145,.63,-.06,.75,0,.82);heart.bezierCurveTo(.06,.75,.145,.63,.17,.48);heart.bezierCurveTo(.19,.27,.11,.17,0,.17);heart.closePath();
  add(fruit,new T.ShapeGeometry(heart,24),'#f5b9bc',[0,-.025,.009],[1.12,1.06,1],'StrawberryHeartEdge',.95);
  add(fruit,new T.ShapeGeometry(heart,24),'#fff5df',[0,0,.012],[1,1,1],'StrawberryWhiteHeart',.95);
  const radius=y=>{for(let i=1;i<profile.length;i++)if(y<=profile[i][1]){const t=(y-profile[i-1][1])/(profile[i][1]-profile[i-1][1]);return T.MathUtils.lerp(profile[i-1][0],profile[i][0],t);}return 0;};
  if(garnish)for(let row=0;row<4;row++)for(let i=0;i<5;i++){
   const y=.24+row*.17,a=Math.PI+(i+.5)/5*Math.PI,r=radius(y)+.004;
   const seed=sphere(fruit,'#ebc694',[Math.cos(a)*r,y,Math.sin(a)*r],[.018,.031,.009],'StrawberrySeed');seed.rotation.y=Math.PI/2-a;seed.rotation.z=.16*Math.cos(a);
  }
  if(garnish)for(const side of[-1,1])for(let i=0;i<5;i++){const y=.26+i*.145,r=radius(y);sphere(fruit,'#fff0cb',[side*r*.80,y,.012],[.014,.020,.004],'StrawberryCutSeed');}
  if(garnish)for(let i=0;i<5;i++){const a=i/5*Math.PI*2;const mesh=leaf(fruit,[Math.sin(a)*.03,.94,Math.cos(a)*.03],.40,.9);mesh.rotation.y=a;}
  return fruit;
 };
 const cherry=(group,position,size=.16)=>{
  const fruit=new T.Group();fruit.name='Cherry';fruit.position.fromArray(position);fruit.scale.setScalar(size);group.add(fruit);
  sphere(fruit,'#b95759',[0,.44,0],[.43,.44,.43],'CherryFruit',.4);
  tube(fruit,[[.01,.78,0],[.04,1.15,0],[.28,1.36,.01]],'#776551',.032,'CherryStem');leaf(fruit,[.24,1.28,.01],.4,-.8);return fruit;
 };
 const blueberry=(group,position,size=.12)=>{
  const fruit=new T.Group();fruit.name='Blueberry';fruit.position.fromArray(position);fruit.scale.setScalar(size);group.add(fruit);
  sphere(fruit,'#77789d',[0,.44,0],[.45,.43,.45],'BlueberryFruit',.68);
  const crown=new T.Shape();for(let i=0;i<10;i++){const a=i/10*Math.PI*2,r=i%2?.105:.20;const x=Math.cos(a)*r,y=Math.sin(a)*r;i?crown.lineTo(x,y):crown.moveTo(x,y);}crown.closePath();const g=new T.ExtrudeGeometry(crown,{depth:.02,bevelEnabled:false});g.rotateX(-Math.PI/2);add(fruit,g,'#545870',[0,.85,0],[1,1,1],'BerryCrown');return fruit;
 };
 const chocolate=(group,position,size=.22,angle=.2)=>{
  const bar=new T.Group();bar.name='ChocolateSquares';bar.position.fromArray(position);bar.rotation.z=angle;bar.rotation.y=-.15;bar.scale.setScalar(size);group.add(bar);
  add(bar,roundBox(.95,1.10,.16,.035),'#684735',[0,.55,0],[1,1,1],'ChocolateBar',.64);
  for(let x=0;x<2;x++)for(let y=0;y<3;y++)add(bar,roundBox(.39,.28,.075,.035),'#78523d',[(x-.5)*.44,.18+y*.34,.11],[1,1,1],'ChocolateSquare',.6);
  return bar;
 };
 const chocolateCurl=(group,position,size=.23,angle=0)=>{
  const p=[],ix=[],steps=48;for(let i=0;i<=steps;i++){const t=i/steps,a=t*Math.PI*2*1.25,r=.21+.07*t;for(const side of[-1,1])p.push(Math.cos(a)*r,.09+a*.035,Math.sin(a)*r+side*.13);}
  // A fine solid ribbon, including underside and both narrow edge walls.
  const n=p.length/3;for(let i=0;i<n;i++)p.push(p[i*3],p[i*3+1]-.026,p[i*3+2]);
  for(let i=0;i<steps;i++){const a=i*2,b=a+2;ix.push(a,b,b+1,a,b+1,a+1,n+a,n+b+1,n+b,n+a,n+a+1,n+b+1,a,n+a,n+b,a,n+b,b,a+1,b+1,n+b+1,a+1,n+b+1,n+a+1);}
  ix.push(0,1,n+1,0,n+1,n,(n-2),2*n-2,2*n-1,n-2,2*n-1,n-1);
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(ix);g.computeVertexNormals();const mesh=add(group,g,'#6c4938',position,[size,size,size],'ChocolateCurl',.58);mesh.rotation.y=angle;return mesh;
 };
 const peach=(group,position,size=.22,angle=0)=>{
  const sh=new T.Shape();sh.moveTo(-.45,0);sh.bezierCurveTo(-.35,.85,.40,.88,.48,.18);sh.bezierCurveTo(.08,.44,-.10,.39,-.45,0);sh.closePath();
  const g=new T.ExtrudeGeometry(sh,{depth:.19,bevelEnabled:true,bevelSize:.04,bevelThickness:.025,bevelSegments:3,curveSegments:16});const mesh=add(group,g,'#e9b085',position,[size,size,size],'PeachSlice',.5);mesh.rotation.y=angle;mesh.rotation.x=-.35;return mesh;
 };
 return{add,sphere,tube,dollop,leaf,strawberry,cherry,blueberry,chocolate,chocolateCurl,peach,material};
}

// Bake decorative pieces into material batches. Every seed and cream ridge
// remains real geometry, while a dressed cake uses a small set of draw calls.
export function batchPastry(group){
 group.updateMatrixWorld(true);const inverse=group.matrixWorld.clone().invert(),batches=new Map(),meshes=[];
 group.traverse(mesh=>{if(!mesh.isMesh)return;meshes.push(mesh);const material=mesh.material;if(!batches.has(material))batches.set(material,{positions:[],normals:[],names:new Set()});const out=batches.get(material),matrix=inverse.clone().multiply(mesh.matrixWorld),normal=new T.Matrix3().getNormalMatrix(matrix),p=mesh.geometry.attributes.position,n=mesh.geometry.attributes.normal,v=new T.Vector3(),indices=mesh.geometry.index?.array??Array.from({length:p.count},(_,i)=>i);out.names.add(mesh.name);
  for(const i of indices){v.fromBufferAttribute(p,i).applyMatrix4(matrix);out.positions.push(v.x,v.y,v.z);v.fromBufferAttribute(n,i).applyMatrix3(normal).normalize();out.normals.push(v.x,v.y,v.z);}
 });
 meshes.forEach(mesh=>mesh.geometry.dispose());group.clear();
 for(const[material,data]of batches){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(data.positions,3));g.setAttribute('normal',new T.Float32BufferAttribute(data.normals,3));const mesh=new T.Mesh(g,material);mesh.name='Pastry-'+[...data.names].join('+');mesh.userData.smoothAccessory=true;mesh.userData.pastryParts=[...data.names];mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);}
 return group;
}
