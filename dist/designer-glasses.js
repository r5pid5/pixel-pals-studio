import * as T from './vendor/three.module.js';
export const designerGlasses=new Set(['sunglasses','dropSunglasses','tearRound','tearSquare']);
export function addDesignerFrames(s,frame,add){
 const style=s.glassesStyle,lens=new T.MeshStandardMaterial({color:'#282733',roughness:.3}),shine=new T.MeshStandardMaterial({color:'#9d9fad',roughness:.6});
 function outline(width,height,side){const w=width/2,h=height/2,sh=new T.Shape();
  if(style==='dropSunglasses'){
   sh.moveTo(-w,h*.48);sh.bezierCurveTo(-w*1.03,-h*.08,-w*.67,-h*.96,-w*.12,-h);sh.bezierCurveTo(w*.59,-h*1.05,w,-h*.27,w,h*.48);sh.bezierCurveTo(w*.67,h*1.02,-w*.63,h*.95,-w,h*.48);
  }else if(style==='tearRound'){
   sh.moveTo(w,0);sh.bezierCurveTo(w,h*.56,w*.56,h,0,h);sh.bezierCurveTo(-w*.56,h,-w,h*.56,-w,0);sh.bezierCurveTo(-w,-h*.56,-w*.56,-h,0,-h);
   if(side>0){sh.bezierCurveTo(w*.10,-h,w*.18,-h,w*.18,-h-.029);sh.bezierCurveTo(w*.18,-h-.080,w*.45,-h-.078,w*.45,-h-.027);sh.bezierCurveTo(w*.45,-h*.90,w,-h*.56,w,0);}else sh.bezierCurveTo(w*.56,-h,w,-h*.56,w,0);
  }else{
   const r=.055;sh.moveTo(-w+r,h);sh.lineTo(w-r,h);sh.quadraticCurveTo(w,h,w,h-r);sh.lineTo(w,-h+r);sh.quadraticCurveTo(w,-h,w-r,-h);
   if(style==='tearSquare'&&side>0){sh.lineTo(w*.59,-h);sh.quadraticCurveTo(w*.48,-h,w*.48,-h-.029);sh.bezierCurveTo(w*.48,-h-.084,w*.19,-h-.080,w*.19,-h-.024);sh.quadraticCurveTo(w*.18,-h,0,-h);}
   sh.lineTo(-w+r,-h);sh.quadraticCurveTo(-w,-h,-w,-h+r);sh.lineTo(-w,h-r);sh.quadraticCurveTo(-w,h,-w+r,h);
  }sh.closePath();return sh;
 }
 const tinted=style==='sunglasses'||style==='dropSunglasses',width=.60,height=style==='tearRound'?.50:style==='dropSunglasses'?.45:.38,radius=tinted?.020:style==='tearRound'?.022:.013,center=.42;
 // A rigid, independent pair of rims and lenses sits in front of the face.
 // Their geometry never conforms to the character's skin surface.
 for(const side of[-1,1]){
  const shape=outline(width,height,side),points=shape.getSpacedPoints(160);if(points[0].distanceTo(points.at(-1))<1e-8)points.pop();
  const path=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(p.x,p.y,0)),true,'centripetal');
  const rim=add(new T.TubeGeometry(path,Math.max(96,points.length*2),radius,8,true),frame,[side*center,-.03,.53],'GlassesFrame');rim.userData.smoothAccessory=true;
  if(tinted){
   const geometry=new T.ExtrudeGeometry(shape,{depth:.008,bevelEnabled:false,curveSegments:24});add(geometry,lens,[side*center,-.03,.518],'GlassesLens').userData.smoothAccessory=true;
   const path=new T.LineCurve3(new T.Vector3(-.095,.060,0),new T.Vector3(-.045,.076,0));add(new T.TubeGeometry(path,4,.0025,6),shine,[side*center,-.03,.529],'GlassesReflection').userData.smoothAccessory=true;
  }
 }
}
