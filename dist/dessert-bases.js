import * as T from './vendor/three.module.js';
import {roundBox} from './wearable-meshes.js';
import {turned,pastryBuilder,batchPastry} from './dessert-shapes.js';
import {dessertBaseOptions} from './dessert-options.js';

export function createWhippedCream(s){
 const g=new T.Group();g.name='WhippedCream';const p=pastryBuilder(s);
 p.dollop(g,[0,0,0],.52,s.creamColor,'creamColor');
 if(s.whippedCream==='strawberry')p.strawberry(g,[.015,.45,.015],.27,-.23);
 if(s.whippedCream==='cherry')p.cherry(g,[.01,.45,.01],.23);
 if(s.whippedCream==='chocolate'){p.chocolate(g,[.02,.36,-.02],.27,-.25);p.chocolateCurl(g,[-.08,.43,.025],.25,-.6);}
 return batchPastry(g);
}
export function addWhippedCream(head,s,origin,surface){
 if(!s.whippedCream||s.whippedCream==='none')return;
 const g=createWhippedCream(s);g.position.set(0,surface.top(0,.035)-origin[1]-.014,.035);head.add(g);
}

function disk(p,g,r,y,h,color,name,roughness=.85){
 const bevel=Math.min(.035,h*.25);return p.add(g,turned([[0,0],[r-bevel,0],[r-.005,bevel*.5],[r,bevel],[r+.005,h*.5],[r,h-bevel],[r-.005,h-bevel*.5],[r-bevel,h],[0,h]],64),color,[0,y,0],[1,1,1],name,roughness);
}
function icing(p,g,r,y,color,depth=.09,roughness=.55){
 const n=96,values=[],faces=[],bottom=i=>y-depth*(.6+.3*Math.sin(i/n*Math.PI*2*9)+.12*Math.sin(i/n*Math.PI*2*5));
 values.push(0,y+.016,0);
 for(let row=0;row<3;row++)for(let i=0;i<n;i++){const a=i/n*Math.PI*2,rad=row===0?r-.012:r;values.push(Math.cos(a)*rad,row===0?y+.014:row===1?y:bottom(i),Math.sin(a)*rad);}
 for(let i=0;i<n;i++){const j=(i+1)%n;faces.push(0,1+j,1+i);for(let row=0;row<2;row++){const a=1+row*n+i,b=1+row*n+j,c=a+n,d=b+n;faces.push(a,b,d,a,d,c);}}
 // Close the skirt's underside with a recessed cap.
 const cap=values.length/3;values.push(0,y-depth*1.05,0);for(let i=0;i<n;i++)faces.push(cap,1+2*n+i,1+2*n+(i+1)%n);
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(values,3));geo.setIndex(faces);geo.computeVertexNormals();p.add(g,geo,color,[0,0,0],[1,1,1],'DrippingGlaze',roughness);
}
function ringDecor(g,p,flavor,y,r=.62,count=8){
 for(let i=0;i<count;i++){
  const a=i/count*Math.PI*2,x=Math.cos(a)*r,z=Math.sin(a)*r;
  if(flavor==='chocolate'){
   p.dollop(g,[x,y,z],.16,'#aa8065');if(i%2===0)p.chocolate(g,[x,y+.11,z],.19,Math.sin(a)*.3);else p.chocolateCurl(g,[x,y+.12,z],.3,a);
  }else if(flavor==='strawberry'){
   if(i%2===0)p.strawberry(g,[x,y,z],.26,Math.cos(a)*.15);else p.dollop(g,[x,y,z],.19);
  }else if(flavor==='peach'){
   if(i%2===0){p.peach(g,[x,y,z],.33,a);p.leaf(g,[x,y+.07,z],.1,.8);}else p.dollop(g,[x,y,z],.19);
  }else{
   p.dollop(g,[x,y,z],.16,'#e7dce8');p.blueberry(g,[x-.028,y+.11,z],.14);p.blueberry(g,[x+.035,y+.13,z+.012],.12);
  }
 }
}
function cake(g,p,flavor){
 const chocolate=flavor==='chocolate',berry=flavor==='blueberry',sponge=chocolate?'#927058':'#e2c590',cream=chocolate?'#c1977c':berry?'#d8c6df':'#fbefd9',jam=flavor==='strawberry'?'#c77672':berry?'#9384a8':flavor==='peach'?'#dba47d':'#70513f';
 disk(p,g,.81,.023,.025,'#cda97f','CakeBottom');
 disk(p,g,.805,.048,.132,sponge,'SpongeLayer');disk(p,g,.818,.180,.053,cream,'CreamFilling');disk(p,g,.810,.233,.016,jam,'FruitFilling');disk(p,g,.805,.249,.132,sponge,'SpongeLayer');disk(p,g,.818,.381,.070,cream,'CreamFrosting');
 icing(p,g,.822,.454,chocolate?'#73513f':cream,chocolate?.12:.055,chocolate?.5:.9);
 // Fruit halves embedded in the exposed filling band, outside the cake.
 if(flavor==='strawberry')for(let i=0;i<12;i++){const a=i/12*Math.PI*2,berry=p.strawberry(g,[Math.cos(a)*.826,.183,Math.sin(a)*.826],.052,0,{garnish:false});berry.rotation.y=Math.PI/2-a;}
 if(flavor==='blueberry')for(let i=0;i<12;i++){const a=i/12*Math.PI*2,m=p.sphere(g,'#8b7b9d',[Math.cos(a)*.815,.205,Math.sin(a)*.815],[.046,.021,.017],'FruitInFilling');m.rotation.y=Math.PI/2-a;}
 ringDecor(g,p,flavor,.467);g.userData.supportHeight=.467;
}
function pudding(g,p,flavor){
 const colors={custard:['#e6c98f','#a97850'],chocolate:['#a28066','#6e4e3e'],strawberry:['#e6beb3','#c9817c'],matcha:['#a6b187','#eee0c2']},[body,glaze]=colors[flavor];
 const profile=flavor==='chocolate'?[[0,0],[.67,0],[.78,.03],[.78,.10],[.76,.25],[.67,.41],[.57,.45],[0,.45]]:[[0,0],[.73,0],[.80,.028],[.78,.09],[.70,.36],[.64,.45],[.60,.468],[0,.468]];
 const geo=turned(profile,64,{lobes:flavor==='custard'?10:flavor==='strawberry'?8:0,amplitude:flavor==='custard'?.012:.022});p.add(g,geo,body,[0,.018,0],[1,1,1],'SilkyPudding',.52);
 if(flavor==='strawberry')disk(p,g,.727,.20,.022,'#f0decc','MilkPuddingBand');
 icing(p,g,flavor==='chocolate'?.578:.609,flavor==='chocolate'?.477:.497,glaze,.070,.42);
 if(flavor==='custard'){p.dollop(g,[.43,.50,-.20],.18);p.cherry(g,[.43,.65,-.20],.14);disk(p,g,.855,.012,.009,'#c39a63','CaramelPool',.5);}
 if(flavor==='chocolate'){p.chocolateCurl(g,[.40,.50,-.18],.56);p.dollop(g,[-.44,.49,-.15],.18,'#c29c7c');p.chocolate(g,[-.43,.61,-.17],.20,-.2);}
 if(flavor==='strawberry'){p.strawberry(g,[.43,.51,-.17],.25,-.22);p.dollop(g,[-.42,.51,-.16],.18);}
 if(flavor==='matcha'){for(let i=0;i<5;i++)p.sphere(g,'#947465',[(i-2)*.075,.52,-.45],[.033,.022,.022],'SweetRedBean');p.dollop(g,[.44,.51,-.10],.19);p.leaf(g,[.45,.63,-.1],.13,-.7);}
 g.userData.supportHeight=flavor==='chocolate'?.495:.514;
}
function roll(g,p,flavor){
 const sponge={strawberry:'#e2c794',chocolate:'#957259',matcha:'#a3af81',vanilla:'#e5ce9d'}[flavor],cream=flavor==='chocolate'?'#c5a187':flavor==='vanilla'?'#f0dbad':'#f4ead6';
 const geo=new T.CylinderGeometry(1,1,1,72,1,false);geo.rotateX(Math.PI/2);const attr=geo.attributes.position;
 for(let i=0;i<attr.count;i++)attr.setXYZ(i,attr.getX(i)*.76,Math.max(-.005,Math.min(.708,.335+attr.getY(i)*.40)),attr.getZ(i)*1.12);geo.computeVertexNormals();p.add(g,geo,sponge,[0,.035,0],[1,1,1],'BakedRoll');
 for(const side of[-1,1]){
  const face=p.add(g,new T.CylinderGeometry(1,1,.009,64),cream,[0,.410,side*.565],[.66,1,.285],'RollCreamCrossSection');face.rotation.x=Math.PI/2;
  const pts=[];for(let i=0;i<=96;i++){const t=i/96,a=t*Math.PI*3.8,r=.055+.535*t;pts.push([Math.cos(a)*r,.410+Math.sin(a)*r*.435,side*.572]);}p.tube(g,pts,sponge,.024,'SpongeSpiral');
  if(flavor==='strawberry')for(const[x,y]of[[-.23,.45],[.22,.40],[0,.53]]){const berry=p.strawberry(g,[x,y,side*.577],.14,.4,{garnish:false});berry.scale.z=.35;berry.rotation.y=side>0?0:Math.PI;}
  if(flavor==='matcha')for(let i=0;i<5;i++)p.sphere(g,'#97725e',[(i-2)*.10,.41+Math.sin(i*2)*.10,side*.579],[.037,.026,.015],'RedBeansInCream');
 }
 if(flavor==='chocolate'){for(const x of[-.47,.47]){p.dollop(g,[x,.62,-.18],.20,'#bb967d');p.chocolateCurl(g,[x,.75,-.19],.37,.3);}for(let i=0;i<6;i++)p.tube(g,[[-.53,.63,-.43+i*.17],[0,.753,-.43+i*.17],[.53,.63,-.43+i*.17]],'#6c4e3d',.011,'ChocolateDrizzle');}
 else if(flavor==='strawberry'){for(const x of[-.47,.47]){p.dollop(g,[x,.62,-.18],.19);p.strawberry(g,[x,.75,-.18],.23,x>0?.2:-.2);}}
 else if(flavor==='matcha'){for(const x of[-.48,.48]){p.dollop(g,[x,.615,-.18],.20);p.leaf(g,[x,.78,-.20],.17,.4);}}
 else{for(const x of[-.48,.48]){p.dollop(g,[x,.615,-.17],.21,'#f4e6c9');p.cherry(g,[x,.78,-.18],.13);}}
 g.userData.supportHeight=.743;
}
function castella(g,p,flavor){
 const chocolate=flavor==='chocolate',matcha=flavor==='matcha',strawberry=flavor==='strawberry',sponge=chocolate?'#a48568':matcha?'#b3bd86':'#e9d2a0',crust=chocolate?'#75503b':matcha?'#a18c56':'#b88850';
 p.add(g,roundBox(1.53,.055,1.18,.055),'#b5895d',[0,.045,0],[1,1,1],'BrownBottomCrust');
 if(strawberry){p.add(g,roundBox(1.50,.19,1.15,.04),sponge,[0,.16,0],[1,1,1],'CastellaSponge');p.add(g,roundBox(1.51,.065,1.16,.035),'#f6e9d4',[0,.287,0],[1,1,1],'SandwichCream');p.add(g,roundBox(1.49,.022,1.15,.025),'#d3978b',[0,.327,0],[1,1,1],'StrawberryJam');p.add(g,roundBox(1.50,.14,1.15,.04),sponge,[0,.410,0],[1,1,1],'CastellaSponge');}
 else p.add(g,roundBox(1.50,.39,1.15,.04),sponge,[0,.262,0],[1,1,1],'CastellaSponge');
 p.add(g,roundBox(1.52,.055,1.17,.047),crust,[0,strawberry?.506:.482,0],[1,1,1],'GoldenTopCrust');
 // Small inset-colored crumbs, varied in size and spacing on the cut face.
 for(let i=0;i<48;i++){const x=Math.sin(i*4.13)*.69,y=.11+(i%7)/7*.31;if(strawberry&&y>.255&&y<.34)continue;const radius=.004+(i%3)*.0015;p.sphere(g,chocolate?'#997a5f':matcha?'#a4af78':'#d5bd8b',[x,y,.579],[radius,radius*.65,.002],'SpongePore');}
 for(const x of[-.50,.50]){
  if(strawberry){p.dollop(g,[x,.540,-.21],.18);p.strawberry(g,[x,.68,-.21],.22,x>0?.15:-.15);}
  else if(chocolate){p.chocolateCurl(g,[x,.52,-.20],.55,.6);}
  else if(matcha){p.leaf(g,[x,.52,-.21],.22,.65);p.sphere(g,'#e7ddbc',[x-.04,.53,-.16],[.038,.023,.024],'SugarPearl');}
  else{p.add(g,roundBox(.18,.013,.14,.025),'#e8ca80',[x,.519,-.19],[1,1,1],'HoneyGlaze',.35);}
 }
 if(chocolate)for(let i=0;i<4;i++)p.tube(g,[[-.63,.518,-.40+i*.22],[0,.526,-.32+i*.22],[.63,.518,-.40+i*.22]],'#79533d',.010,'ChocolateDrizzle');
 for(let i=0;i<8;i++)p.sphere(g,'#f0debd',[-.56+i*.16,.018,.64],[.018,.010,.014],'CastellaCrumb');
 g.userData.supportHeight=strawberry?.541:.518;
}
function appleFan(g,p,x,z,a){
 const fan=new T.Group();fan.position.set(x,.289,z);fan.rotation.y=a;g.add(fan);
 for(let i=0;i<5;i++){
  const sh=new T.Shape();sh.moveTo(-.21,-.055);sh.bezierCurveTo(-.22,.18,.18,.20,.23,-.055);sh.bezierCurveTo(.14,.045,-.09,.035,-.21,-.055);sh.closePath();
  const geo=new T.ExtrudeGeometry(sh,{depth:.023,bevelEnabled:true,bevelSize:.009,bevelThickness:.006,bevelSegments:2,curveSegments:18});const slice=p.add(fan,geo,i%2?'#dfb279':'#eac38d',[0,i*.015,(i-2)*.037],[1,1,1],'OverlappingAppleSlice',.52);slice.rotation.x=-Math.PI/2+.22;
 }
}
function tart(g,p,flavor){
 const crust=turned([[0,0],[.70,0],[.81,.02],[.865,.10],[.866,.24],[.843,.295],[.77,.295],[.735,.245],[.725,.07],[0,.07]],96,{lobes:24,amplitude:.018});p.add(g,crust,'#c8a06f',[0,.016,0],[1,1,1],'FlutedTartCrust');
 const filling=flavor==='chocolate'?'#806047':flavor==='blueberry'?'#c0a8c0':'#f0ddae';disk(p,g,.747,.14,.135,filling,'TartFilling',flavor==='chocolate'?.5:.85);
 if(flavor==='strawberry')for(let i=0;i<10;i++){const a=i/10*Math.PI*2,x=Math.cos(a)*.59,z=Math.sin(a)*.59;const berry=p.strawberry(g,[x,.28,z],.29,0);berry.rotation.z=Math.cos(a)*.40;berry.rotation.x=-Math.sin(a)*.40;}
 if(flavor==='blueberry')for(let i=0;i<22;i++){const a=i/22*Math.PI*2,r=.54+.045*Math.sin(i*2.4);p.blueberry(g,[Math.cos(a)*r,.284,Math.sin(a)*r],.18);if(i%5===0)p.leaf(g,[Math.cos(a)*r,.35,Math.sin(a)*r],.14,.8);}
 if(flavor==='apple')for(let i=0;i<8;i++){const a=i/8*Math.PI*2;appleFan(g,p,Math.cos(a)*.56,Math.sin(a)*.56,a);}
 if(flavor==='chocolate')for(let i=0;i<8;i++){const a=i/8*Math.PI*2,x=Math.cos(a)*.59,z=Math.sin(a)*.59;if(i%2){p.dollop(g,[x,.28,z],.20,'#c1a286');p.chocolateCurl(g,[x,.43,z],.4,a);}else p.chocolate(g,[x,.29,z],.23,Math.cos(a)*.45);}
 g.userData.supportHeight=.275;
}
export function createDessertBase(s){
 const choice=dessertBaseOptions.find(x=>x.id===s.dessertBase);if(!choice)return null;
 const g=new T.Group();g.name='DessertBase';g.userData.dessertBase=true;g.userData.dessertChoice=choice.id;
 const p=pastryBuilder(s);({cake,pudding,roll,castella,tart}[choice.family])(g,p,choice.flavor);
 // A fine ceramic rim keeps each pastry visually grounded, with no stand
 // through its center and no garnish in the two-foot landing area.
 const plate=p.add(g,turned([[0,0],[.80,0],[.89,.012],[.91,.025],[.91,.040],[.86,.039],[.82,.025],[0,.024]],64),'#eee5d8',[0,-.012,0],[1,1,.86],'DessertPlate');
 if(choice.family==='roll'||choice.family==='castella')plate.scale.set(1.05,1,.94);
 const support=g.userData.supportHeight,height=s.dessertBaseHeight??1.5;
 batchPastry(g);
 // Stretch the pastry's body, keeping the plate thin and preserving the
 // height of fruit, cream and chocolate above the character's landing area.
 for(const mesh of g.children){if(mesh.userData.pastryParts.includes('DessertPlate'))continue;const positions=mesh.geometry.attributes.position,normals=mesh.geometry.attributes.normal,n=new T.Vector3();for(let i=0;i<positions.count;i++){const y=positions.getY(i);positions.setY(i,y+Math.max(0,Math.min(y-.035,support-.035))*(height-1));n.fromBufferAttribute(normals,i);if(y>.035&&y<support)n.y/=height;n.normalize();normals.setXYZ(i,n.x,n.y,n.z);}}
 g.userData.supportHeight=.035+(support-.035)*height;
 g.scale.set(s.dessertBaseScale??1,1,s.dessertBaseScale??1);return g;
}
