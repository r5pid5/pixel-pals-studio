import * as T from './vendor/three.module.js';
export const lashOptions=[['none','없음'],['upper','위쪽 살짝'],['lower','아래쪽 살짝'],['both','위아래'],['outer','꼬리 세 가닥'],['fan','부채 세 가닥']];
export function drawLashes(ctx,s,eye,side){
 if(s.eyelashes==='none')return;
 const{x,y,color}=eye,scale=s.lashSize??1,d=side?1:-1,aspect=820/369/(128/96),style=side&&s.independentEyes?s.rightExpression:s.expression;
 const radii={basic:[7.3,10.5],glossy:[10,11],sparkle:[10.5,12.5],bead:[5.5,6.5],dot:[3.6,3.6],button:[8,8.5],hollow:[6.3,6.9],teary:[7.4,8.8],slit:[2.5,7.2],soft:[8.5,8.3],heart:[10,11],star:[10,11],diamond:[9,12],cross:[8,8],wink:side||s.independentEyes?[10,6]:[7.2,8.7]};
 const[rx,ry]=radii[style]??[10,11],lid=['shy','angry','down'].includes(style),line=['line','happy','sleepy','constellation','squint'].includes(style)||style==='wink'&&(side||s.independentEyes);
 ctx.save();ctx.translate(x+d*(s.lashX??0)*40,y+(s.lashY??0)*40);
 ctx.scale(s.eyeSize,s.eyeSize*aspect*(s.eyeStretch??1));
 const tilt=(s.lashTilt??0)+(s.eyeTilt??0),lidTilt=style==='angry'?(side?-.17:.17):style==='down'?(side?.16:-.16):0;
 ctx.rotate(tilt*(side?-1:1)*Math.PI/180+lidTilt);ctx.strokeStyle=new T.Color(color).lerp(new T.Color('#151516'),.3).getStyle();ctx.lineCap='round';
 const root=(u,lower=false)=>{
  const px=d*rx*u;
  if(lid)return[px,lower?10*(1-u*u):-1.5];
  if(line){const v=style==='sleepy'?3.25-5.25*u*u:style==='line'?0:-6+9*u*u;return[px,v];}
  return[px,(lower?1:-1)*ry*Math.sqrt(1-u*u)];
 };
 // Short straight strokes keep the same thickness from root to rounded tip.
 const flick=(px,py,dx,dy,width=1.3)=>{
  ctx.lineWidth=width*scale;
  ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px+dx*scale,py+dy*scale);ctx.stroke();
 };
 if(['upper','both'].includes(s.eyelashes))for(const[u,length]of[[.55,3.4],[.83,4.3]])flick(...root(u),d*length*.60,-length);
 if(['lower','both'].includes(s.eyelashes))for(const[u,length]of[[.56,2.3],[.82,2.8]])flick(...root(u,true),d*length*.55,length,.95);
 if(s.eyelashes==='outer')for(const[u,dx,dy]of[[.78,3.4,-3.4],[.93,4.1,-2.0],[.99,4.0,-.4]])flick(...root(u),d*dx,dy,1.25);
 if(s.eyelashes==='fan')for(const u of[-.56,0,.56])flick(...root(u),d*u*3.2,-4.6,1.2);
 ctx.restore();
}
