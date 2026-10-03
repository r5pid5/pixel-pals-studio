import * as T from './vendor/three.module.js';
export function addBandana(spine,s){
 const group=new T.Group();group.name='Bandana';spine.add(group);
 const cloth=new T.MeshStandardMaterial({color:s.neckColor,roughness:.86,side:T.DoubleSide});cloth.userData.colorSetting='neckColor';
 const seam=cloth.clone();seam.color.multiplyScalar(.86);seam.userData.colorScale=.86;
 const add=(g,m=cloth)=>{const o=new T.Mesh(g,m);o.castShadow=true;o.userData.smoothAccessory=true;group.add(o);return o;};
 // Continuous cloth around the neck, with a longer folded point at the front.
 const columns=64,rows=10,positions=[],uv=[],indices=[];
 const profile=[[.15,.917],[.215,.838],[.275,.67],[.306,.46],[.310,.344]];const bodyRadius=y=>{for(let i=0;i<profile.length-1;i++){const[r1,y1]=profile[i],[r2,y2]=profile[i+1];if(y<=y1&&y>=y2)return r1+(r2-r1)*(y1-y)/(y1-y2);}return .15;};
 const point=(a,v)=>{const front=Math.pow(Math.max(0,Math.sin(a)),5),py=.365-v*(.08+.28*front),required=bodyRadius(py+.54615383)+.024,r=required,fold=.004*Math.sin(a*14)*Math.sin(v*Math.PI);return new T.Vector3(Math.cos(a)*(r+fold)*s.body,py,Math.sin(a)*(r*.79+fold));};
 for(let j=0;j<=rows;j++)for(let i=0;i<=columns;i++){const a=i/columns*Math.PI*2,v=j/rows;positions.push(...point(a,v).toArray());uv.push(i/columns,1-v);}
 for(let j=0;j<rows;j++)for(let i=0;i<columns;i++){const a=j*(columns+1)+i,b=a+1,c=a+columns+1,d=c+1;indices.push(a,c,b,b,c,d);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();add(g);
 for(const v of[.035,.955]){const edge=[];for(let i=0;i<=columns;i++){const a=i/columns*Math.PI*2,p=point(a,v);p.x+=Math.cos(a)*.004;p.z+=Math.sin(a)*.004;edge.push(p);}add(new T.TubeGeometry(new T.CatmullRomCurve3(edge),64,v<.5?.010:.004,5,false),v<.5?cloth:seam);}
 const knot=add(new T.SphereGeometry(.042,12,8));knot.position.set(0,.35,-.165);knot.scale.set(1,.78,.8);
 for(const side of[-1,1]){const tail=add(new T.SphereGeometry(1,12,8));tail.position.set(side*.04,.275,-.19);tail.scale.set(.045,.105,.02);tail.rotation.z=side*.3;}
}
