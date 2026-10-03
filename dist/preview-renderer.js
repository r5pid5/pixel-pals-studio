import * as T from './vendor/three.module.js';
import {defaults,buildAvatar,disposeAvatar} from './avatar.js';
import {clothingOptions,clothingPatch} from './clothing-options.js';
import {patternOptions} from './patterns.js';
import {speciesOptions,tailOptions} from './options.js';
import {accessoryOptions,accessoryPatch,clearAccessories} from './accessories.js';

export function previewEntries(prefix){return [...clothingOptions.map(([id])=>['clothing-'+id,clothingPatch(id)]),...patternOptions.map(([v])=>['pattern-'+v,{species:'none',tail:'none',facePattern:v,patternColor:'#ab927b',bodyColor:'#eee5d5',expression:'basic',eyeSize:1,blush:false}]),...speciesOptions.map(([v])=>['species-'+v,{species:v,tail:'none'}]),...tailOptions.map(([v])=>['tail-'+v,{tail:v,tailSize:1.15}]),...accessoryOptions.map(a=>['accessory-'+a.id,accessoryPatch(a)])].filter(([id])=>id.startsWith(prefix+'-'));}

export async function renderPreviewBatch(lights,exposure,prefix,ids,emit,pause){
 const canvas=document.createElement('canvas'),renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:true});renderer.setSize(100,116,false);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=exposure;
 const scene=new T.Scene();for(const light of lights){const copy=light.clone();copy.castShadow=false;scene.add(copy);}const camera=new T.OrthographicCamera(-1.65,1.65,1.914,-1.914,.1,30);camera.position.set(2,2.1,8);camera.lookAt(0,1.30,0);
 if(prefix==='pattern'){camera.position.set(0,1.48,6);camera.lookAt(0,1.48,0);camera.left=-1.09;camera.right=1.09;camera.top=1.264;camera.bottom=-1.264;}
 if(prefix==='tail'){camera.position.set(4,1.7,-6);camera.lookAt(.25,.68,-.10);camera.left=-1.05;camera.right=1.55;camera.top=1.508;camera.bottom=-1.508;}camera.updateProjectionMatrix();
 try{for(const [id,patch]of previewEntries(prefix)){
  if(!ids.includes(id))continue;await pause();const avatar=buildAvatar({...defaults,...clearAccessories,motion:'still',...patch});scene.add(avatar.root);
  try{if(prefix==='pattern')avatar.root.traverse(o=>{if(o.isMesh&&o!==avatar.face)o.visible=false;});renderer.render(scene,camera);await emit(id,canvas);}finally{scene.remove(avatar.root);disposeAvatar(avatar);}
 }}finally{renderer.dispose();renderer.forceContextLoss();}
}
