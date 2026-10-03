import {connect} from './cdp.mjs';
import {writeFile} from 'node:fs/promises';
const c=await connect();
try{
 const data=await c.evaluate(`(async()=>{
  const T=await import('./vendor/three.module.js'),{defaults,buildAvatar,poseAvatar,disposeAvatar}=await import('./avatar.js');
  const canvas=document.createElement('canvas'),renderer=new T.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true});renderer.setSize(660,840,false);renderer.setPixelRatio(1.5);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
  const scene=new T.Scene();scene.background=new T.Color('#222526');const camera=new T.OrthographicCamera(-1.15,1.15,1.47,-1.47,.1,30);camera.position.set(1.5,1.85,8);camera.lookAt(0,1.18,0);
  scene.add(new T.HemisphereLight('#ffffff','#626569',1.05));for(const[color,power,position]of[['#ffffff',2.8,[-3,5,4]],['#c4c9ce',.8,[3,2,-2]]]){const l=new T.DirectionalLight(color,power);l.position.set(...position);scene.add(l);}
  const a=buildAvatar({...defaults,glasses:true,glassesStyle:'square',bodyColor:'#d8dadb',accentColor:'#cbd0d2',blush:false,halo:false});
  a.root.traverse(o=>{if(!o.isMesh)return;for(const m of Array.isArray(o.material)?o.material:[o.material]){m.map=null;m.color.set(o.userData.role==='glasses'?'#edeff0':'#d8dadb');m.roughness=.53;m.metalness=o.userData.role==='glasses'?.18:0;m.needsUpdate=true;}});
  poseAvatar(a,'wave',.25);a.root.rotation.z=-.09;scene.add(a.root);renderer.render(scene,camera);const result=canvas.toDataURL('image/png').split(',')[1];disposeAvatar(a);renderer.dispose();return result;
 })()`);
 await writeFile('tests/artifacts/sculpt-clay.png',Buffer.from(data,'base64'));
 console.log('Saved actual character geometry with a neutral inspection material.');
}finally{c.close();}
