import * as T from './vendor/three.module.js';
export function addWhaleTail(group,material,anchor,s){
 const length=s.tailLength??1,thickness=s.tailThickness??1;
 const points=[[0,.035,-.24],[0,.01,-.49],[0,.10,-.77],[0,.32,-1.02],[0,.52,-1.16]].map(p=>new T.Vector3(...p).sub(anchor).multiplyScalar(length).add(anchor)),curve=new T.CatmullRomCurve3(points);
 const add=(g,position)=>{const o=new T.Mesh(g,material);o.castShadow=true;o.userData.role='tail';o.userData.smoothAccessory=true;if(position)o.position.copy(position).sub(anchor);group.add(o);return o;};
 const segments=28,radial=12,g=new T.TubeGeometry(curve,segments,1,radial,false),p=g.attributes.position;
 for(let ring=0;ring<=segments;ring++){const t=ring/segments,center=curve.getPointAt(t),r=(.15-.045*t+.025*Math.sin(Math.PI*t))*thickness;for(let j=0;j<=radial;j++){const i=ring*(radial+1)+j,v=new T.Vector3().fromBufferAttribute(p,i).sub(center).multiplyScalar(r).add(center).sub(anchor);p.setXYZ(i,...v.toArray());}}
 g.computeVertexNormals();add(g);
 const end=points.at(-1),axis=curve.getTangentAt(1).normalize(),span=new T.Vector3(1,0,0),normal=new T.Vector3().crossVectors(span,axis).normalize();
 add(new T.SphereGeometry(.115*thickness,12,8),end);
 add(new T.SphereGeometry(.15*thickness,12,8),points[0]);
 // A single lofted volume: curved upper/lower surfaces, swept tips and a central V.
 // Each cross-section is rounded, including the broad middle; there are no flat caps.
 const vertices=[],indices=[],rings=32,sides=16;
 const vertex=(x,y,z)=>{const v=end.clone().addScaledVector(span,x).addScaledVector(axis,y).addScaledVector(normal,z*thickness).sub(anchor);vertices.push(...v.toArray());};
 vertex(-.66,.32,.035);
 for(let i=1;i<rings;i++){
  const x=-.66+1.32*i/rings,u=Math.abs(x)/.66,leading=-.17+.49*Math.pow(u,1.65),trailing=.10+.25*Math.pow(u,.65)-.03*u*u;
  const center=(leading+trailing)/2,width=(trailing-leading)/2,depth=.115*Math.pow(1-Math.pow(u,1.4),.6);
  for(let j=0;j<sides;j++){const angle=j/sides*Math.PI*2;vertex(x,center+width*Math.cos(angle),.035*u*u+depth*Math.sin(angle));}
 }
 const tipIndex=vertices.length/3;vertex(.66,.32,.035);
 for(let j=0;j<sides;j++){const next=(j+1)%sides;indices.push(0,1+next,1+j);const base=1+(rings-2)*sides;indices.push(tipIndex,base+j,base+next);}
 for(let i=0;i<rings-2;i++)for(let j=0;j<sides;j++){const next=(j+1)%sides,a=1+i*sides+j,b=a+sides,c=1+(i+1)*sides+next,d=1+i*sides+next;indices.push(a,d,b,b,d,c);}
 const fluke=new T.BufferGeometry();fluke.setAttribute('position',new T.Float32BufferAttribute(vertices,3));fluke.setIndex(indices);fluke.computeVertexNormals();const fin=add(fluke);fin.name='WhaleFluke';
}
