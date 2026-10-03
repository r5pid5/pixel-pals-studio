export const eyebrowOptions=[['none','없음'],['soft','완만한 곡선'],['short','짧은 둥근 눈썹'],['arch','둥근 아치'],['straight','일자'],['tapered','얇아지는 곡선'],['thick','도톰한 눈썹'],['sharp','도도한 눈썹'],['sad','처진 눈썹']];
export function drawEyebrow(ctx,s,eye,side){
 if(s.eyebrow==='none')return;
 const direction=side?-1:1,x=eye.x-direction*(s.eyebrowGap??0)*40,y=eye.top-8+(s.eyebrowY??0)*40,size=s.eyebrowSize??1;
 ctx.save();ctx.translate(x,y);ctx.scale(direction*size,size);ctx.fillStyle=ctx.strokeStyle=s.eyebrowColor;ctx.lineCap='round';ctx.lineJoin='round';ctx.lineWidth=2.1;
 ctx.beginPath();
 switch(s.eyebrow){
  case 'soft':ctx.moveTo(-10,1.3);ctx.bezierCurveTo(-4,-1.8,4,-1.8,10,1.3);break;
  case 'short':ctx.moveTo(-5,.4);ctx.quadraticCurveTo(0,-.7,5,.4);ctx.lineWidth=2.6;break;
  case 'arch':ctx.moveTo(-10,3);ctx.bezierCurveTo(-5,-4.5,4,-4.5,10,2.3);break;
  case 'straight':ctx.moveTo(-10,.4);ctx.bezierCurveTo(-3,-.4,4,-.4,10,.4);break;
  case 'sharp':ctx.moveTo(-10,-2.5);ctx.bezierCurveTo(-4,-2.1,4,.7,10,3.3);ctx.lineWidth=2.7;break;
  case 'sad':ctx.moveTo(-10,3.7);ctx.bezierCurveTo(-3,1.4,3,-1.7,10,-1.9);break;
  case 'tapered':ctx.moveTo(-10,1.8);ctx.bezierCurveTo(-7,-1.1,3,-3.5,10,-.1);ctx.bezierCurveTo(4,-1.1,-3,.1,-7,2.5);ctx.quadraticCurveTo(-10,4,-10,1.8);ctx.closePath();ctx.fill();ctx.restore();return;
  case 'thick':ctx.moveTo(-9.8,1.4);ctx.bezierCurveTo(-5,-3.5,4,-3.5,10,.6);ctx.quadraticCurveTo(11.3,2.1,9.2,3);ctx.bezierCurveTo(3.4,.4,-3.5,.4,-8,3.6);ctx.quadraticCurveTo(-11,4.7,-9.8,1.4);ctx.closePath();ctx.fill();ctx.restore();return;
 }
 ctx.stroke();ctx.restore();
}
