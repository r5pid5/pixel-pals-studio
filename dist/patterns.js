export const patternOptions=[['none','무늬 없이'],['forehead','이마 줄무늬'],['cheeks','볼 포인트'],['spots','작은 반점'],['mask','눈 주변 마스크'],['muzzle','입 주변 포인트'],['roundMuzzle','동그란 입 주변'],['split','반쪽 컬러']];
function brush(ctx,xy){return{move:(x,y)=>ctx.moveTo(...xy([x,y])),curve:(a,b,c,d,e,f)=>ctx.bezierCurveTo(...xy([a,b]),...xy([c,d]),...xy([e,f])),line:(x,y)=>ctx.lineTo(...xy([x,y]))};}
export function paintMuzzle(ctx,xy,scale=1){
 const map=([x,y])=>xy([x*scale,.95+(y-.95)*scale]),{move,curve}=brush(ctx,map);
 ctx.beginPath();move(-.54,.94);
 curve(-.53,1.09,-.35,1.16,-.23,1.12);curve(-.12,1.09,-.10,1.04,0,1.04);
 curve(.10,1.04,.12,1.09,.23,1.12);curve(.35,1.16,.53,1.09,.54,.94);
 curve(.59,.80,.47,.60,.30,.58);curve(.12,.52,-.12,.52,-.30,.58);
 curve(-.47,.60,-.59,.80,-.54,.94);ctx.closePath();ctx.fill();
}
export function paintHeadPattern(ctx,s,xy){
 const mode=s.facePattern;if(mode==='none')return;
 const center={forehead:1.88,cheeks:1.1,spots:1.35,mask:1.15,muzzle:.95,roundMuzzle:1.04,split:1.4}[mode];
 const map=([x,y])=>xy([x*(s.patternWidth??1)+(s.patternX??0),center+(y-center)*(s.patternHeight??1)+(s.patternY??0)]);
 ctx.save();ctx.fillStyle=s.patternColor;
 const{move,curve,line}=brush(ctx,map),fill=fn=>{ctx.beginPath();fn();ctx.closePath();ctx.fill();};
 if(mode==='muzzle')paintMuzzle(ctx,map);
 if(mode==='roundMuzzle'){
  // Draw in model coordinates so the head atlas cannot squash the circle.
  fill(()=>{const k=.55228475,r=.22;move(0,1.04+r);curve(k*r,1.04+r,r,1.04+k*r,r,1.04);curve(r,1.04-k*r,k*r,1.04-r,0,1.04-r);curve(-k*r,1.04-r,-r,1.04-k*r,-r,1.04);curve(-r,1.04+k*r,-k*r,1.04+r,0,1.04+r);});
 }
 if(mode==='split')fill(()=>{move(-3,5);line(0,5);curve(.045,2.1,-.045,1.8,0,1.45);curve(.045,1.16,-.035,.84,0,-2);line(-3,-2);});
 if(mode==='forehead'){
  fill(()=>{move(0,2.13);curve(-.15,2.08,-.11,1.78,0,1.62);curve(.11,1.78,.15,2.08,0,2.13);});
  for(const side of[-1,1]){const b=brush(ctx,([x,y])=>map([side*x,y]));fill(()=>{b.move(.24,2.12);b.curve(.18,1.99,.25,1.78,.35,1.72);b.curve(.40,1.86,.39,2.04,.33,2.13);});}
 }
 if(mode==='cheeks')for(const side of[-1,1]){const b=brush(ctx,([x,y])=>map([side*x,y]));fill(()=>{b.move(1.07,1.40);b.curve(.83,1.41,.62,1.13,.67,.98);b.curve(.71,.81,.91,.72,1.09,.81);b.curve(1.16,1.02,1.16,1.23,1.07,1.40);});}
 if(mode==='mask')fill(()=>{
  move(-.85,1.22);curve(-.80,1.44,-.51,1.47,-.31,1.35);curve(-.17,1.28,-.13,1.25,0,1.25);
  curve(.13,1.25,.17,1.28,.31,1.35);curve(.51,1.47,.80,1.44,.85,1.22);
  curve(.96,1.04,.78,.86,.57,.87);curve(.37,.85,.22,1.02,0,1.04);
  curve(-.22,1.02,-.37,.85,-.57,.87);curve(-.78,.86,-.96,1.04,-.85,1.22);
 });
 if(mode==='spots')for(const[x,y,rx,ry,tilt]of[[-.58,1.63,.13,.17,-.24],[.53,1.75,.15,.12,.35],[.76,1.04,.09,.13,.24],[-.70,.96,.10,.07,-.15]]){
  const b=brush(ctx,([a,b])=>map([x+rx*(a*Math.cos(tilt)-b*Math.sin(tilt)),y+ry*(a*Math.sin(tilt)+b*Math.cos(tilt))]));
  fill(()=>{b.move(-.80,.36);b.curve(-1.14,-.34,-.38,-1.08,.20,-.91);b.curve(.98,-.82,1.07,.03,.63,.67);b.curve(.23,1.10,-.57,.95,-.80,.36);});
 }
 ctx.restore();
}
