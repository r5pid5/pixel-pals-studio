import * as T from './vendor/three.module.js';

// Place sewn details on the actual bib/waist triangles, including below the
// inner shirt's hem. Projecting there onto the shirt would hide the pocket.
export function trouserFront(geometry){
 const p=geometry.attributes.position,index=geometry.index,grid=new Map(),cell=.025,key=(x,y)=>Math.floor(x/cell)+':'+Math.floor(y/cell),count=index?.count??p.count;
 for(let i=0;i<count;i+=3){const triangle=[0,1,2].map(j=>new T.Vector3().fromBufferAttribute(p,index?index.getX(i+j):i+j));if(Math.max(...triangle.map(v=>v.z))<0)continue;
  for(let x=Math.floor(Math.min(...triangle.map(v=>v.x))/cell);x<=Math.floor(Math.max(...triangle.map(v=>v.x))/cell);x++)for(let y=Math.floor(Math.min(...triangle.map(v=>v.y))/cell);y<=Math.floor(Math.max(...triangle.map(v=>v.y))/cell);y++){const k=x+':'+y;if(!grid.has(k))grid.set(k,[]);grid.get(k).push(triangle);}
 }
 return(x,y)=>{let result=null;for(const[a,b,c]of grid.get(key(x,y))??[]){const denominator=(b.y-c.y)*(a.x-c.x)+(c.x-b.x)*(a.y-c.y);if(Math.abs(denominator)<1e-12)continue;const u=((b.y-c.y)*(x-c.x)+(c.x-b.x)*(y-c.y))/denominator,v=((c.y-a.y)*(x-c.x)+(a.x-c.x)*(y-c.y))/denominator,w=1-u-v;if(Math.min(u,v,w)<-1e-6)continue;const z=u*a.z+v*b.z+w*c.z;result=result===null?z:Math.max(result,z);}return result;};
}

// Two leg tubes join along the same curved crotch seam. Their outer top edges
// form one waist opening, rather than two disconnected cylinders at the hips.
export function trouserSurface(s,kind,waistRadius,radiusAt){
 const shift=(1.54/5.2)*(s.legs-1),top=(kind==='overalls'?.455:.47)+shift,bottom=(kind==='uniform'?.165:.080)*s.legs,crotch=.195*s.legs;
 const waistX=waistRadius*s.body,waistZ=waistRadius*.79,segments=48,rows=18;
 const positions=[],hipWeights=[],chestWeights=[],legSides=[],indices=[],vertices=new Map();
 function storeVertex(point,hips,side){
  const key=point.map(v=>Math.round(v*1e7)).join('|');if(vertices.has(key))return vertices.get(key);
  const index=positions.length/3;vertices.set(key,index);positions.push(...point);
  hipWeights.push(hips);chestWeights.push(hips*T.MathUtils.smoothstep(point[1]-shift,.33,.72));legSides.push(side);return index;
 }
 function vertex(side,row,column){
  const t=row/rows,angle=column/segments*Math.PI*2,sine=Math.sin(angle),cosine=Math.cos(angle);
  const inner=Math.max(0,-sine),topY=top-(top-crotch)*inner;
  const cuffX=Math.max(.001,.147+.151*sine),x=side*T.MathUtils.lerp(cuffX,waistX*Math.max(0,sine),t);
  const y=T.MathUtils.lerp(bottom,topY,t),z=T.MathUtils.lerp(.012+.151*.94*cosine,waistZ*cosine,t);
  return storeVertex([x,y,z],T.MathUtils.smoothstep(t,.48,.94),row===rows&&inner>0?0:side);
 }
 for(const side of[1,-1]){
  const grid=Array.from({length:rows+1},(_,row)=>Array.from({length:segments+1},(_,col)=>vertex(side,row,col)));
  for(let row=0;row<rows;row++)for(let col=0;col<segments;col++){
   const a=grid[row][col],b=grid[row][col+1],c=grid[row+1][col+1],d=grid[row+1][col];
   indices.push(...(side===1?[a,b,c,a,c,d]:[a,c,b,a,d,c]));
  }
  if(kind==='overalls'){
   // Continue the same waist vertices into the front/back bib. No projected
   // lower bib patch, floating waistband or overlapping bottom edge remains.
   const height=angle=>{
    const front=Math.cos(angle)>=0,cap=front?.78:.77;
    const width=y=>y>=.49?T.MathUtils.lerp(.20,front?.16:.13,(y-.49)/(cap-.49)):T.MathUtils.lerp(.21,.20,(y-.455)/.035);
    const fits=y=>(radiusAt(y)+.013)*Math.sin(angle)<=width(y);
    if(!fits(.455))return .455;if(fits(cap))return cap;
    let low=.455,high=cap;for(let i=0;i<24;i++){const mid=(low+high)/2;if(fits(mid))low=mid;else high=mid;}return(low+high)/2;
   };
   const panel=Array.from({length:17},(_,row)=>Array.from({length:segments/2+1},(_,col)=>{
    if(row===0)return grid[rows][col];const angle=col/segments*Math.PI*2,y=T.MathUtils.lerp(.455,height(angle),row/16),r=radiusAt(y)+.013;
    return storeVertex([side*r*s.body*Math.sin(angle),y+shift,r*.79*Math.cos(angle)],1,side);
   }));
   for(let row=0;row<16;row++)for(let col=0;col<segments/2;col++){
    const a=panel[row][col],b=panel[row][col+1],c=panel[row+1][col+1],d=panel[row+1][col];
    for(const tri of(side===1?[[a,b,c],[a,c,d]]:[[a,c,b],[a,d,c]]))if(new Set(tri).size===3)indices.push(...tri);
   }
  }
 }
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setIndex(indices);geometry.computeVertexNormals();
 geometry.setAttribute('waistWeight',new T.Float32BufferAttribute(hipWeights,1));geometry.setAttribute('legSide',new T.Float32BufferAttribute(legSides,1));
 geometry.setAttribute('chestWeight',new T.Float32BufferAttribute(chestWeights,1));
 geometry.userData.trouserWaistY=top;geometry.userData.trouserCuffY=bottom;
 if(kind!=='prison')return geometry;

 // Cut the same sewn surface into stripe materials, keeping the seam, normals
 // and skin weights. Separate floating cylinders would intersect the trousers.
 const names=['position','normal','waistWeight','legSide','chestWeight'],sizes=[3,3,1,1,1],stride=9,arrays=[[],[]],normal=new T.Vector3();
 const levels=[-Infinity,.114*s.legs,.156*s.legs,.214*s.legs,.256*s.legs,Infinity];
 const interpolate=(a,b,t)=>a.map((v,i)=>T.MathUtils.lerp(v,b[i],t));
 const equal=(a,b)=>a.slice(0,3).every((value,i)=>Math.abs(value-b[i])<1e-9);
 const clip=(polygon,y,above)=>{const out=[],push=p=>{if(!out.length||!equal(out.at(-1),p))out.push(p);};for(let i=0;i<polygon.length;i++){const a=polygon[i],b=polygon[(i+1)%polygon.length],da=above?y-a[1]:a[1]-y,db=above?y-b[1]:b[1]-y;if(da<=0)push(a);if((da<=0)!==(db<=0))push(interpolate(a,b,da/(da-db)));}if(out.length>1&&equal(out[0],out.at(-1)))out.pop();return out;};
 for(let i=0;i<indices.length;i+=3){const triangle=indices.slice(i,i+3).map(index=>{const vertex=names.flatMap(name=>Array.from({length:geometry.attributes[name].itemSize},(_,j)=>geometry.attributes[name].array[index*geometry.attributes[name].itemSize+j]));for(const y of levels)if(Math.abs(vertex[1]-y)<1e-6){vertex[1]=y;break;}return vertex;});
  for(let band=0;band<levels.length-1;band++){const polygon=clip(clip(triangle,levels[band],true),levels[band+1],false);for(let j=1;j<polygon.length-1;j++){const tri=[polygon[0],polygon[j],polygon[j+1]],a=new T.Vector3().fromArray(tri[0]),b=new T.Vector3().fromArray(tri[1]),c=new T.Vector3().fromArray(tri[2]);if(b.sub(a).cross(c.sub(a)).lengthSq()<1e-30)continue;for(const vertex of tri){normal.fromArray(vertex,3).normalize();arrays[band%2].push(...vertex.slice(0,3),...normal.toArray(),...vertex.slice(6));}}}
 }
 const striped=new T.BufferGeometry(),values=arrays.flat();let start=0;for(let k=0;k<names.length;k++){const data=[];for(let i=0;i<values.length;i+=stride)data.push(...values.slice(i+start,i+start+sizes[k]));striped.setAttribute(names[k],new T.Float32BufferAttribute(data,sizes[k]));start+=sizes[k];}
 striped.addGroup(0,arrays[0].length/stride,0);striped.addGroup(arrays[0].length/stride,arrays[1].length/stride,1);striped.userData={...geometry.userData};geometry.dispose();return striped;
}
