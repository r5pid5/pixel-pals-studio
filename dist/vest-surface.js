import * as T from './vendor/three.module.js';
const cache=new Map();
const copy=value=>({...value,geometries:value.geometries.map(g=>g.clone())});

// A cloth shell with open armholes; it has no cut walls inside the shirt.
export function vestSurface(s){
 const cacheKey=[s.body,s.legs].join('|');if(cache.has(cacheKey)){const value=cache.get(cacheKey);cache.delete(cacheKey);cache.set(cacheKey,value);return copy(value);}
 const shift=(1.54/5.2)*(s.legs-1),hem=.255,top=.925,profile=[[.287,hem],[.354,.34],[.353,.46],[.323,.67],[.266,.838],[.183,.917],[.158,.945]];
 const slopes=profile.slice(1).map((p,i)=>(p[0]-profile[i][0])/(p[1]-profile[i][1])),tangents=profile.map((_,i)=>i===0?0:i===profile.length-1?slopes.at(-1):slopes[i-1]*slopes[i]<=0?0:2/(1/slopes[i-1]+1/slopes[i]));
 const radiusAt=y=>{let i=1;while(i<profile.length-1&&y>profile[i][1])i++;const[a,ya]=profile[i-1],[b,yb]=profile[i],h=yb-ya,u=T.MathUtils.clamp((y-ya)/h,0,1);return(2*u**3-3*u*u+1)*a+(u**3-2*u*u+u)*h*tangents[i-1]+(-2*u**3+3*u*u)*b+(u**3-u*u)*h*tangents[i];};
 const vertex=(angle,y)=>{const r=radiusAt(y);return new T.Vector3(Math.sin(angle)*r*s.body,y+shift,Math.cos(angle)*r*.79);};
 const positions=[],normals=[],triangles=[],angular=160,rows=70;
 const clip=(poly,fn)=>{const out=[];for(let i=0;i<poly.length;i++){const p=poly[i],q=poly[(i+1)%poly.length],d=fn(p),e=fn(q);if(d<=0)out.push(p);if((d<=0)!==(e<=0)){let low=0,high=1;for(let j=0;j<24;j++){const mid=(low+high)/2,value=fn(p.clone().lerp(q,mid));if((value<=0)===(d<=0))low=mid;else high=mid;}out.push(p.clone().lerp(q,(low+high)/2));}}return out;};
 const angle=p=>Math.atan2(p.x/s.body,p.z/.79),hole=(p,center)=>{const delta=Math.atan2(Math.sin(angle(p)-center),Math.cos(angle(p)-center));return 1-(delta/.62)**2-((p.y-shift-.725)/.165)**2;};
 const normal=p=>{const y=p.y-shift,e=.001,dr=(radiusAt(y+e)-radiusAt(y-e))/(2*e),theta=angle(p);return new T.Vector3(Math.sin(theta)/s.body,-dr,Math.cos(theta)/.79).normalize();};
 function emit(a,b,c){const face=b.clone().sub(a).cross(c.clone().sub(a));if(face.lengthSq()<1e-15)return;if(face.dot(normal(a.clone().add(b).add(c).multiplyScalar(1/3)))<0)[b,c]=[c,b];triangles.push([a,b,c]);for(const p of[a,b,c]){positions.push(...p.toArray());normals.push(...normal(p).toArray());}}
 function cut(a,b,c){let polygon=clip(clip([a,b,c],p=>hole(p,Math.PI/2)),p=>hole(p,-Math.PI/2));const middle=a.clone().add(b).add(c).multiplyScalar(1/3);if(middle.z>0){const width=p=>Math.max(0,(p.y-shift-.752)*.90);for(const side of[-1,1]){const panel=clip(polygon,p=>width(p)-side*p.x);for(let i=1;i<panel.length-1;i++)emit(panel[0],panel[i],panel[i+1]);}}else{polygon=clip(polygon,p=>p.y-shift-.891-Math.abs(p.x)*.30);for(let i=1;i<polygon.length-1;i++)emit(polygon[0],polygon[i],polygon[i+1]);}}
 for(let j=0;j<rows;j++)for(let i=0;i<angular;i++){const theta=i/angular*Math.PI*2,next=(i+1)/angular*Math.PI*2,y=hem+(top-hem)*j/rows,yn=hem+(top-hem)*(j+1)/rows,a=vertex(theta,y),b=vertex(next,y),c=vertex(next,yn),d=vertex(theta,yn);cut(a,b,c);cut(a,c,d);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('normal',new T.Float32BufferAttribute(normals,3));
 const grid=new Map(),cell=.025,key=(x,y)=>Math.floor(x/cell)+':'+Math.floor(y/cell);for(const t of triangles){if(Math.max(...t.map(p=>p.z))<0)continue;for(let x=Math.floor(Math.min(...t.map(p=>p.x))/cell);x<=Math.floor(Math.max(...t.map(p=>p.x))/cell);x++)for(let y=Math.floor(Math.min(...t.map(p=>p.y))/cell);y<=Math.floor(Math.max(...t.map(p=>p.y))/cell);y++){const k=x+':'+y;if(!grid.has(k))grid.set(k,[]);grid.get(k).push(t);}}
 const front=(x,y)=>{let maximum=null;for(const[a,b,c]of grid.get(key(x,y))??[]){const denominator=(b.y-c.y)*(a.x-c.x)+(c.x-b.x)*(a.y-c.y);if(Math.abs(denominator)<1e-12)continue;const u=((b.y-c.y)*(x-c.x)+(c.x-b.x)*(y-c.y))/denominator,v=((c.y-a.y)*(x-c.x)+(a.x-c.x)*(y-c.y))/denominator,w=1-u-v;if(Math.min(u,v,w)<-1e-6)continue;const z=u*a.z+v*b.z+w*c.z;if(maximum===null||z>maximum)maximum=z;}return maximum;};
 const result={geometries:[g],front,radiusAt,arms:[]};cache.set(cacheKey,copy(result));if(cache.size>12){const key=cache.keys().next().value;cache.get(key).geometries[0].dispose();cache.delete(key);}return result;
}
