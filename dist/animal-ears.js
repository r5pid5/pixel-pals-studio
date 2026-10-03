import {paddedDogEar} from './floppy-ears.js';
import * as T from './vendor/three.module.js';

// World proportions match the rounded skull; each root overlaps its crown.
export function addAnimalEars(head,s,origin,surface){
 if(s.species==='uprightPuppy')s={...s,species:'puppy',dogEars:'upright'};if(s.species==='largeLop')s={...s,species:'lop',lopEarStyle:'large'};
 if(['cat','fox','wolf','none'].includes(s.species))return;
 const seg=s.detail==='verylow'?8:s.detail==='low'?14:22;
 const outer=new T.MeshStandardMaterial({color:s.earSeparate?s.earColor:s.bodyColor,roughness:.72});
 const horn=new T.MeshStandardMaterial({color:s.antlerColor,roughness:.8});outer.userData.colorSetting=s.earSeparate?'earColor':'bodyColor';horn.userData.colorSetting='antlerColor';
 const group=new T.Group();group.name='AnimalEars';group.userData.role='ears';head.add(group);
 const crown=(x,z)=>{const height=surface.top(x,z);if(height===null)throw new Error('Animal ear root must lie on the skull.');return height;};
 const add=(g,m,parent=group)=>{const o=new T.Mesh(g,m);o.userData.role=m===horn?'antler':'ears';o.castShadow=true;parent.add(o);return o;};
 const oval=(side,x,y,rx,ry,depth,tilt=0)=>{
  const ear=new T.Group();ear.position.set(side*x,y-origin[1],-.07);ear.rotation.z=side*tilt;group.add(ear);
  const geo=new T.SphereGeometry(1,seg,Math.max(8,Math.floor(seg*.6))),a=add(geo,outer,ear);a.scale.set(rx*s.ears,ry*s.ears,depth);
 };
 const round={bear:[.65,2.05,.29,.30,.19],mouse:[.68,2.08,.34,.37,.18],hamster:[.66,2.02,.22,.245,.17],raccoon:[.66,2.01,.24,.27,.17],otter:[.74,1.90,.165,.185,.14]};
 for(const side of[-1,1]){
  if(s.species==='chibiCat'){
   const outline=[[-.18,.015,0],[.05,.04,0],[.27,-.02,-.025],[.32,-.11,-.01],[.25,-.36,.11],[.13,-.55,.14],[.055,-.53,.13],[-.10,-.25,.06]],positions=outline.flat(),indices=[];positions.push(.04,-.19,.20,.065,-.20,-.11);for(let j=0;j<outline.length;j++){const next=(j+1)%outline.length;indices.push(8,next,j,9,j,next);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(new Array(positions.length/3*2).fill(0),2));g.setIndex(indices);g.computeVertexNormals();const ear=add(g,outer);ear.position.set(side*.60,crown(side*.60,-.035)-.035-origin[1],.01);ear.scale.set(side*s.ears,s.ears,1);
  }else if(round[s.species]){const[x,,rx,ry,depth]=round[s.species];oval(side,x,crown(side*x,-.07)+ry*s.ears*.52,rx,ry,depth,s.species==='raccoon'?-.16:0);}
  else if(s.species==='bunny'){
   const ear=new T.Group();ear.position.set(side*.42,crown(side*.42,-.09)-.12-origin[1],-.09);ear.rotation.z=-side*.10;group.add(ear);
   const profile=[[0,0],[.12,0],[.16,.15],[.175,.45],[.16,.75],[.10,.97],[0,1.09]];
   const geo=new T.LatheGeometry(profile.map(([r,y])=>new T.Vector2(r,y)),seg),a=add(geo,outer,ear);a.scale.set(1,s.ears,.77);
  }else if(['puppy','lop'].includes(s.species)){
   if(s.species==='puppy'&&s.dogEars==='upright'){
    const sh=new T.Shape();sh.moveTo(-.22,0);sh.bezierCurveTo(-.24,.23,-.15,.48,-.02,.53);sh.bezierCurveTo(.09,.55,.22,.18,.22,0);sh.quadraticCurveTo(0,-.055,-.22,0);const g=new T.ExtrudeGeometry(sh,{depth:.17,bevelEnabled:true,bevelSize:.025,bevelThickness:.025,bevelSegments:2});g.translate(0,0,-.085);const ear=add(g,outer);ear.position.set(side*.49,crown(side*.49,-.05)-.16-origin[1],-.05);ear.rotation.z=-side*.08;ear.scale.set(s.ears,s.ears,1);continue;
   }
   if(s.species==='puppy'){group.add(paddedDogEar(side,s,origin,surface,outer));continue;}

   const large=s.lopEarStyle==='large',height=(large?1.40:.83)*s.ears,width=(large?.285:.16)*s.ears;
   const root=large?.58:.64,ear=new T.Group();ear.position.set(side*root,crown(side*root,-.08)-.06-origin[1],-.08);group.add(ear);
   const curve=new T.CatmullRomCurve3(large?[new T.Vector3(0,0,0),new T.Vector3(side*.18,-height*.22,.07),new T.Vector3(side*.32,-height*.67,.11),new T.Vector3(side*.38,-height,.12)]:[new T.Vector3(0,0,0),new T.Vector3(side*.22,-height*.34,.035),new T.Vector3(side*.24,-height,.04)]),g=new T.TubeGeometry(curve,16,1,seg,false),p=g.attributes.position;
   for(let i=0;i<=16;i++){const t=i/16,center=curve.getPointAt(t),r=width*Math.pow(Math.sin(Math.PI*t),large?.30:.38);for(let j=0;j<=seg;j++){const k=i*(seg+1)+j,v=new T.Vector3().fromBufferAttribute(p,k).sub(center).multiplyScalar(r);v.z*=large?.52:.67;v.add(center);p.setXYZ(k,...v.toArray());}}g.computeVertexNormals();add(g,outer,ear);
  }else if(['deer','antler'].includes(s.species)){
   oval(side,.77,1.96,.17,.355,.14,-.91);
   if(s.species==='antler'){
    const paths=[[[side*.33,2.04,-.12],[side*.36,2.30,-.15],[side*.30,2.61,-.14]],[[side*.35,2.28,-.15],[side*.55,2.46,-.15]],[[side*.32,2.48,-.14],[side*.14,2.56,-.14]]];
    const base=crown(side*.33,-.12)-.035;
    for(const path of paths){const p=path.map(([x,y,z])=>new T.Vector3(x,base+(y-2.04)*s.ears-origin[1],z));add(new T.TubeGeometry(new T.CatmullRomCurve3(p),8,.037,6,false),horn);for(const v of[p[0],p.at(-1)]){const cap=add(new T.SphereGeometry(.037,8,6),horn);cap.position.copy(v);}}
   }
  }else if(s.species==='axolotl'){
   for(let i=0;i<3;i++){
    const root=new T.Vector3(side*.82,1.34-i*.045-origin[1],-.035),delta=new T.Vector3(side*(i===1?.44:.36)*s.ears,(.24-i*.23)*s.ears,0),leaf=add(new T.ConeGeometry(.105*s.ears,delta.length(),7),outer);leaf.position.copy(root).addScaledVector(delta,.5);leaf.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.clone().normalize());leaf.scale.z=.75;
   }
  }
 }
}
