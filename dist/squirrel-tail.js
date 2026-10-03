import * as T from './vendor/three.module.js';
const cache=new Map();let brush;
function sculpt(length,thickness){
 const controls=[[[0,.035,-.24],.085],[[0,.015,-.47],.14],[[0,.24,-.82],.27],[[0,.62,-1.03],.31],[[0,1.01,-.90],.28],[[0,1.40,-.64],.30],[[0,1.72,-.77],.30],[[0,1.81,-1.04],.29],[[0,1.69,-1.31],.23],[[0,1.45,-1.40],.17],[[.02,1.24,-1.24],.16],[[.07,1.30,-1.00],.145],[[.14,1.48,-1.01],.12],[[.23,1.58,-1.17],.095],[[.27,1.48,-1.29],.085]];
 const anchor=new T.Vector3(0,.035,-.24),curve=new T.CatmullRomCurve3(controls.map(([p])=>new T.Vector3(...p).sub(anchor).multiplyScalar(length))),points=[],radii=[];
 for(let i=0;i<=56;i++){const t=i/56,j=t*(controls.length-1),k=Math.min(controls.length-2,Math.floor(j));points.push(curve.getPoint(t));radii.push(T.MathUtils.lerp(controls[k][1],controls[k+1][1],j-k)*thickness);}
 const min=new T.Vector3(Infinity,Infinity,Infinity),max=min.clone().negate();for(let i=0;i<points.length;i++){min.min(points[i].clone().addScalar(-radii[i]-.075));max.max(points[i].clone().addScalar(radii[i]+.075));}
 const span=max.clone().sub(min),cell=.044*Math.min(1,Math.max(.65,length)),nx=T.MathUtils.clamp(Math.ceil(span.x/cell),18,44),ny=T.MathUtils.clamp(Math.ceil(span.y/cell),28,112),nz=T.MathUtils.clamp(Math.ceil(span.z/cell),24,88),dx=span.x/nx,dy=span.y/ny,dz=span.z/nz,row=nx+1,plane=row*(ny+1),field=new Float32Array(plane*(nz+1));
 const segments=points.slice(0,-1).map((a,i)=>{const b=points[i+1];return{ax:a.x,ay:a.y,az:a.z,x:b.x-a.x,y:b.y-a.y,z:b.z-a.z,r:radii[i],dr:radii[i+1]-radii[i]};});for(const e of segments)e.square=e.x*e.x+e.y*e.y+e.z*e.z;
 const core=new T.Vector3(.025,1.46,-1.15).sub(anchor).multiplyScalar(length),coreRadius=.14*thickness;
 // Merge the padded brush and its rolled tip into one closed rounded volume.
 for(let z=0;z<=nz;z++)for(let y=0;y<=ny;y++)for(let x=0;x<=nx;x++){
  const px=min.x+x*dx,py=min.y+y*dy,pz=min.z+z*dz;let d=Math.hypot(px-core.x,py-core.y,pz-core.z)-coreRadius;
  for(const e of segments){const vx=px-e.ax,vy=py-e.ay,vz=pz-e.az,t=T.MathUtils.clamp((vx*e.x+vy*e.y+vz*e.z)/e.square,0,1),q=Math.hypot(vx-t*e.x,vy-t*e.y,vz-t*e.z)-e.r-t*e.dr;d=Math.min(d,q);}field[x+y*row+z*plane]=d;
 }
 const vertices=[],indices=[],edges=new Map(),coordinate=id=>{const z=Math.floor(id/plane),rest=id-z*plane,y=Math.floor(rest/row),x=rest-y*row;return new T.Vector3(min.x+x*dx,min.y+y*dy,min.z+z*dz);};
 const crossing=(a,b)=>{const key=a<b?a+','+b:b+','+a;if(!edges.has(key)){const p=coordinate(a).lerp(coordinate(b),field[a]/(field[a]-field[b]));edges.set(key,vertices.length/3);vertices.push(...p.toArray());}return edges.get(key);};
 const triangle=(a,b,c,outward)=>{const pa=new T.Vector3().fromArray(vertices,a*3),pb=new T.Vector3().fromArray(vertices,b*3),pc=new T.Vector3().fromArray(vertices,c*3);if(pb.sub(pa).cross(pc.sub(pa)).dot(outward)<0)[b,c]=[c,b];indices.push(a,b,c);};
 const tetrahedra=[[0,5,1,6],[0,1,2,6],[0,2,3,6],[0,3,7,6],[0,7,4,6],[0,4,5,6]];
 for(let z=0;z<nz;z++)for(let y=0;y<ny;y++)for(let x=0;x<nx;x++){
  const i=x+y*row+z*plane,cube=[i,i+1,i+1+row,i+row,i+plane,i+1+plane,i+1+row+plane,i+row+plane];if(cube.every(i=>field[i]>=0)||cube.every(i=>field[i]<0))continue;
  for(const tet of tetrahedra){const ids=tet.map(j=>cube[j]),inside=ids.filter(i=>field[i]<0),outside=ids.filter(i=>field[i]>=0);if(!inside.length||!outside.length)continue;
   const out=new T.Vector3(),inn=new T.Vector3();outside.forEach(i=>out.add(coordinate(i)));inside.forEach(i=>inn.add(coordinate(i)));out.divideScalar(outside.length).sub(inn.divideScalar(inside.length));
   if(inside.length===1||outside.length===1){const lone=inside.length===1?inside[0]:outside[0],others=inside.length===1?outside:inside;triangle(...others.map(i=>crossing(lone,i)),out);}else{const[a,b]=inside,[c,d]=outside,ac=crossing(a,c),ad=crossing(a,d),bc=crossing(b,c),bd=crossing(b,d);triangle(ac,ad,bc,out);triangle(ad,bd,bc,out);}
  }
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();return g;
}
export function addSquirrelTail(group,material,anchor,s){
 const length=s.tailLength??1,thickness=s.tailThickness??1,key=[length,thickness].join('|');if(!cache.has(key)){brush??=sculpt(1,1);cache.set(key,brush.clone().scale(thickness,length,length));if(cache.size>8){const first=cache.keys().next().value;cache.get(first).dispose();cache.delete(first);}}
 const mesh=new T.Mesh(cache.get(key).clone(),material);mesh.name='SquirrelBrush';mesh.castShadow=true;mesh.userData.role='tail';mesh.userData.smoothAccessory=true;group.add(mesh);
}
