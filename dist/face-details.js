export const faceDetailOptions=[['none','없음'],['whiskers','고양이 수염'],['rabbitWhiskers','토끼 수염'],['moustache','아저씨 콧수염'],['dadBeard','아빠 수염'],['shade','졸린 그늘'],['sweat','땀방울'],['wrinkle','고민 주름'],['surprise','놀람'],['angry','화남']];
export const whiskerStyles=new Set(['whiskers','rabbitWhiskers','moustache','dadBeard']);
export function faceDecorationSelection(s){return s.faceDecorations?.length?s.faceDecorations:s.faceDeco&&s.faceDeco!=='none'?[s.faceDeco]:[];}
export function drawFaceDetail(ctx,s,{includeShade=true}={}){for(const kind of faceDecorationSelection(s))if(includeShade||kind!=='shade')drawSingleDetail(ctx,{...s,faceDeco:kind});}
export function paintHeadShade(ctx,s,xy){
 if(!faceDecorationSelection(s).includes('shade'))return;
 const opacity=s.shadeOpacity??.25,softness=s.shadeSoftness??.75,color=s.shadeColor??'#514859',shift=s.shadeY??0;
 if(!opacity)return;
 const tint=a=>color+Math.round(a*opacity*255).toString(16).padStart(2,'0');
 ctx.save();
 // The lower boundary dips under the cheeks and rises gently over the muzzle.
 // Thin adjacent strips share a smooth fade, without a rectangle across the face.
 for(let column=0;column<512;column++){
  const x=(column+.5)/256-1;
  const edge=1.04+.09*Math.cos(Math.PI*x/.63)+.18*Math.pow(Math.abs(x),4)+shift;
  const[,top]=xy([x,2.75]),[,bottom]=xy([x,edge]);
  const height=bottom-top,feather=Math.min(.8,(.025+.28*softness)/(2.75-edge)),g=ctx.createLinearGradient(0,top,0,bottom);
  g.addColorStop(0,tint(1));g.addColorStop(.45,tint(.90));g.addColorStop(1-feather,tint(.65));g.addColorStop(1,tint(0));
  ctx.fillStyle=g;ctx.fillRect(column*2,top,2,height);
 }
 ctx.restore();
}
function drawSingleDetail(ctx,s){
 const kind=s.faceDeco;if(kind==='none')return;ctx.save();ctx.strokeStyle=ctx.fillStyle=whiskerStyles.has(kind)?s.whiskerColor:s.faceDecoColor;ctx.lineCap='round';ctx.lineJoin='round';ctx.lineWidth=1.5;
 const path=fn=>{ctx.beginPath();fn();ctx.stroke();};
 if(kind==='whiskers')for(const side of[-1,1])for(const dy of[-5,0,5])path(()=>{ctx.moveTo(64+side*44,67+dy*.5);ctx.quadraticCurveTo(64+side*50,67+dy,64+side*58,66+dy*1.2);});
 if(kind==='rabbitWhiskers'){ctx.lineWidth=1.2;for(const side of[-1,1])for(const dy of[-3.5,0,3.5])path(()=>{ctx.moveTo(64+side*35,68+dy*.35);ctx.quadraticCurveTo(64+side*42,68+dy*.75,64+side*49,68+dy);});}
 if(['moustache','dadBeard'].includes(kind))for(const side of[-1,1]){ctx.beginPath();ctx.moveTo(64,61);ctx.bezierCurveTo(64+side*2,56,64+side*8,57,64+side*10,59);ctx.quadraticCurveTo(64+side*12,60,64+side*15,57);ctx.bezierCurveTo(64+side*13,66,64+side*4,66,64,61);ctx.fill();}
 if(kind==='dadBeard'){ctx.beginPath();ctx.moveTo(58,75);ctx.quadraticCurveTo(64,79,70,75);ctx.quadraticCurveTo(69,84,64,83);ctx.quadraticCurveTo(59,84,58,75);ctx.fill();}
 if(kind==='shade'){const opacity=s.shadeOpacity??.25,color=s.shadeColor??'#514859',alpha=Math.round(opacity*255).toString(16).padStart(2,'0'),g=ctx.createLinearGradient(0,0,0,61);g.addColorStop(0,color+alpha);g.addColorStop(1,color+'00');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(8,0);ctx.lineTo(120,0);ctx.lineTo(120,55);ctx.bezierCurveTo(90,72,78,56,64,56);ctx.bezierCurveTo(48,56,38,72,8,55);ctx.closePath();ctx.fill();}
 if(kind==='sweat'){ctx.beginPath();ctx.moveTo(109,26);ctx.bezierCurveTo(108,30,101,37,105,41);ctx.bezierCurveTo(110,47,116,39,112,34);ctx.quadraticCurveTo(110,30,109,26);ctx.fill();ctx.globalAlpha=.5;ctx.strokeStyle='#fff9f0';ctx.lineWidth=1;path(()=>{ctx.moveTo(107,35);ctx.quadraticCurveTo(105,38,107,40);});}
 if(kind==='wrinkle'){for(const side of[-1,1])path(()=>{ctx.moveTo(64+side*5,26);ctx.quadraticCurveTo(64+side*3,23,64+side*4,20);});}
 if(kind==='surprise'){for(const[x,y,h]of[[57,18,8],[64,16,10],[71,18,8]]){path(()=>{ctx.moveTo(x,y);ctx.lineTo(x,y+h);});ctx.beginPath();ctx.ellipse(x,y+h+3,.9,.9,0,0,Math.PI*2);ctx.fill();}}
 if(kind==='angry'){ctx.lineWidth=1.8;for(const[dx,dy,sx,sy]of[[-1,-1,-1,-1],[1,-1,1,-1],[-1,1,-1,1],[1,1,1,1]])path(()=>{ctx.moveTo(108+dx*2,23+dy*6);ctx.quadraticCurveTo(108+dx*2,23+dy*2,108+sx*6,23+sy*2);});}
 ctx.restore();
}
