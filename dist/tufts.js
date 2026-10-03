import * as T from './vendor/three.module.js';

// A few closed, tapered locks, embedded at the roots. No all-over fur layer.
export function addTufts(head,s,origin,surface,spine){
 if(s.tufts==='none')return;
 const group=new T.Group();group.name='Tufts';head.add(group);
 const material=new T.MeshStandardMaterial({color:s.tuftSeparate?s.tuftColor:s.bodyColor,roughness:.78,flatShading:true});material.userData.colorSetting=s.tuftSeparate?'tuftColor':'bodyColor';
 function strand(start,end){const direction=end.clone().sub(start),mesh=new T.Mesh(new T.CapsuleGeometry(.012,direction.length(),2,6),material);mesh.position.copy(start).addScaledVector(direction,.5);mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),direction.normalize());mesh.castShadow=true;group.add(mesh);}
 function lock(start,end,width,parent=group){
  const direction=end.clone().sub(start),axis=direction.clone().normalize(),side=new T.Vector3(0,0,1).cross(axis).normalize(),depth=axis.clone().cross(side),positions=[],indices=[],rings=4,segments=6;
  for(let i=0;i<rings;i++){const t=i/rings,center=start.clone().addScaledVector(direction,t),r=width*(1-t)*(.85+.2*Math.sin(t*Math.PI));for(let j=0;j<segments;j++){const angle=j/segments*Math.PI*2,p=center.clone().addScaledVector(side,Math.cos(angle)*r).addScaledVector(depth,Math.sin(angle)*r*.65);positions.push(...p.toArray());}}
  for(let i=0;i<rings-1;i++)for(let j=0;j<segments;j++){const a=i*segments+j,b=i*segments+(j+1)%segments,c=a+segments,d=b+segments;indices.push(a,b,d,a,d,c);}
  const bottom=positions.length/3;positions.push(...start.toArray(),...end.toArray());for(let j=0;j<segments;j++){indices.push(bottom,(j+1)%segments,j);indices.push((rings-1)*segments+j,(rings-1)*segments+(j+1)%segments,bottom+1);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();const mesh=new T.Mesh(g,material);mesh.castShadow=true;parent.add(mesh);
 }
 if(['crown','both'].includes(s.tufts))for(const[x,h,lean]of[[-.12,.18,-.09],[.015,.26,-.06],[.12,.17,.06]]){const y=surface.top(x,-.02)-origin[1]-.035;lock(new T.Vector3(x,y,-.02),new T.Vector3(x+lean,y+h,.015),.070);}
 if(['cheeks','both'].includes(s.tufts))for(const side of[-1,1])for(let i=0;i<2;i++){const y=1.38-i*.105,z=surface.front(side*.72,y);if(z===null)continue;const start=new T.Vector3(side*.72,y-origin[1],z-.05),end=start.clone().add(new T.Vector3(side*(.20-i*.035),-.04-i*.045,.01));lock(start,end,.064);}
 if(['wisps','pairedWisps'].includes(s.tufts)){
  const paired=s.tufts==='pairedWisps';
  for(let i=0;i<(paired?2:1);i++){const x=-.08+i*.05,y=surface.top(x,.03)-origin[1]-.015;strand(new T.Vector3(x,y,.03),new T.Vector3(x+.022,y+.13+i*.015,.03));}
  for(const[side,y,length,rise]of[[-1,1.73,.125,.04],[1,1.49,.11,.045],[-1,1.25,.085,-.025]])for(let i=0;i<(paired?2:1);i++){
   const py=y-i*.045;let edge=1.05;while(edge>.3&&surface.front(side*edge,py)===null)edge-=.01;const x=side*(edge-.025),z=surface.front(x,py);if(z===null)continue;const start=new T.Vector3(x,py-origin[1],z+.01),end=start.clone().add(new T.Vector3(side*length,rise,.025));strand(start,end);
  }
 }
}
