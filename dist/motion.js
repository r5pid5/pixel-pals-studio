import Lenis from './vendor/lenis.mjs';
const reduced=matchMedia('(prefers-reduced-motion: reduce)');let lenis;
if(!reduced.matches){lenis=new Lenis({duration:.75,smoothWheel:true,prevent:node=>!!node.closest?.('.editor,#stage,input,select,textarea,dialog')});function frame(t){lenis?.raf(t);if(lenis)requestAnimationFrame(frame);}requestAnimationFrame(frame);window.gsap?.from('.intro',{y:8,opacity:0,duration:.45,ease:'power2.out',clearProps:'all'});window.gsap?.from('.workspace',{y:12,duration:.65,ease:'power2.out',clearProps:'all'});}
const cleanup=()=>{lenis?.destroy();lenis=null;};reduced.addEventListener('change',e=>{if(e.matches)cleanup();});addEventListener('pagehide',cleanup,{once:true});
