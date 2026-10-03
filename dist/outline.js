import * as T from './vendor/three.module.js';

export function addOutlines(root,s){
 const meshes=[];root.traverse(o=>{if(o.isMesh&&!o.userData.outline)meshes.push(o);});
 for(const mesh of meshes){
  const geometry=mesh.geometry.clone(),p=geometry.attributes.position,n=geometry.attributes.normal;if(!n){geometry.computeVertexNormals();}
  const normals=geometry.attributes.normal,groups=new Map(),keys=[];
  for(let i=0;i<p.count;i++){const key=[p.getX(i),p.getY(i),p.getZ(i)].map(v=>v.toFixed(6)).join(':');keys.push(key);if(!groups.has(key))groups.set(key,new T.Vector3());groups.get(key).add(new T.Vector3().fromBufferAttribute(normals,i));}
  groups.forEach(v=>v.normalize());for(let i=0;i<p.count;i++){const v=groups.get(keys[i]);p.setXYZ(i,p.getX(i)+v.x*s.outlineWidth,p.getY(i)+v.y*s.outlineWidth,p.getZ(i)+v.z*s.outlineWidth);}
  geometry.computeBoundingBox();geometry.computeBoundingSphere();const material=new T.MeshBasicMaterial({color:s.outlineColor,side:T.BackSide,toneMapped:false,polygonOffset:true,polygonOffsetFactor:1,polygonOffsetUnits:1});material.userData.colorSetting='outlineColor';
  const edge=mesh.isSkinnedMesh?new T.SkinnedMesh(geometry,material):new T.Mesh(geometry,material);if(mesh.isSkinnedMesh)edge.bind(mesh.skeleton,mesh.bindMatrix);edge.name='Outline';edge.userData.outline=true;edge.renderOrder=-1;mesh.add(edge);
 }
}
