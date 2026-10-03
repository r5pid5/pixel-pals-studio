import {resetIceCreamMotion} from './ice-cream-motion.js';
import {paintHeadTexture} from './head-texture.js';
import {updateMotionPropColors} from './social-motion.js';
import {resetSleepMotion} from './sleep-motion.js';
export const faceSettings=new Set(['shadeOpacity','shadeSoftness','shadeY','patternX','patternY','patternWidth','patternHeight','lashX','lashY','lashSize','lashTilt','expression','rightExpression','independentEyes','oddEyes','mouth','eyeSize','eyeY','eyeSpacing','eyeStretch','eyeTilt','eyelashes','eyebrow','eyebrowSize','eyebrowY','eyebrowGap','muzzle','muzzleSize','facePattern','faceDeco','faceDecorations','blush','blushStyle','blushSize','blushOpacity','dots','scars']);
const headColors=new Set(['shadeColor','bodyColor','earColor','eyeColor','rightEyeColor','mouthColor','muzzleColor','patternColor','blushColor','eyebrowColor','faceDecoColor','whiskerColor']);
export function updateAvatarColors(avatar,s,changed=Object.keys(s)){
 resetIceCreamMotion(avatar);resetSleepMotion(avatar);
 updateMotionPropColors(avatar,s);
 const seen=new Set();avatar.root.traverse(o=>{if(!o.isMesh)return;for(const m of Array.isArray(o.material)?o.material:[o.material]){if(seen.has(m))continue;seen.add(m);const key=m.userData.colorSetting;if(key){m.color.set(s[key]);if(m.userData.colorScale)m.color.multiplyScalar(m.userData.colorScale);}}});
 if(changed.some(k=>headColors.has(k)||faceSettings.has(k))){const texture=avatar.face.material.map;paintHeadTexture(texture.image,s);texture.needsUpdate=true;}
 avatar.root.userData.pixelPals.state={...s};
}
