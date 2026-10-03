import * as T from './vendor/three.module.js';
// Keep the sculpt's roundness while letting individual polygon planes read.
export function facetMesh(mesh,enabled){
 if(!mesh.isMesh||mesh.userData.outline||mesh.userData.smoothAccessory)return;
 if(mesh.userData.facetEnabled===enabled)return;
 mesh.userData.facetEnabled=enabled;
 if(mesh.geometry.index){const old=mesh.geometry;mesh.geometry=old.toNonIndexed();old.dispose();}
 const g=mesh.geometry,n=g.attributes.normal,p=g.attributes.position;
 if(!n)return;g.userData.baseNormals??=Array.from(n.array);
 const base=g.userData.baseNormals,strength=enabled?.14:0;
 const a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3(),normal=new T.Vector3();
 for(let i=0;i<p.count;i+=3){a.fromBufferAttribute(p,i);b.fromBufferAttribute(p,i+1);c.fromBufferAttribute(p,i+2);const face=b.sub(a).cross(c.sub(a)).normalize();for(let j=0;j<3;j++){const k=(i+j)*3;normal.set(base[k],base[k+1],base[k+2]).lerp(face,strength).normalize();n.setXYZ(i+j,normal.x,normal.y,normal.z);}}
 n.needsUpdate=true;for(const m of Array.isArray(mesh.material)?mesh.material:[mesh.material]){m.flatShading=false;m.needsUpdate=true;}
}
