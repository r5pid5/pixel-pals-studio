import {drawEyebrow} from './eyebrows.js';
import * as T from './vendor/three.module.js';
import {drawEye} from './eyes.js';
import {drawMouth} from './mouths.js';
import {drawBlush} from './blush.js';
import {drawFaceDetail} from './face-details.js';
import {drawLashes} from './eyelashes.js';
import {paintMuzzle} from './patterns.js';
export function faceTexture(s){const c=document.createElement('canvas');c.width=256;c.height=192;const ctx=c.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.scale(2,2);function px(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}function line(points,color,width=2){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();}function circle(x,y,r,color){ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,r,r*.75,0,0,Math.PI*2);ctx.fill();}
 if(s.muzzle){ctx.fillStyle=s.muzzleColor;paintMuzzle(ctx,([x,y])=>[((x+1)*512-102)*128/820,(1024-(y-.6)*512-592)*96/369],s.muzzleSize);}

 // Scars belong below the eyes, lashes, blush and mouth in the paint stack.
 for(const scar of s.scars??[]){ctx.save();ctx.translate(scar.x*128,scar.y*96);ctx.rotate(scar.angle*Math.PI/180);const unit=scar.size/.14,len=scar.size*128*(scar.width??1),height=3*unit*(scar.height??1),color=scar.color;line([[-len/2,0],[len/2,0]],color,2*unit*(scar.height??1));if(scar.type==='stitch')for(let x=-len/2+2;x<len/2;x+=5)line([[x,-height],[x,height]],color,unit);if(scar.type==='cross')line([[0,-height*3],[0,height*3]],color,2*unit);if(scar.type==='double')line([[-len/2,height*1.4],[len/2,height*1.4]],color,2*unit);ctx.restore();}
 for(const[baseX,side]of[[30,0],[92,1]]){const {x,y,color,w,h,l,top}=drawEye(ctx,s,baseX,side);
 drawLashes(ctx,s,{x,y,w,h,top,color},side);drawEyebrow(ctx,s,{x,top},side);
 drawBlush(ctx,s,x);}

 drawMouth(ctx,s);const mc=s.mouthColor;
 drawFaceDetail(ctx,s,{includeShade:false});
 // Compensate for the head atlas's unequal horizontal/vertical face scales.
 for(const dot of s.dots??[]){ctx.fillStyle=dot.color;ctx.beginPath();ctx.ellipse(dot.x*128,dot.y*96,dot.size*128,dot.size*128*(820/128)/(369/96),0,0,Math.PI*2);ctx.fill();}const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;tex.magFilter=T.NearestFilter;tex.minFilter=T.NearestFilter;tex.name='face.png';return tex;}
