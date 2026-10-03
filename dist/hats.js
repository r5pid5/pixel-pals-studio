import * as T from './vendor/three.module.js';

// Each hat has its own crown, brim and depth, seated around the skull crown.
export function addHatShape(group,s,crown,origin,star,surface){
 const color=new T.Color(s.hatColor);
 const cloth=new T.MeshStandardMaterial({color,roughness:.85,side:T.DoubleSide});cloth.userData.colorSetting='hatColor';
 const trim=cloth.clone();trim.color.multiplyScalar(.80);trim.userData.colorScale=.80;
 const add=(geometry,material=cloth,position=[0,0,0],scale=[1,1,1])=>{const m=new T.Mesh(geometry,material);m.position.fromArray(position);m.scale.fromArray(scale);m.castShadow=true;m.userData.smoothAccessory=true;group.add(m);return m;};
 const lathe=(profile,position=[0,0,0],scale=[1,1,1],material=cloth,segments=32)=>{
  const g=new T.LatheGeometry(profile.map(([r,y])=>new T.Vector2(r,y)),segments),p=g.attributes.position,gains=new Map();
  for(let i=0;i<p.count;i++){const row=p.getY(i).toFixed(6),x=p.getX(i)*scale[0]+position[0],z=p.getZ(i)*scale[2]+position[2],radius=Math.hypot(x,z);if(radius<.001)continue;const required=surface.radial(crown-.18+p.getY(i)+position[1],Math.atan2(z,x));if(required!==null)gains.set(row,Math.max(gains.get(row)??1,(required+.03)/radius));}
  for(let i=0;i<p.count;i++){const gain=gains.get(p.getY(i).toFixed(6))??1;p.setX(i,((p.getX(i)*scale[0]+position[0])*gain-position[0])/scale[0]);p.setZ(i,((p.getZ(i)*scale[2]+position[2])*gain-position[2])/scale[2]);}
  g.computeVertexNormals();return add(g,material,position,scale);
 };
 const softCrown=(profile,position=[0,0,0],scale=[1,1,1])=>{const curve=new T.CatmullRomCurve3(profile.map(([r,y])=>new T.Vector3(r,y,0)),false,'centripetal');return lathe(curve.getPoints(24).map(p=>[Math.max(0,p.x),p.y]),position,scale,cloth,40);};
 const band=(radius,y,height=.07,depth=.73)=>lathe([[radius-.014,y],[radius+.005,y],[radius+.012,y+height],[radius-.015,y+height]], [0,0,-.015],[1,1,depth]);
 const cord=(points,r=.008,material=trim)=>add(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),12,r,5,false),material);
 group.position.y=crown-origin[1]-.18;
 if(s.hatStyle==='beret'){
  const top=softCrown([[0,.24],[.20,.25],[.48,.21],[.74,.12],[.92,.025],[.95,-.055],[.91,-.16],[.82,-.26],[.80,-.33]],[-.055,-.01,-.025],[1,1,.74]);
  const p=top.geometry.attributes.position;for(let i=0;i<p.count;i++)p.setY(i,p.getY(i)+p.getX(i)*.055*T.MathUtils.smoothstep(p.getY(i),-.30,.16));top.geometry.computeVertexNormals();
  const stalk=add(new T.CapsuleGeometry(.024,.052,3,8),cloth,[-.06,.29,-.025]);stalk.rotation.z=-.12;
 }else if(s.hatStyle==='y2k'){
  softCrown([[0,.30],[.22,.28],[.44,.22],[.64,.095],[.79,-.075],[.84,-.25]],[0,0,-.015],[1,1,.77]);
  const hem=[];for(let i=0;i<=20;i++){const a=Math.PI*.12+i/20*Math.PI*.76;hem.push([Math.cos(a)*.84,-.25,Math.sin(a)*.64-.015]);}cord(hem,.042,cloth);
  for(const side of[-1,1]){
   const flap=add(new T.CapsuleGeometry(.13,.28,5,16),cloth,[side*.95,-.43,.045],[1,1,.85]);flap.rotation.z=side*.10;
   cord([[side*.97,-.69,.08],[side*.97,-.78,.09],[side*.93,-.86,.10]],.011,cloth);
  }
  const badge=new T.MeshStandardMaterial({color:s.clipColor,roughness:.65});badge.userData.colorSetting='clipColor';add(star(.085),badge,[-.29,-.10,Math.max(.61,(surface.front(-.29,crown-.28)??.58)+.035)]);
 }else if(s.hatStyle==='bucket'){
  lathe([[0,.32],[.50,.32],[.56,.295],[.80,-.19],[.84,-.21],[1.08,-.35],[1.09,-.375]],[0,0,-.015],[1,1,.78]);
  band(.766,-.12,.038,.78);
 }else if(s.hatStyle==='cap'){
  lathe([[0,.39],[.20,.38],[.43,.31],[.64,.17],[.77,-.04],[.815,-.28]],[0,0,-.04],[1,1,.75]);
  band(.82,-.29,.055,.75);
  const bill=new T.Shape();bill.moveTo(-.66,0);bill.bezierCurveTo(-.84,.16,-.74,.45,-.55,.54);bill.bezierCurveTo(-.25,.67,.25,.67,.55,.54);bill.bezierCurveTo(.74,.45,.84,.16,.66,0);bill.quadraticCurveTo(0,.11,-.66,0);bill.closePath();
  const visor=add(new T.ExtrudeGeometry(bill,{depth:.03,bevelEnabled:true,bevelSize:.012,bevelThickness:.008,bevelSegments:1,curveSegments:14}),cloth,[0,-.28,.43]);visor.rotation.x=Math.PI/2;
  cord([[-.58,-.252,.91],[-.28,-.252,1.03],[0,-.252,1.065],[.28,-.252,1.03],[.58,-.252,.91]],.005);
  for(const side of[-1,1])cord([[side*.63,-.22,.34],[side*.47,.07,.37],[side*.25,.31,.27],[0,.395,-.04]],.006);
  add(new T.SphereGeometry(.044,10,6),cloth,[0,.405,-.04],[1,.55,1]);
 }else if(s.hatStyle==='beanie'){
  const knit=lathe([[0,.61],[.12,.59],[.28,.52],[.48,.39],[.66,.21],[.77,-.02],[.81,-.24]],[0,0,-.015],[1,1,.74],cloth,48);
  const cuff=lathe([[.806,-.325],[.842,-.325],[.871,-.29],[.873,-.145],[.852,-.115],[.809,-.115]], [0,0,-.015],[1,1,.74],cloth,72);
  for(const part of[knit,cuff]){const p=part.geometry.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),r=Math.hypot(x,z);if(!r)continue;const gain=1+.007*Math.cos(Math.atan2(z,x)*24);p.setX(i,x*gain);p.setZ(i,z*gain);}part.geometry.computeVertexNormals();}
  add(new T.SphereGeometry(.105,12,8),cloth,[0,.66,-.015]);
 }
}
