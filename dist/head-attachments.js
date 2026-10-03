import * as T from './vendor/three.module.js';

// Preserve each ornament's depth while its back follows the curved skull.
export function seatOnHead(group,surface,origin,gap=.006){
 group.updateMatrix();const point=new T.Vector3(),cx=group.position.x,cy=group.position.y+origin[1],cz=surface.front(cx,cy)??group.position.z,step=.08;
 const front=(x,y)=>surface.front(x,y)??cz,clamp=T.MathUtils.clamp;
 const left=front(cx-step,cy),right=front(cx+step,cy),down=front(cx,cy-step),up=front(cx,cy+step);
 const dx=clamp((right-left)/(2*step),-1.6,1.6),dy=clamp((up-down)/(2*step),-1.6,1.6),xx=clamp((right+left-2*cz)/(step*step),-5,0),yy=clamp((up+down-2*cz)/(step*step),-5,0);
 for(const mesh of group.children){
  if(!mesh.isMesh)continue;mesh.updateMatrix();
  const matrix=group.matrix.clone().multiply(mesh.matrix),inverse=matrix.clone().invert(),p=mesh.geometry.attributes.position;
  for(let i=0;i<p.count;i++){
   point.fromBufferAttribute(p,i).applyMatrix4(matrix);const x=point.x-cx,y=point.y+origin[1]-cy;
   // A continuous local fit also covers the crown silhouette, where a front
   // ray stops hitting the skull. Preserve the ornament's rounded volume.
   point.z=cz+dx*x+dy*y+.5*(xx*x*x+yy*y*y)+gap+(point.z-group.position.z);point.applyMatrix4(inverse);p.setXYZ(i,...point.toArray());
  }
  p.needsUpdate=true;mesh.geometry.computeVertexNormals();
 }
}

export function addEarJewelry(head,s,origin,surface){
 head.updateWorldMatrix(true,true);
 const material=new T.MeshStandardMaterial({color:s.earringColor,roughness:.6});material.userData.colorSetting='earringColor';
 const ray=new T.Raycaster(),up=new T.Vector3(0,0,-1).transformDirection(head.matrixWorld),local=new T.Vector3(),center=new T.Vector3(),box=new T.Box3();
 const ears=[];head.getObjectByName('AnimalEars')?.traverse(o=>{if(o.isMesh&&o.userData.role==='ears')ears.push(o);});
 const sides=s.earringSide==='right'?[1]:s.earringSide==='left'?[-1]:[-1,1];
 if(s.earrings==='cuffs'){
  for(const side of sides){
   const assembly=new T.Group();assembly.name='Earring';assembly.userData.earCuffs=true;head.add(assembly);
   for(const fraction of [.32,.53]){
    let x,y,z;
    if(surface.earFront&&['cat','fox','wolf'].includes(s.species)){
     const base=surface.top(side*.54,-.10);y=base+s.ears*({cat:.60,fox:.94,wolf:.31}[s.species])*fraction;
     let edge=null;for(let distance=.05;distance<1.6;distance+=.003){if(surface.earFront(side*distance,y)!==null)edge=distance;}
     if(edge===null)continue;x=side*(edge+.015);z=surface.earFront(side*(edge-.016),y)??0;y-=origin[1];
    }else{
     const selected=ears.filter(o=>{new T.Box3().setFromObject(o).getCenter(center);head.worldToLocal(center);return Math.sign(center.x)===side;});
     box.makeEmpty();for(const mesh of selected)box.union(new T.Box3().setFromObject(mesh));if(box.isEmpty())continue;
     const min=head.worldToLocal(box.min.clone()),max=head.worldToLocal(box.max.clone());y=T.MathUtils.lerp(min.y,max.y,.60+fraction*.30);
     let anchor=null;for(let q=0;q<=1;q+=.01){const px=side>0?max.x-q*(max.x-min.x):min.x+q*(max.x-min.x);ray.set(new T.Vector3(px,y,3).applyMatrix4(head.matrixWorld),up);const hit=ray.intersectObjects(selected,false)[0];if(hit){anchor=head.worldToLocal(hit.point.clone());break;}}
     if(!anchor)continue;x=anchor.x+side*.015;z=anchor.z;
    }
    const part=new T.Group();part.name='EarCuff';part.position.set(x,y,z-.020);assembly.add(part);
    const ring=new T.Mesh(new T.TorusGeometry(.061,.013,8,24),material);ring.rotation.y=side*.45;ring.castShadow=true;part.add(ring);
   }
   if(!assembly.children.length)assembly.removeFromParent();
  }
  return;
 }
 for(const side of sides){
  let anchor;
  if(surface.earFront&&['cat','fox','wolf'].includes(s.species)){
   const base=surface.top(side*.54,-.10);
   for(const fraction of[.16,.25,.08])for(const distance of[.70,.65,.60]){
    if(anchor)break;const y=base+s.ears*fraction,z=surface.earFront(side*distance,y);
    if(z!==null)anchor=new T.Vector3(side*distance,y-origin[1],z);
   }
  }
  if(!anchor&&ears.length){
   const selected=ears.filter(o=>{new T.Box3().setFromObject(o).getCenter(center);head.worldToLocal(center);return Math.sign(center.x)===side;});
   box.makeEmpty();for(const mesh of selected)box.union(new T.Box3().setFromObject(mesh));
   if(!box.isEmpty()){
    const min=head.worldToLocal(box.min.clone()),max=head.worldToLocal(box.max.clone());
    for(const fraction of[.30,.42,.55,.65])for(const across of[.70,.60,.50]){
     if(anchor)break;const x=side<0?max.x-(max.x-min.x)*across:min.x+(max.x-min.x)*across,y=min.y+(max.y-min.y)*fraction;
     const start=new T.Vector3(x,y,3).applyMatrix4(head.matrixWorld);ray.set(start,up);const hit=ray.intersectObjects(selected,false)[0];
     if(hit)anchor=head.worldToLocal(hit.point.clone());
    }
   }
  }
  if(!anchor){const x=side*.72,y=(surface.top(x,0)??1.8)-.30;anchor=new T.Vector3(x,y-origin[1],surface.front(x,y)??.2);}
  const group=new T.Group();group.name='Earring';group.position.copy(anchor);group.position.z+=.004;head.add(group);
  const stud=new T.Mesh(new T.SphereGeometry(.024,10,8),material);stud.position.z=.006;stud.castShadow=true;group.add(stud);
  if(s.earrings==='hoop'){const ring=new T.Mesh(new T.TorusGeometry(.071,.014,8,20),material);ring.position.y=-.067;ring.castShadow=true;group.add(ring);}
 }
}
