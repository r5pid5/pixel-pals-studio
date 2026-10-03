import * as T from './vendor/three.module.js';
import {handBindX,armWeights} from './garment-fit.js';

// Rounded torso, short feet and continuous rounded arms. All positions are in the
// provided rig's bind coordinates, so imported motions and exports keep it.
export function bodyGeometry(key,s){
 const seg=s.detail==='verylow'?8:s.detail==='low'?14:24;
 const shift=(1.54/5.2)*(s.legs-1),geometries=[];
 let skin;
 const lathe=profile=>new T.LatheGeometry(profile.map(([r,y])=>new T.Vector2(r,y)),seg);
 if(key===3){
  const g=lathe([[0,.225],[.17,.225],[.254,.246],[.297,.284],[.310,.344],[.306,.46],[.275,.67],[.215,.838],[.15,.917],[0,.917]]);
  g.scale(s.body,1,.79);g.translate(0,shift,0);geometries.push(g);
  skin=p=>{const a=T.MathUtils.smoothstep(p.y-shift,.33,.72);return[[2,1-a],[3,a]];};
 }else if(key===12||key===15){
  const side=key===12?1:-1,leg=side===1?14:17;
  const g=lathe([[0,.009],[.087,.009],[.122,.023],[.14,.064],[.145,.16],[.143,.267],[.129,.334],[0,.34]]);
  g.scale(1,s.legs,.94);g.translate(side*.147,0,.012);geometries.push(g);
  skin=p=>{const y=p.y/s.legs,upper=T.MathUtils.smoothstep(y,.17,.29),ankle=1-T.MathUtils.smoothstep(y,.055,.145);return[[leg,upper],[leg+1,(1-upper)*(1-ankle)],[leg+2,(1-upper)*ankle]];};
 }else{
  const side=key===8?1:-1,arm=side===1?7:11;
  const a=new T.Vector3(side*.20*s.body,.79+shift,0),b=new T.Vector3(side*handBindX(s),.494+shift,.03),axis=a.clone().sub(b);
  // Constant width, straight axis and rounded ends; no muscle bulges or cuffs.
  const length=axis.length(),profile=[];for(let i=0;i<=6;i++){const t=-Math.PI/2+i/6*Math.PI/2;profile.push(new T.Vector2(.089*Math.cos(t),-length/2+.089*Math.sin(t)));}for(let i=1;i<6;i++)profile.push(new T.Vector2(.089,-length/2+length*i/6));for(let i=0;i<=6;i++){const t=i/6*Math.PI/2;profile.push(new T.Vector2(.089*Math.cos(t),length/2+.089*Math.sin(t)));}const limb=new T.LatheGeometry(profile,seg);
  limb.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),axis.normalize()));limb.translate(...a.add(b).multiplyScalar(.5).toArray());geometries.push(limb);
  skin=p=>armWeights(s,p,arm);
 }
 const positions=[],normals=[],uvs=[],indices=[],weights=[],p=new T.Vector3();
 for(const original of geometries){
  let g=original.toNonIndexed();original.dispose();
  const clothed=s.clothing&&s.clothing!=='none';if(clothed&&key===3){g.dispose();continue;}
  if([12,15].includes(key)&&['pajamas','spacesuit','suit','uniform','prison','overalls'].includes(s.clothing)){
   // Keep the visible foot and an overlap inside the cuff. Covered upper skin
   // otherwise pierces narrower hips and the cloth's seated-pose blend.
   const cut=((s.clothing==='uniform'?.165:.08)+.018)*s.legs,source=g,values=[],faceNormals=[],texcoords=[];
   const vertex=i=>({p:new T.Vector3().fromBufferAttribute(source.attributes.position,i),n:new T.Vector3().fromBufferAttribute(source.attributes.normal,i),uv:new T.Vector2().fromBufferAttribute(source.attributes.uv,i)});
   for(let i=0;i<source.attributes.position.count;i+=3){const tri=[vertex(i),vertex(i+1),vertex(i+2)],polygon=[];
    for(let j=0;j<3;j++){const a=tri[j],b=tri[(j+1)%3],da=a.p.y-cut,db=b.p.y-cut;if(da<=0)polygon.push(a);if((da<=0)!==(db<=0)){const t=da/(da-db);polygon.push({p:a.p.clone().lerp(b.p,t),n:a.n.clone().lerp(b.n,t).normalize(),uv:a.uv.clone().lerp(b.uv,t)});}}
    for(let j=1;j<polygon.length-1;j++){const points=[polygon[0],polygon[j],polygon[j+1]];if(points[1].p.clone().sub(points[0].p).cross(points[2].p.clone().sub(points[0].p)).lengthSq()<1e-25)continue;for(const v of points){values.push(...v.p.toArray());faceNormals.push(...v.n.toArray());texcoords.push(...v.uv.toArray());}}
   }
   g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(values,3));g.setAttribute('normal',new T.Float32BufferAttribute(faceNormals,3));g.setAttribute('uv',new T.Float32BufferAttribute(texcoords,2));source.dispose();
  }
  const side=key===8?1:-1,armStart=new T.Vector3(side*.20*s.body,.79+shift,0),armAxis=new T.Vector3(side*handBindX(s),.494+shift,.03).sub(armStart),length=armAxis.length();armAxis.normalize();const short=['tee','raglan','uniform','overalls','sailor','apron'].includes(s.clothing),cut=(short?.37:.88)*length;
  for(let i=0;i<g.attributes.position.count;i++){
   if(clothed&&[8,10].includes(key)){const first=i-i%3;let covered=true;for(let j=0;j<3;j++){const point=new T.Vector3().fromBufferAttribute(g.attributes.position,first+j);if(point.sub(armStart).dot(armAxis)>=cut)covered=false;}if(covered)continue;}
   p.fromBufferAttribute(g.attributes.position,i);positions.push(...p.toArray());
   normals.push(g.attributes.normal.getX(i),g.attributes.normal.getY(i),g.attributes.normal.getZ(i));
   uvs.push(g.attributes.uv.getX(i),g.attributes.uv.getY(i));
   const influences=skin(p);while(influences.length<4)influences.push([0,0]);
   for(const[bone,weight]of influences){indices.push(bone);weights.push(weight);}
  }g.dispose();
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('normal',new T.Float32BufferAttribute(normals,3));g.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));g.setAttribute('skinIndex',new T.Uint16BufferAttribute(indices,4));g.setAttribute('skinWeight',new T.Float32BufferAttribute(weights,4));return g;
}
