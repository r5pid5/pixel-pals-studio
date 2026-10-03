export const mouthOptions=[['none','없음'],['cat','ω 미소'],['three','3 입'],['smile','방긋'],['flat','일자'],['open','활짝'],['round','오 입'],['pout','새침'],['fang','송곳니'],['tongue','메롱'],['zigzag','장난스런 입']];
export function drawMouth(ctx,s){
 if(s.mouth==='none')return;
 ctx.save();ctx.translate(64,65);ctx.strokeStyle=s.mouthColor;ctx.fillStyle=s.mouthColor;ctx.lineWidth=1.9;ctx.lineCap='round';ctx.lineJoin='round';
 const path=fn=>{ctx.beginPath();fn();ctx.stroke();};
 if(s.mouth==='cat')path(()=>{ctx.moveTo(-8,-2);ctx.bezierCurveTo(-7,4,-3,4,0,0);ctx.bezierCurveTo(3,4,7,4,8,-2);});
 if(s.mouth==='three')path(()=>{ctx.moveTo(-4,-5);ctx.bezierCurveTo(5,-7,7,-1,0,0);ctx.bezierCurveTo(8,1,5,8,-4,5);});
 if(s.mouth==='smile')path(()=>{ctx.moveTo(-6,-2);ctx.quadraticCurveTo(0,7,6,-2);});
 if(s.mouth==='flat')path(()=>{ctx.moveTo(-5,0);ctx.lineTo(5,0);});
 if(s.mouth==='round')path(()=>ctx.ellipse(0,0,3.4,4.2,0,0,Math.PI*2));
 if(s.mouth==='pout')path(()=>{ctx.moveTo(-5,2);ctx.quadraticCurveTo(0,-4,5,2);});
 if(s.mouth==='open'){ctx.beginPath();ctx.moveTo(-6,-3);ctx.quadraticCurveTo(0,0,6,-3);ctx.quadraticCurveTo(4,7,0,7);ctx.quadraticCurveTo(-4,7,-6,-3);ctx.closePath();ctx.fill();ctx.fillStyle='#e4a3ad';ctx.beginPath();ctx.ellipse(0,4,2.8,1.3,0,0,Math.PI*2);ctx.fill();}
 if(s.mouth==='fang'){path(()=>{ctx.moveTo(-7,-2);ctx.quadraticCurveTo(0,4,7,-2);});ctx.beginPath();ctx.moveTo(1,1);ctx.lineTo(3,6);ctx.lineTo(5,0);ctx.closePath();ctx.fillStyle='#fff8ed';ctx.fill();ctx.lineWidth=1;ctx.stroke();}
 if(s.mouth==='tongue'){path(()=>{ctx.moveTo(-6,-3);ctx.quadraticCurveTo(0,3,6,-3);});ctx.fillStyle='#d99ba9';ctx.beginPath();ctx.moveTo(-2,0);ctx.lineTo(-2,4);ctx.quadraticCurveTo(1,9,4,4);ctx.lineTo(4,0);ctx.closePath();ctx.fill();}
 if(s.mouth==='zigzag')path(()=>{ctx.moveTo(-7,1);ctx.lineTo(-3,-2);ctx.lineTo(0,2);ctx.lineTo(3,-2);ctx.lineTo(7,1);});
 // Old saved projects retain their small nose-only expression.
 if(s.mouth==='nose'){ctx.beginPath();ctx.ellipse(0,-3,2,1.5,0,0,Math.PI*2);ctx.fill();}
 ctx.restore();
}
