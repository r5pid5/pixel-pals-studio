import * as T from './vendor/three.module.js';
import {wearableMaterial,solidMesh,lineTube,roundBox,ball} from './wearable-meshes.js';
export function addGuitar(spine,s){
 const g=new T.Group();g.name='Guitar';g.position.set(.10,-.10,.46);g.rotation.z=.62;spine.add(g);
 const electric=s.guitarStyle==='electric',paint=wearableMaterial(s,'guitarColor'),wood=wearableMaterial(s,null,'#a58a68'),dark=wearableMaterial(s,null,'#3a3840'),chrome=wearableMaterial(s,null,'#c1c8cc',{roughness:.4}),ivory=wearableMaterial(s,null,'#ede8d8');
 const body=new T.Shape();
 if(electric){
  body.moveTo(-.035,.13);body.bezierCurveTo(-.071,.13,-.071,.255,-.108,.286);body.bezierCurveTo(-.137,.313,-.166,.292,-.166,.255);
  body.bezierCurveTo(-.164,.195,-.165,.136,-.193,.078);body.bezierCurveTo(-.232,.006,-.169,-.041,-.194,-.098);
  body.bezierCurveTo(-.245,-.17,-.218,-.251,-.135,-.283);body.bezierCurveTo(-.043,-.318,.121,-.299,.188,-.235);
  body.bezierCurveTo(.253,-.171,.203,-.084,.173,-.043);body.bezierCurveTo(.146,-.005,.182,.035,.180,.078);
  body.bezierCurveTo(.180,.141,.152,.226,.122,.225);body.bezierCurveTo(.091,.224,.111,.124,.035,.13);body.closePath();
 }else{body.moveTo(0,.215);body.bezierCurveTo(-.13,.24,-.185,.16,-.155,.078);body.bezierCurveTo(-.11,.015,-.21,-.034,-.217,-.125);body.bezierCurveTo(-.228,-.28,.228,-.28,.217,-.125);body.bezierCurveTo(.21,-.034,.11,.015,.155,.078);body.bezierCurveTo(.185,.16,.13,.24,0,.215);}
 const depth=electric?.063:.10,geo=new T.ExtrudeGeometry(body,{depth,bevelEnabled:true,bevelSize:.009,bevelThickness:.009,bevelSegments:3,curveSegments:28});geo.translate(0,0,-depth/2);solidMesh(g,geo,paint,[0,0,0],[1,1,1],electric?'ElectricBody':'AcousticBody');
 solidMesh(g,roundBox(.068,.49,.035,.005),wood,[0,.375,.003],[1,1,1],'GuitarNeck');
 solidMesh(g,roundBox(.057,.49,.011,.003),dark,[0,.375,.027],[1,1,1],'GuitarFingerboard');
 const headstock=new T.Shape();headstock.moveTo(-.035,.614);headstock.lineTo(.035,.614);headstock.bezierCurveTo(.031,.69,.063,.70,.065,.735);headstock.bezierCurveTo(.058,.790,-.033,.765,-.035,.718);headstock.closePath();
 const hg=new T.ExtrudeGeometry(headstock,{depth:.035,bevelEnabled:true,bevelSize:.005,bevelThickness:.005,bevelSegments:2,curveSegments:18});hg.translate(0,0,-.014);solidMesh(g,hg,wood,[0,0,0],[1,1,1],'GuitarHeadstock');
 const front=depth/2+.014;
 if(electric){
  const guard=new T.Shape();guard.moveTo(-.028,.143);guard.lineTo(.04,.143);guard.bezierCurveTo(.075,.115,.061,.055,.068,.011);guard.bezierCurveTo(.075,-.037,.128,-.033,.143,-.104);guard.lineTo(.114,-.195);guard.lineTo(-.047,-.196);guard.bezierCurveTo(-.081,-.122,-.064,-.025,-.058,.045);guard.lineTo(-.028,.143);guard.closePath();
  solidMesh(g,new T.ExtrudeGeometry(guard,{depth:.004,bevelEnabled:false,curveSegments:22}),ivory,[0,0,front],[1,1,1],'ElectricPickguard');
  for(const y of[-.084,.013,.102])solidMesh(g,roundBox(.085,.019,.012,.006),dark,[0,y,front+.009],[1,1,1],'ElectricPickup');
  solidMesh(g,roundBox(.090,.041,.010,.003),chrome,[0,-.144,front+.010],[1,1,1],'GuitarBridge');
  for(const[x,y]of[[.097,-.064],[.119,-.120],[.107,-.166]])ball(g,ivory,[x,y,front+.009],[.012,.012,.009],'GuitarControl');
 }else{solidMesh(g,new T.CylinderGeometry(.052,.052,.006,28),dark,[0,.048,front]).rotation.x=Math.PI/2;solidMesh(g,new T.TorusGeometry(.061,.003,6,28),ivory,[0,.048,front+.003]);solidMesh(g,roundBox(.10,.024,.013,.004),dark,[0,-.116,front]);}
 for(let i=0;i<6;i++){const x=(i-2.5)*.008;solidMesh(g,lineTube([[x,electric?-.154:-.119,front+.017],[x,.125,front+.017],[x,.626,.037],[x,.689+i*.01,.032]],.0008,3),chrome,[0,0,0],[1,1,1],'GuitarString');}
 for(let i=0;i<11;i++){const y=.145+(1-Math.exp(-i/8))*.53;solidMesh(g,roundBox(.058,.002,.002,.0005),chrome,[0,y,.035],[1,1,1],'GuitarFret');}
 for(const y of[.295,.383,.457,.520])ball(g,ivory,[0,y,.035],[.003,.003,.001],'GuitarFretDot');
 for(let i=0;i<6;i++){const y=.637+i*.019,x=-.043+(y-.637)*.16;const peg=solidMesh(g,new T.CylinderGeometry(.006,.006,.025,10),chrome,[x,y,.002]);peg.rotation.z=Math.PI/2;ball(g,chrome,[x-.012,y,.002],[.006,.010,.006],'GuitarTuner');}
 return g;
}
