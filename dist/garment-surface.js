import * as T from './vendor/three.module.js';
import {handBindX} from './garment-fit.js';
const cache=new Map(),cacheLimit=24;
const copy=value=>({...value,geometries:value.geometries.map(g=>g.clone()),sleeves:value.sleeves.map(s=>({...s,geometry:s.geometry.clone()}))});

// The torso and full sleeve shells overlap inside the shoulder. Keeping the
// inner sleeve surface prevents a resting arm fused to the torso from tearing
// a triangle-shaped patch out of the body when raised. Cuffs stay open.
export function garmentSurface(s,kind,hem){
 const cacheKey=[kind,s.body,s.legs,hem].join('|');
 if(cache.has(cacheKey)){const value=cache.get(cacheKey);cache.delete(cacheKey);cache.set(cacheKey,value);return copy(value);}
 const shift=(1.54/5.2)*(s.legs-1),short=['tee','raglan','uniform','overalls','sailor','apron'].includes(kind),long=['coat','raincoat'].includes(kind);
 const ease={tee:.016,raglan:.019,hoodie:.044,hoodieUp:.044,pajamas:.028,spacesuit:.046,suit:.034,coat:.062,uniform:.018,schoolVest:.047,dressShirt:.012,prison:.028,sweater:.040,cardigan:.033,overalls:.018,raincoat:.055,puffer:.070,sailor:.025,apron:.018,varsity:.047}[kind]??.02;
 const ribbed=['hoodie','hoodieUp','sweater','varsity'].includes(kind);
 const profile=[[long?.39:.19+ease,Math.min(hem,.235)],[long?.376:.254+ease*(ribbed?.65:1),.25],[long?.353:.310+ease,.34],[long?.348:.306+ease,.46],[long?.319:.275+ease,.67],[long?.277:.215+ease,.838],[.15+ease*.7,.917],[.115+ease*.7,.945]];
 const slopes=profile.slice(1).map((p,i)=>(p[0]-profile[i][0])/(p[1]-profile[i][1])),tangents=profile.map((_,i)=>i===0?0:i===profile.length-1?slopes.at(-1):slopes[i-1]*slopes[i]<=0?0:2/(1/slopes[i-1]+1/slopes[i]));
 const radiusAt=y=>{y-=shift;if(y<=profile[0][1])return profile[0][0];for(let i=1;i<profile.length;i++){const[a,ya]=profile[i-1],[b,yb]=profile[i];if(y<=yb){const h=yb-ya,t=(y-ya)/h,r=(2*t**3-3*t*t+1)*a+(t**3-2*t*t+t)*h*tangents[i-1]+(-2*t**3+3*t*t)*b+(t**3-t*t)*h*tangents[i],fade=T.MathUtils.smoothstep(y,.29,.32)*(1-T.MathUtils.smoothstep(y,.80,.85));return r+(kind==='puffer'?.010*(1-Math.cos((y-.29)/.16*Math.PI*2))*fade:0);}}return profile.at(-1)[0];};
 const arms=['schoolVest','dressShirt'].includes(kind)?[]:[1,-1].map(side=>{const start=new T.Vector3(side*.20*s.body,.79+shift,0),end=new T.Vector3(side*handBindX(s),.494+shift,.03),axis=end.clone().sub(start),length=axis.length();return{side,start,axis:axis.normalize(),end:(short?.47:1.02)*length,radius:.089+ease*.65};});
 function sample(x,y,z){
  const torso=Math.sqrt((x/s.body)**2+(z/.79)**2)-radiusAt(y);
  let d=Math.max(torso,y-.945-shift),part=0;
  if(y>.855+shift)d=Math.max(d,.104*s.body-Math.sqrt(x*x+(z/.79)**2));
  if(kind==='schoolVest'){
   for(const side of[-1,1])d=Math.max(d,.071-Math.hypot((x-side*.31*s.body),y-.755-shift));
  }
  return{d,part};
 }
 const faceGrid=new Map(),cell=.025,key=(x,y)=>Math.floor(x/cell)+':'+Math.floor(y/cell);
 function front(x,y){let z=null;for(const t of faceGrid.get(key(x,y))??[]){const[a,b,c]=t,den=(b.y-c.y)*(a.x-c.x)+(c.x-b.x)*(a.y-c.y);if(Math.abs(den)<1e-10)continue;const u=((b.y-c.y)*(x-c.x)+(c.x-b.x)*(y-c.y))/den,v=((c.y-a.y)*(x-c.x)+(a.x-c.x)*(y-c.y))/den,w=1-u-v;if(Math.min(u,v,w)<-1e-6)continue;const hit=u*a.z+v*b.z+w*c.z;if(z===null||hit>z)z=hit;}return z;}
 const positions=Array.from({length:kind==='prison'?4:3},()=>[]),normals=positions.map(()=>[]),bounds=[[-.62*s.body,.62*s.body],[hem+shift-.028,.98+shift],[-.37,.37]],step=.029;
 const sizes=bounds.map(([a,b])=>Math.ceil((b-a)/step)),coords=bounds.map(([a,b],i)=>Array.from({length:sizes[i]+1},(_,j)=>a+(b-a)*j/sizes[i]));
 const nx=sizes[0]+1,ny=sizes[1]+1,nz=sizes[2]+1,values=new Float32Array(nx*ny*nz),idx=(x,y,z)=>(x*ny+y)*nz+z;
 for(let x=0;x<nx;x++)for(let y=0;y<ny;y++)for(let z=0;z<nz;z++)values[idx(x,y,z)]=sample(coords[0][x],coords[1][y],coords[2][z]).d;
 const corners=[[0,0,0],[1,0,0],[1,1,0],[0,1,0],[0,0,1],[1,0,1],[1,1,1],[0,1,1]],tetra=[[0,5,1,6],[0,1,2,6],[0,2,3,6],[0,3,7,6],[0,7,4,6],[0,4,5,6]];
 const gradient=p=>{const e=.0015;return new T.Vector3(sample(p.x+e,p.y,p.z).d-sample(p.x-e,p.y,p.z).d,sample(p.x,p.y+e,p.z).d-sample(p.x,p.y-e,p.z).d,sample(p.x,p.y,p.z+e).d-sample(p.x,p.y,p.z-e).d).normalize();};
 function triangle(a,b,c){
  const center=a.clone().add(b).add(c).multiplyScalar(1/3),part=sample(...center.toArray()).part;
  if([a,b,c].every(p=>Math.abs(p.y-hem-shift)<.00005))return;
  const normal=gradient(center),face=b.clone().sub(a).cross(c.clone().sub(a));if(face.dot(normal)<0)[b,c]=[c,b];
  const emit=(a,b,c,region)=>{if(b.clone().sub(a).cross(c.clone().sub(a)).lengthSq()<1e-15)return;for(const p of[a,b,c]){positions[region].push(...p.toArray());normals[region].push(...gradient(p).toArray());}if(Math.max(a.z,b.z,c.z)>0){for(let x=Math.floor(Math.min(a.x,b.x,c.x)/cell);x<=Math.floor(Math.max(a.x,b.x,c.x)/cell);x++)for(let y=Math.floor(Math.min(a.y,b.y,c.y)/cell);y<=Math.floor(Math.max(a.y,b.y,c.y)/cell);y++){const k=x+':'+y;if(!faceGrid.has(k))faceGrid.set(k,[]);faceGrid.get(k).push([a,b,c]);}}};
  const clip=(poly,fn)=>{const out=[];for(let i=0;i<poly.length;i++){const p=poly[i],q=poly[(i+1)%poly.length],d=fn(p),e=fn(q);if(d<=0)out.push(p);if((d<=0)!==(e<=0))out.push(p.clone().lerp(q,d/(d-e)));}return out;};
  const aboveHem=clip([a,b,c],p=>hem+shift-p.y);
  const opened=['suit','coat','cardigan','schoolVest'].includes(kind)&&center.z>0;
  const opening=p=>kind==='cardigan'?.039:kind==='schoolVest'?Math.max(0,(p.y-shift-.752)*.90):Math.max(0,(p.y-shift-.56)*.40);
  const panels=opened?[clip(aboveHem,p=>opening(p)-p.x),clip(aboveHem,p=>opening(p)+p.x)]:[aboveHem];
  for(const panel of panels)if(kind==='prison'){
   const levels=[hem-1,.30,.358,.465,.523,.634,.693,.79,.845,1.95].map(y=>y+shift);for(let i=0;i<levels.length-1;i++){const poly=clip(clip(panel,p=>levels[i]-p.y),p=>p.y-levels[i+1]),region=i%2?3:part;for(let j=1;j<poly.length-1;j++)emit(poly[0],poly[j],poly[j+1],region);}
  }else if(kind==='raglan'){
   const cut=p=>.10+(.945+shift-p.y)*.45,left=p=>p.x/s.body-cut(p),right=p=>-p.x/s.body-cut(p);
   for(const[poly,region]of[[clip(clip(panel,left),right),0],[clip(panel,p=>-left(p)),1],[clip(panel,p=>-right(p)),2]])for(let i=1;i<poly.length-1;i++)emit(poly[0],poly[i],poly[i+1],region);
  }else for(let i=1;i<panel.length-1;i++)emit(panel[0],panel[i],panel[i+1],part);
 }
 for(let x=0;x<sizes[0];x++)for(let y=0;y<sizes[1];y++)for(let z=0;z<sizes[2];z++){
  const v=corners.map(([dx,dy,dz])=>({p:new T.Vector3(coords[0][x+dx],coords[1][y+dy],coords[2][z+dz]),d:values[idx(x+dx,y+dy,z+dz)]}));if(v.every(p=>p.d>=0)||v.every(p=>p.d<0))continue;
  for(const ids of tetra){const inside=ids.filter(i=>v[i].d<0),outside=ids.filter(i=>v[i].d>=0);if(!inside.length||!outside.length)continue;
   const at=(a,b)=>v[a].p.clone().lerp(v[b].p,v[a].d/(v[a].d-v[b].d));
   if(inside.length===1)triangle(...outside.map(j=>at(inside[0],j)));
   else if(inside.length===3)triangle(...inside.map(j=>at(j,outside[0])));
   else{const[a,b]=inside,[c,d]=outside,p=at(a,c),q=at(a,d),r=at(b,c),u=at(b,d);triangle(p,q,r);triangle(q,u,r);}
  }
 }
 const geometries=positions.map((p,i)=>{const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('normal',new T.Float32BufferAttribute(normals[i],3));return g;});
 const sleeves=arms.map(arm=>{
  const radius=t=>short?arm.radius:T.MathUtils.lerp(arm.radius,.098,T.MathUtils.smoothstep(t,arm.end-.075,arm.end));
  const profile=[[0,-.065],[arm.radius*.7,-.045],[arm.radius,-.015],[arm.radius,0]];
  for(let i=1;i<=20;i++){const t=arm.end*i/20;profile.push([radius(t),t]);}
  let geometry=new T.LatheGeometry(profile.map(([r,t])=>new T.Vector2(r,t)),32);
  geometry.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),arm.axis));geometry.translate(...arm.start.toArray());
  if(kind==='prison'){
   const original=geometry,source=geometry.toNonIndexed(),p=source.attributes.position,n=source.attributes.normal,bands=[[],[]],bandNormals=[[],[]],levels=[hem-1,.30,.358,.465,.523,.634,.693,.79,.845,1.95].map(y=>y+shift);
   const clip=(poly,fn)=>{const out=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],d=fn(a.p),e=fn(b.p);if(d<=0)out.push(a);if((d<=0)!==(e<=0)){const t=d/(d-e);out.push({p:a.p.clone().lerp(b.p,t),n:a.n.clone().lerp(b.n,t).normalize()});}}return out;};
   for(let i=0;i<p.count;i+=3){const tri=[0,1,2].map(j=>({p:new T.Vector3().fromBufferAttribute(p,i+j),n:new T.Vector3().fromBufferAttribute(n,i+j)}));for(let b=0;b<levels.length-1;b++){const poly=clip(clip(tri,p=>levels[b]-p.y),p=>p.y-levels[b+1]),material=b%2;for(let j=1;j<poly.length-1;j++)for(const v of[poly[0],poly[j],poly[j+1]]){bands[material].push(...v.p.toArray());bandNormals[material].push(...v.n.toArray());}}}
   geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(bands.flat(),3));geometry.setAttribute('normal',new T.Float32BufferAttribute(bandNormals.flat(),3));geometry.addGroup(0,bands[0].length/3,0);geometry.addGroup(bands[0].length/3,bands[1].length/3,1);original.dispose();source.dispose();
  }
  return{geometry,side:arm.side};
 });
 function skin(p){
  const a=T.MathUtils.smoothstep(p.y-shift,.33,.72);return[[2,1-a],[3,a]];
 }
 const result={geometries,sleeves,front,radiusAt:y=>radiusAt(y+shift),arms,skin};cache.set(cacheKey,copy(result));
 if(cache.size>cacheLimit){const key=cache.keys().next().value,value=cache.get(key);for(const g of [...value.geometries,...value.sleeves.map(s=>s.geometry)])g.dispose();cache.delete(key);}
 return result;
}
