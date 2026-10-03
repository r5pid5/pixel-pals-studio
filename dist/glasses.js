import * as T from './vendor/three.module.js';
import {addDesignerFrames,designerGlasses} from './designer-glasses.js';

// This is the original glasses model, used by every style. Only its two front
// rims/lenses change; the bridge, straight temples and placement stay identical.
export function addGlasses(head,s,{y=0,z=0}={}){
 const frame=new T.MeshStandardMaterial({color:s.glassesColor,roughness:.82,metalness:0,flatShading:s.filter==='lowpoly'});frame.userData.colorSetting='glassesColor';
 const add=(geometry,material,position,name)=>{const mesh=new T.Mesh(geometry,material);mesh.position.set(position[0],position[1]+y,position[2]+z);mesh.name=name;mesh.castShadow=true;mesh.receiveShadow=true;mesh.userData.role='glasses';head.add(mesh);return mesh;};
 if(designerGlasses.has(s.glassesStyle))addDesignerFrames(s,frame,add);
 else for(const x of[-.42,.42]){
  if(s.glassesStyle==='square'){const width=.60,height=.38,t=.018;for(const y of[-height/2,height/2])add(new T.BoxGeometry(width,t,t),frame,[x,y-.03,.53],'GlassesFrame');for(const side of[-1,1])add(new T.BoxGeometry(t,height,t),frame,[x+side*width/2,-.03,.53],'GlassesFrame');}
  else{const rim=add(new T.TorusGeometry(.31,.027,4,12),frame,[x,-.03,.53],'GlassesFrame');rim.scale.y=.81;}
 }
 add(new T.BoxGeometry(.23,.018,.025),frame,[0,-.015,.53],'GlassesBridge');
 for(const side of[-1,1])add(new T.BoxGeometry(.018,.018,.46),frame,[side*.73,.04,.3],'GlassesTemple');
}
