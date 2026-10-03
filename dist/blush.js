export const blushOptions=[['none','없음'],['lines','빗금'],['circle','동그라미'],['blur','보송'],['heart','하트'],['freckles','깨알'],['oval','타원'],['circlelines','동그라미 빗금']];
export function drawBlush(ctx,s,x){
 if(!s.blush||s.blushStyle==='none')return;ctx.save();ctx.globalAlpha=s.blushOpacity;ctx.fillStyle=s.blushColor;ctx.strokeStyle=s.blushColor;ctx.lineWidth=1.8;ctx.lineCap='round';const r=8*s.blushSize,y=66;
 const ellipse=(cx,cy,rx,ry)=>{ctx.beginPath();ctx.ellipse(cx,cy,rx,ry,0,0,Math.PI*2);ctx.fill();};
 if(['circle','circlelines'].includes(s.blushStyle))ellipse(x,y,r,r*.72);
 if(s.blushStyle==='oval')ellipse(x,y,r*1.15,r*.46);
 if(s.blushStyle==='blur'){const g=ctx.createRadialGradient(x,y,0,x,y,r*1.25);g.addColorStop(0,s.blushColor);g.addColorStop(1,s.blushColor+'00');ctx.fillStyle=g;ellipse(x,y,r*1.25,r*.9);}
 if(['lines','circlelines'].includes(s.blushStyle)){if(s.blushStyle==='circlelines')ctx.globalAlpha=Math.min(1,s.blushOpacity+.2);for(const d of[-1,0,1]){ctx.beginPath();ctx.moveTo(x+d*r*.52-1,y-r*.32);ctx.lineTo(x+d*r*.52+1,y+r*.32);ctx.stroke();}}
 if(s.blushStyle==='heart'){ctx.beginPath();ctx.moveTo(x,y+r*.7);ctx.bezierCurveTo(x-r*1.1,y,x-r*.7,y-r*.85,x,y-r*.2);ctx.bezierCurveTo(x+r*.7,y-r*.85,x+r*1.1,y,x,y+r*.7);ctx.fill();}
 if(s.blushStyle==='freckles')for(const[dx,dy,size]of[[-.7,-.1,.14],[0,-.3,.16],[.65,.03,.15],[-.25,.45,.12]])ellipse(x+dx*r,y+dy*r,r*size,r*size);
 ctx.restore();
}
