import * as T from './vendor/three.module.js';
export function wearableMaterial(s,key,color,options={}){
 const material=s.shading?new T.MeshStandardMaterial({color:key?s[key]:color,roughness:.9,...options}):new T.MeshBasicMaterial({color:key?s[key]:color,side:options.side??T.FrontSide});
 if(key)material.userData.colorSetting=key;
 return material;
}
export function solidMesh(parent,geometry,material,position=[0,0,0],scale=[1,1,1],name=''){
 const mesh=new T.Mesh(geometry,material);mesh.position.fromArray(position);mesh.scale.fromArray(scale);mesh.name=name;mesh.castShadow=true;parent.add(mesh);return mesh;
}
export function roundBox(width,height,depth,radius=.03){
 const r=Math.min(radius,width/2,height/2),shape=new T.Shape(),x=-width/2,y=-height/2;
 shape.moveTo(x+r,y);shape.lineTo(x+width-r,y);shape.quadraticCurveTo(x+width,y,x+width,y+r);shape.lineTo(x+width,y+height-r);shape.quadraticCurveTo(x+width,y+height,x+width-r,y+height);shape.lineTo(x+r,y+height);shape.quadraticCurveTo(x,y+height,x,y+height-r);shape.lineTo(x,y+r);shape.quadraticCurveTo(x,y,x+r,y);
 const bevel=Math.min(r*.45,depth*.25),core=Math.max(.001,depth-2*bevel);const geometry=new T.ExtrudeGeometry(shape,{depth:core,bevelEnabled:true,bevelSize:bevel,bevelThickness:bevel,bevelSegments:2,curveSegments:8});geometry.translate(0,0,-core/2);return geometry;
}
export function lineTube(points,radius=.008,segments=14){return new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),segments,radius,6,false);}
export function fabricShape(points,depth=.018){
 const shape=new T.Shape();points.forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));shape.closePath();
 const geometry=new T.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSize:.004,bevelThickness:.004,bevelSegments:1,curveSegments:8});geometry.translate(0,0,-depth/2);return geometry;
}
export function ball(parent,material,position,scale,name=''){return solidMesh(parent,new T.SphereGeometry(1,16,10),material,position,scale,name);}

export function tessellateFace(geometry,maxEdge=.035){
 const p=geometry.attributes.position,indices=geometry.index?Array.from(geometry.index.array):Array.from({length:p.count},(_,i)=>i),values=[];
 const length=(a,b)=>(a[0]-b[0])**2+(a[1]-b[1])**2;
 function split(a,b,c,depth=0){const v=[a,b,c],edges=[length(a,b),length(b,c),length(c,a)],edge=edges.indexOf(Math.max(...edges));if(edges[edge]>maxEdge**2&&depth<8){const x=v[edge],y=v[(edge+1)%3],z=v[(edge+2)%3],mid=x.map((n,i)=>(n+y[i])/2);split(x,mid,z,depth+1);split(mid,y,z,depth+1);}else values.push(...a,...b,...c);}
 for(let i=0;i<indices.length;i+=3)split(...indices.slice(i,i+3).map(j=>[p.getX(j),p.getY(j),p.getZ(j)]));
 const result=new T.BufferGeometry();result.setAttribute('position',new T.Float32BufferAttribute(values,3));result.computeVertexNormals();return result;
}
