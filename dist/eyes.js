import * as T from './vendor/three.module.js';

// Original vector features. Compensate for the face atlas's unequal X/Y scale
// so circles stay round on the mesh, rather than becoming flattened ovals.
export function drawEye(ctx,s,baseX,side){
 const style=side&&s.independentEyes?s.rightExpression:s.expression;
 const color=side&&s.oddEyes?s.rightEyeColor:s.eyeColor;
 const ink=new T.Color(color).lerp(new T.Color('#151516'),.3).getStyle();
 const x=64+(baseX-64)*(s.eyeSpacing??1),y=43+(s.eyeY??0)*48;
 const size=s.eyeSize,stretch=s.eyeStretch??1,aspect=820/369/(128/96);
 const w=24*size,h=26*size*aspect*stretch,l=x-w/2,top=y-h/2;
 ctx.save();ctx.translate(x,y);ctx.scale(size,size*aspect*stretch);
 ctx.rotate((s.eyeTilt??0)*Math.PI/180*(side?-1:1));
 ctx.lineCap='round';ctx.lineJoin='round';
 const oval=(rx,ry,c=ink,cx=0,cy=0)=>{ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(cx,cy,rx,ry,0,0,Math.PI*2);ctx.fill();};
 const path=(points,c=ink,width=2.5,fill=false)=>{ctx.beginPath();points.forEach(([a,b],i)=>i?ctx.lineTo(a,b):ctx.moveTo(a,b));if(fill){ctx.closePath();ctx.fillStyle=c;ctx.fill();}else{ctx.strokeStyle=c;ctx.lineWidth=width;ctx.stroke();}};
 const curve=(a,b,c,d,width=2.5,col=ink)=>{ctx.beginPath();ctx.moveTo(...a);ctx.bezierCurveTo(...b,...c,...d);ctx.strokeStyle=col;ctx.lineWidth=width;ctx.stroke();};
 const star=(r=12,inner=.45)=>Array.from({length:10},(_,i)=>{const a=-Math.PI/2+i*Math.PI/5,rr=i%2?r*inner:r;return[Math.cos(a)*rr,Math.sin(a)*rr];});
 const scribble=(rx=10,ry=11)=>{
  ctx.save();ctx.beginPath();ctx.ellipse(0,0,rx,ry,0,0,Math.PI*2);ctx.clip();
  // A reproducible set of slightly uneven pen strokes, with the paper showing
  // between them. These gaps are transparent, never painted highlights.
  for(let i=0;i<18;i++){
   const yy=-ry-2+i*1.55,wiggle=Math.sin(i*2.7+side*.9);
   curve([-rx-3,yy+2.2],[-rx*.35,yy+wiggle],[rx*.4,yy+1.5-wiggle],[rx+3,yy-2.6],1.12+(i%4)*.15);
  }
  for(let i=0;i<8;i++){
   const xx=-rx+1+i*rx*.28,bend=Math.sin(i*1.9+side)*2;
   curve([xx-3,-ry-3],[xx+bend,-ry*.3],[xx-bend+1,ry*.4],[xx+4,ry+3],.8+(i%3)*.18);
  }
  ctx.restore();ctx.beginPath();ctx.ellipse(0,0,rx,ry,-.045,0,Math.PI*2);ctx.strokeStyle=ink;ctx.lineWidth=1.15;ctx.stroke();
 };
 const openEye=(rx=12,ry=9)=>{
  scribble(rx*.63,ry*.88);curve([-rx*.73,-ry*.62],[-rx*.2,-ry*.98],[rx*.3,-ry*.85],[rx*.66,-ry*.4],1.6);
 };
 const lidEye=(tilt=0)=>{
  ctx.save();ctx.rotate(tilt);
  ctx.beginPath();ctx.moveTo(-12,-1);ctx.lineTo(12,-1);ctx.bezierCurveTo(12,14,-12,14,-12,-1);ctx.closePath();ctx.fillStyle=ink;ctx.fill();
  path([[-14,-2],[13,-2]],ink,3);ctx.restore();
 };
 switch(style){
  case 'basic':oval(7.3,10.5);break;
  case 'glossy':scribble();break;
  case 'sparkle':scribble(10.5,12.5);break;
  case 'bead':scribble(5.5,6.5);break;
  case 'dot':oval(3.6,3.6);break;
  case 'shy':lidEye();break;
  case 'angry':lidEye(side?-.17:.17);break;
  case 'down':lidEye(side?.16:-.16);break;
  case 'happy':curve([-10,3],[-6,-9],[6,-9],[10,3],3.2);break;
  case 'sleepy':curve([-10,-2],[-5,5],[5,5],[10,-2],2.7);break;
  case 'squint':path(side?[[9,-7],[-3,0],[9,7]]:[[-9,-7],[3,0],[-9,7]],ink,3);break;
  case 'line':path([[-9,0],[9,0]],ink,3);break;
  case 'button':ctx.beginPath();ctx.ellipse(0,0,8,8.5,0,0,Math.PI*2);ctx.strokeStyle=ink;ctx.lineWidth=1.7;ctx.stroke();for(const a of[-2.3,2.3])for(const b of[-2.3,2.3])oval(1.2,1.2,ink,a,b);break;
  case 'hollow':ctx.beginPath();ctx.ellipse(0,0,6.3,6.9,0,0,Math.PI*2);ctx.strokeStyle=ink;ctx.lineWidth=1.35;ctx.stroke();break;
  case 'spiral':path(Array.from({length:65},(_,i)=>{const a=i*.24,r=i/64*11;return[Math.cos(a)*r,Math.sin(a)*r];}),ink,2);break;
  case 'heart':ctx.beginPath();ctx.moveTo(0,11);ctx.bezierCurveTo(-21,-3,-8,-18,0,-8);ctx.bezierCurveTo(8,-18,21,-3,0,11);ctx.fillStyle=color;ctx.fill();break;
  case 'star':path(star(),color,1,true);break;
  case 'diamond':path([[0,-12],[9,0],[0,12],[-9,0]],color,1,true);break;
  case 'teary':scribble(7.4,8.8);ctx.fillStyle='#93c1d3';ctx.beginPath();ctx.moveTo(side?9:-9,6);ctx.bezierCurveTo(side?13:-13,10,side?12:-12,14,side?9:-9,13);ctx.bezierCurveTo(side?6:-6,13,side?6:-6,10,side?9:-9,6);ctx.fill();break;
  case 'wink':if(side||s.independentEyes)curve([-10,3],[-5,-7],[5,-7],[10,3],3);else scribble(7.2,8.7);break;
  case 'slit':oval(2.5,7.2);curve([-5,-4],[-2,-7],[2,-7],[5,-4],1.6);break;
  case 'cross':path([[-8,-8],[8,8]],ink,3);path([[8,-8],[-8,8]],ink,3);break;
  case 'soft':oval(8.5,8.3);break;
  case 'constellation':ctx.beginPath();ctx.moveTo(-9,3);ctx.quadraticCurveTo(0,-10,9,3);ctx.quadraticCurveTo(0,-3,-9,3);ctx.fillStyle=ink;ctx.fill();break;
 }
 ctx.restore();return{x,y,color,w,h,l,top};
}
