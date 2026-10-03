import * as T from './vendor/three.module.js';
import {faceTexture} from './face.js';
import {paintHeadPattern} from './patterns.js';
import {paintHeadShade} from './face-details.js';

export function paintHeadTexture(canvas,s){
 const ctx=canvas.getContext('2d');ctx.clearRect(0,0,canvas.width,canvas.height);ctx.fillStyle=s.bodyColor;ctx.fillRect(0,0,1024,1024);
 paintHeadPattern(ctx,s,([x,y])=>[(x+1)*512,1024-(y-.6)*512]);
 paintHeadShade(ctx,s,([x,y])=>[(x+1)*512,1024-(y-.6)*512]);
 const face=faceTexture(s);ctx.imageSmoothingEnabled=s.filter!=='retro';ctx.drawImage(face.image,102,592,820,369);face.dispose();
 // Rear skull vertices use this reserved strip; facial shading stays on the face.
 ctx.fillStyle=s.bodyColor;ctx.fillRect(0,0,1024,32);
 if(s.facePattern==='split'){ctx.save();ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(1024,0);ctx.lineTo(1024,32);ctx.lineTo(0,32);ctx.closePath();ctx.clip();paintHeadPattern(ctx,s,([x,y])=>[(x+1)*512,1024-(y-.6)*512]);ctx.restore();}
 // Solid ear UV swatch, separate from the skull and face paint.
 ctx.fillStyle=s.earSeparate?s.earColor:s.bodyColor;ctx.fillRect(976,976,48,48);
}
export function headTexture(s){const canvas=document.createElement('canvas');canvas.width=canvas.height=1024;paintHeadTexture(canvas,s);const texture=new T.CanvasTexture(canvas);texture.name='face.png';texture.colorSpace=T.SRGBColorSpace;texture.magFilter=s.filter==='retro'?T.NearestFilter:T.LinearFilter;texture.minFilter=T.LinearFilter;return texture;}
