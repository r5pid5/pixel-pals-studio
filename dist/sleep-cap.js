import * as T from './vendor/three.module.js';
import {wearableMaterial,solidMesh,ball,lineTube,fabricShape,tessellateFace} from './wearable-meshes.js';
const cache=new WeakMap();

export function addSleepCap(head,s,origin,surface){
 const crown=surface.top(0,0),base=crown-origin[1],cap=new T.Group();cap.name='SleepCap';cap.position.y=base;head.add(cap);
 const fabric=wearableMaterial(s,'sleepCapColor'),rim=wearableMaterial(s,null,'#f5eddd');
 if(cache.has(surface)){for(const {geometry,trim,name,position}of cache.get(surface))solidMesh(cap,geometry.clone(),trim?rim:fabric,position,[1,1,1],name).userData.smoothAccessory=true;return;}
 // Cross-sections rotate with the bent cone's centerline. Horizontal rings
 // folded downward invert the tip's faces and cut back through the skull.
 // Tip droops slightly forward, away from the exposed ear roots.
 const controls=[[0,0,0,.51],[0,.14,.015,.43],[.02,.32,.06,.27],[.10,.43,.17,.15],[.22,.44,.29,.09],[.30,.36,.35,.045],[.31,.25,.36,.012]],curve=new T.CatmullRomCurve3(controls.map(v=>new T.Vector3(...v.slice(0,3)))),rows=[];
 for(let i=0;i<=32;i++){const t=i/32,p=curve.getPoint(t),k=Math.min(controls.length-2,Math.floor(t*(controls.length-1))),r=T.MathUtils.lerp(controls[k][3],controls[k+1][3],t*(controls.length-1)-k);rows.push([p.x,p.y,p.z,r]);}
 const segments=48,positions=[],indices=[],vertex=(i,j)=>i*segments+(j+segments)%segments;
 for(let i=0;i<rows.length;i++){
  const [cx,cy,cz,r]=rows[i],axis=curve.getTangent(i/32).normalize(),u=new T.Vector3(axis.y,-axis.x,0).normalize(),v=u.clone().cross(axis).normalize();
  for(let j=0;j<segments;j++){const a=j/segments*Math.PI*2,p=new T.Vector3(cx,cy,cz).addScaledVector(u,Math.cos(a)*r).addScaledVector(v,Math.sin(a)*r*.80),top=surface.top(p.x,p.z);p.y=i===0?(top??crown)-crown+.024:Math.max(p.y,(top??-Infinity)-crown+.024);positions.push(...p.toArray());}
 }
 // Orient each triangle using its radial direction, including the drooping tip.
 for(let i=0;i<rows.length-1;i++)for(let j=0;j<segments;j++){const a=vertex(i,j),b=vertex(i,j+1),c=vertex(i+1,j+1),d=vertex(i+1,j);indices.push(a,c,b,a,d,c);}
 const tip=positions.length/3;positions.push(rows.at(-1)[0],rows.at(-1)[1]-.005,rows.at(-1)[2]);for(let j=0;j<segments;j++)indices.push(vertex(rows.length-1,j),tip,vertex(rows.length-1,j+1));
 // Base closes below the skull surface, hidden by the rolled cloth hem.
 const bottom=positions.length/3;positions.push(0,-.14,0);for(let j=0;j<segments;j++)indices.push(bottom,vertex(0,j),vertex(0,j+1));
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setIndex(indices);geometry.computeVertexNormals();
 solidMesh(cap,geometry,fabric,[0,0,0],[1,1,1],'FloppySleepCap').userData.smoothAccessory=true;
 const edge=[];for(let j=0;j<=segments;j++)edge.push(positions.slice(vertex(0,j)*3,vertex(0,j)*3+3));solidMesh(cap,lineTube(edge,.021,96),rim,[0,0,0],[1,1,1],'SleepCapHem').userData.smoothAccessory=true;
 ball(cap,rim,[rows.at(-1)[0],rows.at(-1)[1]-.035,rows.at(-1)[2]],[.070,.070,.070],'SleepCapPom').userData.smoothAccessory=true;
 // Embroidery is fitted to the cloth rather than a floating flat decal.
 const star=[];for(let j=0;j<10;j++){const a=Math.PI/2+j*Math.PI/5,r=j%2?.022:.045;star.push([.05+Math.cos(a)*r,.13+Math.sin(a)*r]);}
 const raw=fabricShape(star,.004),embroidery=tessellateFace(raw,.014);raw.dispose();const ep=embroidery.attributes.position,triangles=[],gp=geometry.attributes.position;
 for(let j=0;j<indices.length;j+=3){const t=[0,1,2].map(k=>new T.Vector3().fromBufferAttribute(gp,indices[j+k]));if(Math.min(...t.map(p=>p.x))>.10||Math.max(...t.map(p=>p.x))<0||Math.min(...t.map(p=>p.y))>.18||Math.max(...t.map(p=>p.y))<.08)continue;triangles.push(t);}
 const hit=new T.Vector3(),front=new Map();for(let i=0;i<ep.count;i++){const x=ep.getX(i),y=ep.getY(i),key=x+'|'+y;if(!front.has(key)){const ray=new T.Ray(new T.Vector3(x,y,2),new T.Vector3(0,0,-1));let z=-Infinity;for(const tri of triangles)if(ray.intersectTriangle(...tri,false,hit))z=Math.max(z,hit.z);front.set(key,Number.isFinite(z)?z:.25);}ep.setXYZ(i,x,y,front.get(key)+.004+ep.getZ(i));}embroidery.computeVertexNormals();solidMesh(cap,embroidery,rim,[0,0,0],[1,1,1],'SleepCapEmbroidery').userData.smoothAccessory=true;
 cache.set(surface,cap.children.map(m=>({geometry:m.geometry.clone(),trim:m.material===rim,name:m.name,position:m.position.toArray()})));
}
