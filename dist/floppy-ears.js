import * as T from './vendor/three.module.js';
export function paddedDogEar(side,s,origin,surface,material){
 const rootX=side*.66,rootY=surface.top(side*.64,.12)-.03,rootZ=.12;
 const g=new T.SphereGeometry(1,24,18),p=g.attributes.position;
 for(let i=0;i<p.count;i++){
  const v=(1-p.getY(i))/2,halfWidth=(.22+.065*Math.sin(Math.PI*v))*s.ears;
  const x=side*(.66+.37*s.ears*Math.sin(Math.PI*v*.73)+p.getX(i)*halfWidth),y=rootY+.025-.82*s.ears*v;
  const center=rootZ+.10*Math.sin(Math.PI*v)+.035*v,thickness=(.17-.025*v)*s.ears;
  p.setXYZ(i,x-rootX,y-rootY,center-rootZ+p.getZ(i)*thickness);
 }
 if(side<0){const indices=g.index.array;for(let i=0;i<indices.length;i+=3)[indices[i+1],indices[i+2]]=[indices[i+2],indices[i+1]];}
 g.computeVertexNormals();const ear=new T.Mesh(g,material);ear.position.set(rootX,rootY-origin[1],rootZ);ear.userData.role='ears';ear.userData.smoothAccessory=true;ear.castShadow=true;return ear;
}
