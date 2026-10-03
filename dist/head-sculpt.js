import * as T from './vendor/three.module.js';
import {sourceModel} from './source-base.js';
import {headTexture} from './head-texture.js';

const headCache=new Map();
function headMaterial(s){return new T.MeshStandardMaterial({map:headTexture(s),roughness:.95,flatShading:s.filter==='lowpoly'});}
// Rounded skull with closed cone ears seated into its curved crown.
// Every surface is closed before vertices are duplicated at texture seams.
export function characterHead(s,origin,shift=0){
 const cacheKey=[['cat','fox','wolf'].includes(s.species)?s.species:'round',s.detail,s.ears,shift].join('|');if(headCache.has(cacheKey)){const cached=headCache.get(cacheKey);headCache.delete(cacheKey);headCache.set(cacheKey,cached);return{geometry:cached.geometry.clone(),surface:cached.surface,material:headMaterial(s)};}
 const source=sourceModel.parts[5];let points=[];const faces=[],lookup=new Map();
 for(let i=0;i<source.positions.length;i+=9){const f=[];for(let j=0;j<3;j++){
  const p=source.positions.slice(i+j*3,i+j*3+3).map(v=>v/5.2),key=p.map(v=>v.toFixed(6)).join(',');
  if(!lookup.has(key)){lookup.set(key,points.length);points.push(p);}f.push(lookup.get(key));
 }faces.push(f);}
 // Broader crown and a gently tapered chin keep the outline compact.
 points=points.map(([x,y,z])=>{const yy=.765+(y-.748)*1.18,t=T.MathUtils.clamp((yy-1.40)/.70,0,1);return[x*(1-.12*t*t),yy,z*.96];});
 const pointed=['cat','fox','wolf'].includes(s.species);
 let joined=faces;
 const levels=s.detail==='verylow'?0:s.detail==='low'?1:2;
 for(let level=0;level<levels;level++){
  const edges=new Map(),neighbors=points.map(()=>new Set());
  for(const f of joined)for(let j=0;j<3;j++){
   const a=f[j],b=f[(j+1)%3],opp=f[(j+2)%3],key=[a,b].sort((a,b)=>a-b).join(',');
   if(!edges.has(key))edges.set(key,{a,b,opposites:[]});edges.get(key).opposites.push(opp);neighbors[a].add(b);neighbors[b].add(a);
  }
  const next=points.map((p,i)=>{const ring=[...neighbors[i]],beta=ring.length===3?3/16:3/(8*ring.length);return p.map((v,k)=>T.MathUtils.lerp(v,(1-ring.length*beta)*v+beta*ring.reduce((n,j)=>n+points[j][k],0),.55));});
  for(const e of edges.values()){e.index=next.length;const a=points[e.a],b=points[e.b];next.push(a.map((v,k)=>e.opposites.length===2?.375*(v+b[k])+.125*(points[e.opposites[0]][k]+points[e.opposites[1]][k]):(v+b[k])/2));}
  const edge=(a,b)=>edges.get([a,b].sort((a,b)=>a-b).join(',')).index;
  const nextFaces=[];for(const[a,b,c]of joined){const ab=edge(a,b),bc=edge(b,c),ca=edge(c,a);nextFaces.push([a,ab,ca],[b,bc,ab],[c,ca,bc],[ab,bc,ca]);}points=next;joined=nextFaces;
 }
 const skullSurface=joined.map(f=>f.map(i=>new T.Vector3(...points[i]))),intersection=new T.Vector3();
 const sample=(ray,axis)=>{let height=-Infinity;for(const tri of skullSurface)if(ray.intersectTriangle(...tri,false,intersection))height=Math.max(height,intersection[axis]);return Number.isFinite(height)?height:null;};
 // Exact, bounded memoization of the immutable skull for repeated outfit builds.
 const memo=fn=>{const values=new Map();return(a,b)=>{const key=a+'|'+b;if(values.has(key))return values.get(key);const value=fn(a,b);if(values.size>=8192)values.delete(values.keys().next().value);values.set(key,value);return value;};};
 const surface={top:memo((x,z)=>sample(new T.Ray(new T.Vector3(x,4,z),new T.Vector3(0,-1,0)),'y')),front:memo((x,y)=>sample(new T.Ray(new T.Vector3(x,y,3),new T.Vector3(0,0,-1)),'z')),radial:memo((y,angle)=>{const direction=new T.Vector3(Math.cos(angle),0,Math.sin(angle)),ray=new T.Ray(new T.Vector3(direction.x*3,y,direction.z*3),direction.clone().negate());let radius=-Infinity;for(const tri of skullSurface)if(ray.intersectTriangle(...tri,false,intersection))radius=Math.max(radius,intersection.dot(direction));return Number.isFinite(radius)?radius:null;})};
 const earFaces=new Set(),capFaces=new Set();
 surface.ray=(start,direction)=>{const ray=new T.Ray(new T.Vector3(...start),new T.Vector3(...direction).normalize());let nearest=Infinity,result=null;for(const tri of skullSurface)if(ray.intersectTriangle(...tri,false,intersection)){const distance=intersection.distanceTo(ray.origin);if(distance<nearest){nearest=distance;result=intersection.toArray();}}return result;};
 if(pointed){
  const skull=joined.map(f=>f.map(i=>new T.Vector3(...points[i]))),hit=new T.Vector3();
  const surfaceAt=(x,z)=>{const ray=new T.Ray(new T.Vector3(x,3.5,z),new T.Vector3(0,-1,0));let y=-Infinity;for(const tri of skull)if(ray.intersectTriangle(...tri,false,hit))y=Math.max(y,hit.y);if(!Number.isFinite(y))throw new Error('Ear root lies outside the skull.');return y;};
  const segments=s.detail==='verylow'?8:s.detail==='low'?12:20;
  for(const side of[-1,1]){
   const fox=s.species==='fox',wolf=s.species==='wolf',cx=side*(fox?.49:wolf?.51:.54),cz=-.10,peak=[side*(fox?.83:wolf?.61:.69),2.10+s.ears*(fox?.94:wolf?.31:.60),-.06];
   const root=[],rim=[];
   for(let j=0;j<segments;j++){
    const theta=j/segments*Math.PI*2,x=cx+Math.cos(theta)*(fox?.32:wolf?.30:.28),z=cz+Math.sin(theta)*(wolf?.24:.20);
    const p=[x,surfaceAt(x,z)-.018,z];root.push(points.length);points.push(p);
    rim.push(points.length);points.push(p.map((v,k)=>v*.46+peak[k]*.54));
   }
   const tip=points.length;points.push(peak);const center=points.length;points.push([cx,surfaceAt(cx,cz)-.05,cz]);
   for(let j=0;j<segments;j++){
    const k=(j+1)%segments;
    for(const f of[[root[j],rim[k],root[k]],[root[j],rim[j],rim[k]],[rim[j],tip,rim[k]]]){joined.push(f);earFaces.add(f);}
    const cap=[root[j],root[k],center];joined.push(cap);capFaces.add(cap);
   }
  }
 }
 const earSurface=[...earFaces].map(f=>f.map(i=>new T.Vector3(...points[i])));
 surface.earFront=(x,y)=>{const ray=new T.Ray(new T.Vector3(x,y,3),new T.Vector3(0,0,-1));let z=-Infinity;for(const tri of earSurface)if(ray.intersectTriangle(...tri,false,intersection))z=Math.max(z,intersection.z);return Number.isFinite(z)?z:null;};
 const normalMap=new Map(),keys=points.map(p=>p.map(x=>x.toFixed(5)).join(','));const keyFor=(i,f)=>keys[i]+(earFaces.has(f)?':ear':capFaces.has(f)?':cap':':head');for(const f of joined){const[a,b,c]=f.map(i=>new T.Vector3(...points[i])),normal=b.sub(a).cross(c.sub(a));for(const i of f){const key=keyFor(i,f);if(!normalMap.has(key))normalMap.set(key,new T.Vector3());normalMap.get(key).add(normal);}}normalMap.forEach(n=>n.normalize());
 const positions=[],normals=[],uvs=[],bi=[],bw=[];for(const f of joined){const front=f.reduce((n,i)=>n+points[i][2],0)>0;for(const i of f){const p=points[i];positions.push(p[0],p[1]+shift,p[2]);normals.push(...normalMap.get(keyFor(i,f)).toArray());uvs.push(...(earFaces.has(f)||capFaces.has(f)?[.985,.015]:front?[(p[0]+1)/2,(p[1]-.6)/2]:[(p[0]+1)/2,.985]));bi.push(5,0,0,0);bw.push(1,0,0,0);}}
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('normal',new T.Float32BufferAttribute(normals,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));geometry.setAttribute('skinIndex',new T.Uint16BufferAttribute(bi,4));geometry.setAttribute('skinWeight',new T.Float32BufferAttribute(bw,4));
 headCache.set(cacheKey,{geometry:geometry.clone(),surface});if(headCache.size>12){const first=headCache.keys().next().value;headCache.get(first).geometry.dispose();headCache.delete(first);}return{geometry,material:headMaterial(s),surface};
}
