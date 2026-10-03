import {drawEye} from './eyes.js';
import {drawLashes} from './eyelashes.js';
export function lashPreview(state,eyelashes){
 const canvas=document.createElement('canvas');canvas.width=168;canvas.height=104;
 const ctx=canvas.getContext('2d'),aspect=820/369/(128/96);
 ctx.translate(84,52);ctx.scale(1.15,1.15/aspect);ctx.translate(-61,-43);
 const s={...state,expression:'basic',independentEyes:false,oddEyes:false,eyeColor:'#70606d',eyeSize:1,eyeStretch:1,eyeTilt:0,eyeSpacing:1,eyeY:0,eyelashes,lashSize:1,lashX:0,lashY:0,lashTilt:0};
 for(const[x,side]of[[30,0],[92,1]])drawLashes(ctx,s,drawEye(ctx,s,x,side),side);
 return canvas.toDataURL('image/png');
}
