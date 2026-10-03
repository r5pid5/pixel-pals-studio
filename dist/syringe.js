import * as T from './vendor/three.module.js';
import {solidMesh,roundBox,wearableMaterial} from './wearable-meshes.js';
export function addSyringe(spine,s){
 const g=new T.Group();g.name='Syringe';g.position.set(-.10,-.12,.50);g.rotation.z=1.22;spine.add(g);
 const barrel=wearableMaterial(s,'syringeColor'),metal=wearableMaterial(s,null,'#c2cbd0',{roughness:.38,metalness:.25}),white=wearableMaterial(s,null,'#e8eceb'),blue=wearableMaterial(s,null,'#9cc3cd'),marks=wearableMaterial(s,null,'#657784');
 solidMesh(g,new T.CylinderGeometry(.105,.105,.61,18),barrel,[0,0,0],[1,1,1],'SyringeBarrel');
 solidMesh(g,roundBox(.124,.44,.014,.012),white,[0,-.003,.103]);solidMesh(g,roundBox(.093,.28,.007,.004),blue,[0,-.071,.114]);
 for(let i=0;i<7;i++)solidMesh(g,roundBox(i%2?.028:.046,.006,.004,.002),marks,[.024,-.207+i*.061,.121]);
 for(const y of[-.307,.307])solidMesh(g,new T.CylinderGeometry(.119,.119,.035,18),white,[0,y,0]);
 solidMesh(g,roundBox(.423,.051,.131,.022),metal,[0,-.328,0],[1,1,1],'SyringeFingerFlange');
 solidMesh(g,new T.CylinderGeometry(.035,.050,.096,14),white,[0,.365,0]);solidMesh(g,new T.CylinderGeometry(.012,.012,.32,10),metal,[0,.573,0],[1,1,1],'SyringeNeedle');solidMesh(g,new T.ConeGeometry(.012,.035,10),metal,[0,.750,0]);
 solidMesh(g,new T.CylinderGeometry(.033,.033,.265,12),metal,[0,-.472,0]);solidMesh(g,new T.CylinderGeometry(.13,.13,.033,18),white,[0,-.620,0],[1,1,.84],'SyringeThumbRest');
 return g;
}
