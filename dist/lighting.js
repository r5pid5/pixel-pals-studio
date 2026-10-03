import * as T from './vendor/three.module.js';
export function createStudioLighting(scene){
 const ambient=new T.AmbientLight('#ffffff',0),hemi=new T.HemisphereLight('#ffffff','#9d9181',.95),key=new T.DirectionalLight('#fffaf2',2.35),fill=new T.DirectionalLight('#efe9e0',.75);
 key.position.set(-3,8,4);fill.position.set(4,3,-2);scene.add(ambient,hemi,key,fill);return{ambient,hemi,key,fill};
}
export function applyStudioLighting(rig,s){
 const strength=s.shading===false?0:s.shadeStrength??.25,sunset=s.filter==='sunset';
 rig.ambient.intensity=2.8*(1-strength);rig.hemi.intensity=.95*strength;
 rig.key.color.set(sunset?'#ffd6ad':'#fffaf2');rig.fill.color.set(sunset?'#daa6d9':'#efe9e0');
 rig.key.intensity=(s.filter==='lowpoly'?2.65:2.35)*strength;rig.fill.intensity=.75*strength;
}
