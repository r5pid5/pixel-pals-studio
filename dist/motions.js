import {poseSocial,socialMotionNames} from './social-motion.js';
export const motionNames={float:'둥실둥실',wave:'안녕, 친구',dance:'살랑 춤',walk:'총총 걷기',spin:'빙글빙글',hop:'폴짝폴짝',bob:'고개 까딱',sway:'좌우 살랑',peek:'두리번두리번',stretch:'기지개',flutter:'파닥파닥',retro:'레트로 뚝딱',...socialMotionNames,still:'멈춰 있기'};
export const motionSymbols={float:'☁',wave:'✋',dance:'♫',walk:'⌁',spin:'↻',hop:'⌃',bob:'◡',sway:'≈',peek:'◉',stretch:'↟',flutter:'⋈',retro:'▣',picnicDrink:'☕',picnicEat:'◉',picnicChat:'♧',readTogether:'▤',guitarPlay:'♫',laptopWork:'▰',highFive:'✋',toast:'♬',musicListen:'♪',syringeHold:'♢',still:'Ⅱ'};
export function poseMotion(a,motion,time,speed=1){
 for(const b of a.bones){b.position.copy(b.userData.restPosition);b.quaternion.copy(b.userData.restQuaternion);}
 const b=a.bones,t=time*speed,p=t*Math.PI/3,s=Math.sin(p),c=Math.cos(p),step=Math.sin(p*2);
 poseSocial(a,motion,t);
 if(motion==='float'){b[1].position.y+=.13+.095*s;b[1].position.x+=.025*Math.sin(p*.5);b[5].rotation.z+=.065*Math.sin(p+.35);b[7].rotation.z+=.13+.075*step;b[11].rotation.z-=.13+.075*step;b[14].rotation.x+=.07*c;b[17].rotation.x-=.07*c;}
 if(motion==='wave'){b[10].position.z+=.16;b[11].rotation.z-=1.85+.20*Math.sin(p*4);b[11].rotation.x-=.35;b[12].rotation.x-=.55;b[13].rotation.z+=.28*Math.sin(p*4+.4);b[5].rotation.z+=.08;b[1].position.y+=.018*(1-c);}
 if(motion==='dance'){b[1].position.y+=.045*(1-Math.cos(p*4));b[2].rotation.z+=.14*step;b[5].rotation.z-=.10*step;b[7].rotation.z+=.65+.35*Math.sin(p*2+.3);b[11].rotation.z-=.65+.35*Math.sin(p*2-.3);b[14].rotation.x+=.22*step;b[17].rotation.x-=.22*step;}
 if(motion==='walk'){b[14].rotation.x+=.42*Math.sin(p*4);b[17].rotation.x-=.42*Math.sin(p*4);b[7].rotation.x-=.30*Math.sin(p*4);b[11].rotation.x+=.30*Math.sin(p*4);b[1].position.y+=.012*(1-Math.cos(p*8));b[5].rotation.z+=.03*Math.sin(p*4);}
 if(motion==='spin'){b[1].rotation.y+=p;b[7].rotation.z+=.8;b[11].rotation.z-=.8;b[1].position.y+=.03*(1-c);}
 if(motion==='hop'){const h=.5-.5*Math.cos(p*3);b[1].position.y+=h*.32;b[7].rotation.z+=h*.55;b[11].rotation.z-=h*.55;b[15].rotation.x-=h*.23;b[18].rotation.x-=h*.23;b[5].rotation.x+=.04*Math.sin(p*3);}
 if(motion==='bob'){b[5].rotation.x+=.18*step;b[1].position.y+=.014*(1-Math.cos(p*4));b[7].rotation.z+=.055*step;b[11].rotation.z-=.055*step;}
 if(motion==='sway'){b[1].position.x+=.065*s;b[2].rotation.z+=.10*s;b[5].rotation.z-=.09*s;b[7].rotation.z+=.10*c;b[11].rotation.z-=.10*c;}
 if(motion==='peek'){b[5].rotation.y+=.40*s;b[5].rotation.z+=.04*step;b[2].rotation.y+=.055*s;}
 if(motion==='stretch'){const h=.5-.5*c;b[7].rotation.z+=h*2.25;b[11].rotation.z-=h*2.25;b[5].rotation.x-=h*.13;b[1].position.y+=h*.05;}
 if(motion==='flutter'){b[1].position.y+=.11+.055*s;b[7].rotation.z+=.9+.30*Math.sin(p*5);b[11].rotation.z-=.9+.30*Math.sin(p*5);b[5].rotation.z+=.045*step;}
 // Deliberately quantized poses are confined to the retro option.
 if(motion==='retro'){const frame=Math.floor(t*8),phase=(frame%16)/16*Math.PI*2,leg=Math.round(Math.sin(phase)*2)/2;b[14].rotation.x+=.4*leg;b[17].rotation.x-=.4*leg;b[7].rotation.x-=.32*leg;b[11].rotation.x+=.32*leg;b[1].position.y+=(frame%2)*.025;b[5].rotation.z+=(frame%4<2?1:-1)*.035;}
}
