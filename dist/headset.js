import * as T from './vendor/three.module.js';
export function addHeadset(head,s,origin,surface){
 const group=new T.Group();group.name='Headset';group.userData.role='headset';head.add(group);
 const shell=new T.MeshStandardMaterial({color:s.headsetColor,roughness:.48,metalness:.12});shell.userData.colorSetting='headsetColor';
 const cushion=shell.clone();cushion.color.multiplyScalar(.64);cushion.roughness=.92;cushion.metalness=0;cushion.userData.colorScale=.64;
 const add=(g,m,p,scale=[1,1,1])=>{const o=new T.Mesh(g,m);o.position.fromArray(p);o.scale.fromArray(scale);o.castShadow=true;o.userData.smoothAccessory=true;group.add(o);return o;};
 const crest=surface.top(0,0)-origin[1],cy=crest-.56,points=[];
 for(let i=0;i<=28;i++){const a=i/28*Math.PI;points.push(new T.Vector3(-.99*Math.cos(a),cy+.75*Math.sin(a),-.035));}
 add(new T.TubeGeometry(new T.CatmullRomCurve3(points),32,.026,8,false),shell,[0,0,0]);
 add(new T.TubeGeometry(new T.CatmullRomCurve3(points.slice(8,21)),16,.052,8,false),cushion,[0,0,0],[1,.99,1]);
 const shape=new T.Shape();shape.moveTo(-.14,-.17);shape.lineTo(-.14,.17);shape.quadraticCurveTo(-.14,.27,-.04,.27);shape.lineTo(.04,.27);shape.quadraticCurveTo(.14,.27,.14,.17);shape.lineTo(.14,-.17);shape.quadraticCurveTo(.14,-.27,.04,-.27);shape.lineTo(-.04,-.27);shape.quadraticCurveTo(-.14,-.27,-.14,-.17);shape.closePath();
 for(const side of[-1,1]){
  const cup=add(new T.ExtrudeGeometry(shape,{depth:.15,bevelEnabled:true,bevelThickness:.045,bevelSize:.035,bevelSegments:3,curveSegments:12}),shell,[side*.89,cy,.055]);cup.rotation.y=side*Math.PI/2;
  add(new T.SphereGeometry(1,16,10),cushion,[side*.865,cy,.055],[.055,.25,.165]);
  const pin=add(new T.SphereGeometry(.027,8,6),shell,[side*1.09,cy+.27,.055],[1,.6,1]);
 }
}
