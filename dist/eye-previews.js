import {drawEye} from './eyes.js';
export function eyePreview(state,expression){
 const canvas=document.createElement('canvas');canvas.width=168;canvas.height=128;
 const ctx=canvas.getContext('2d'),atlasAspect=820/369/(128/96);
 // Undo only the atlas compensation so this standalone icon matches the eye
 // painted on the character, without the head, blush or other face features.
 ctx.translate(84,64);ctx.scale(3,3/atlasAspect);ctx.translate(-30,-43);
 drawEye(ctx,{...state,expression,eyeColor:'#70606d',eyeSpacing:1,eyeY:0,eyeTilt:0,eyeSize:1,eyeStretch:1},30,0);
 return canvas.toDataURL('image/png');
}
