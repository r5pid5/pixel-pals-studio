import * as T from './vendor/three.module.js';

const point=(x,y)=>new T.Vector3(x,y,0);
const bezier=(a,b,c,d)=>new T.CubicBezierCurve3(point(...a),point(...b),point(...c),point(...d));
function outline(curves){
 const half=curves.flatMap((curve,i)=>curve.getPoints(64).slice(i?1:0));
 return [...half,...half.slice(1,-1).reverse().map(p=>point(-p.x,p.y))];
}
function intersectOutline(points,angle,centerY){
 const direction=new T.Vector2(Math.sin(angle),Math.cos(angle));let distance=0;
 for(let i=0;i<points.length;i++){
  const a=points[i],b=points[(i+1)%points.length],edge=new T.Vector2(b.x-a.x,b.y-a.y),denominator=direction.cross(edge);
  if(Math.abs(denominator)<1e-10)continue;
  const start=new T.Vector2(a.x,a.y-centerY),r=start.cross(edge)/denominator,u=start.cross(direction)/denominator;
  if(r>=0&&u>=-1e-8&&u<=1+1e-8)distance=Math.max(distance,r);
 }
 return point(direction.x*distance,centerY+direction.y*distance);
}

// The loose outline is independent of individual skull triangles. Keep one
// immutable template and give every character its own editable skin geometry.
let template;
function hoodTemplate(){
 if(template)return template;
 const centerY=1.47,faceTop=2.16,segments=96,rows=40;
 const opening=outline([
  bezier([0,.78],[.65,.78],[.94,.84],[.94,1.25]),
  bezier([.94,1.25],[.94,1.99],[.64,faceTop],[0,faceTop])
 ]);
 const outside=outline([
  bezier([0,2.27],[.70,2.29],[1.07,2.17],[1.07,1.82]),
  bezier([1.07,1.82],[1.075,1.62],[1.075,1.25],[1.07,1.04]),
  bezier([1.07,1.04],[1.07,.77],[.85,.74],[0,.74])
 ]);
 const boundaries=Array.from({length:segments+1},(_,j)=>{
  const angle=j===segments?0:j/segments*Math.PI*2,a=intersectOutline(opening,angle,centerY),b=intersectOutline(outside,angle,centerY);
  if(j===0||j===segments||j===segments/2){a.x=0;b.x=0;}
  return {a,b};
 });
 const base=[];
 // Front and outside contours share angular coordinates. Sweep towards a
 // rear pole so the entire forehead and roof remain one smooth surface.
 for(let i=0;i<rows;i++){
  const t=i/rows,frontEase=T.MathUtils.smoothstep(t,0,.24),rear=Math.max(0,(t-.24)/.76),sine=Math.sin(rear*Math.PI/2),radius=(1-sine**4)**.25;
  const z=t<=.24?T.MathUtils.lerp(.33,-.04,t/.24):-.04-.78*sine;
  for(const {a,b}of boundaries){
   const x=T.MathUtils.lerp(a.x,b.x,frontEase)*radius,y=centerY+(T.MathUtils.lerp(a.y,b.y,frontEase)-centerY)*radius;
   base.push(new T.Vector3(x,y,z));
  }
 }
 const pole=base.length;base.push(new T.Vector3(0,centerY,-.82));
 const faces=[];
 for(let i=0;i<rows-1;i++)for(let j=0;j<segments;j++){const a=i*(segments+1)+j,b=a+segments+1;faces.push(a,b+1,b,a,a+1,b+1);}
 const last=(rows-1)*(segments+1);for(let j=0;j<segments;j++)faces.push(last+j,last+j+1,pole);
 const surfaceGeometry=new T.BufferGeometry();surfaceGeometry.setAttribute('position',new T.Float32BufferAttribute(base.flatMap(p=>p.toArray()),3));surfaceGeometry.setIndex(faces);surfaceGeometry.computeVertexNormals();
 const normals=base.map((_,i)=>new T.Vector3().fromBufferAttribute(surfaceGeometry.attributes.normal,i));surfaceGeometry.dispose();
 for(let i=0;i<rows;i++){const a=i*(segments+1),b=a+segments,n=normals[a].clone().add(normals[b]).normalize();n.x=0;n.normalize();normals[a].copy(n);normals[b].copy(n);}
 const positions=[],indices=[],layer=base.length;
 for(const offset of[.008,-.009])for(let i=0;i<layer;i++)positions.push(...base[i].clone().addScaledVector(normals[i],offset).toArray());
 indices.push(...faces);const outerCount=indices.length;
 for(let i=0;i<faces.length;i+=3)indices.push(faces[i]+layer,faces[i+2]+layer,faces[i+1]+layer);
 const innerCount=indices.length-outerCount;
 for(let j=0;j<segments;j++)indices.push(j,j+layer,j+1+layer,j,j+1+layer,j+1);
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('normal',new T.Float32BufferAttribute([...normals.flatMap(n=>n.toArray()),...normals.flatMap(n=>n.clone().negate().toArray())],3));geometry.setIndex(indices);
 geometry.addGroup(0,outerCount,0);geometry.addGroup(outerCount,innerCount,1);geometry.addGroup(outerCount+innerCount,segments*6,0);geometry.userData.hoodRingSegments=segments;
 const rim=positions.slice(0,segments*3),path=new T.CatmullRomCurve3(Array.from({length:segments},(_,j)=>new T.Vector3().fromArray(rim,j*3)),true);
 template={geometry,rim:new T.TubeGeometry(path,192,.005,6,true)};return template;
}

export function addHood(head,origin,outerMaterial,liningMaterial,skinned){
 const shape=hoodTemplate();head.updateWorldMatrix(true,false);const transform=head.matrixWorld.clone().multiply(new T.Matrix4().makeTranslation(0,-origin[1],0));
 const shell=skinned(shape.geometry.clone().applyMatrix4(transform),[outerMaterial,liningMaterial],'FittedFabricHood','hood');shell.userData.hoodNeckY=.74+head.matrixWorld.elements[13]-origin[1];
 skinned(shape.rim.clone().applyMatrix4(transform),outerMaterial,'HoodFaceSeam','hood');
}
