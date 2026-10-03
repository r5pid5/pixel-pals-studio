import * as T from './vendor/three.module.js';
import {applyClothingFit} from './clothing.js';
export const accessoryKeys=['whippedCream','tail','hat','halo','horns','glasses','headset','wings','ribbon','hairClip','earrings','neckAccessory','bodyCostume','mug','tufts','clothing','sleepCap','spaceHelmet','guitar','burger','laptop','syringe'];
const names={WhippedCream:'whippedCream',Tail:'tail',Hat:'hat',Halo:'halo',Headset:'headset',Wings:'wings',Ribbon:'ribbon',HairClip:'hairClip',Earring:'earrings',Bandana:'neckAccessory',BurgerCostume:'bodyCostume',PumpkinCostume:'bodyCostume',MugCostume:'mug',Tufts:'tufts',SleepCap:'sleepCap',SpaceHelmet:'spaceHelmet',Guitar:'guitar',Burger:'burger',Laptop:'laptop',Syringe:'syringe'};
const pairs=new WeakMap();
function registerPair(group,key){
 let nodes=group.children,axis='x';
 if(key==='earrings'&&nodes.length===1&&nodes[0].userData.earCuffs){nodes=nodes[0].children;axis='y';}
 if(['wings','hairClip'].includes(key)){nodes=nodes[0]?.children??[];if(key==='hairClip')axis='y';}
 if(!['earrings','horns','ribbon','wings','hairClip'].includes(key)||nodes.length!==2)return;
 if(key==='ribbon'&&nodes.some(o=>o.name!=='Ribbon'))return;
 const center=(nodes[0].position[axis]+nodes[1].position[axis])/2;
 pairs.set(group,nodes.map((node,i)=>({node,axis,side:Math.sign(node.position[axis]-center)||(key==='wings'?Math.sign(node.scale.x):i?1:-1),position:node.position.clone()})));
}
const materialKeys={hornsColor:'horns',earringColor:'earrings',neckColor:'neckAccessory'};
export function groupAccessories(avatar,s){
 for(const bone of [avatar.root,...avatar.bones]){const buckets=new Map();for(const child of [...bone.children]){if(child.userData.accessoryKey)continue;const key=names[child.name]??(['glasses','headset','halo','ribbon'].includes(child.userData.role)?child.userData.role:null)??materialKeys[child.material?.userData?.colorSetting];if(!key)continue;if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(child);}
  for(const[key,children]of buckets){const group=new T.Group();group.name='Accessory-'+key;group.userData.accessoryKey=key;for(const child of children)group.position.add(child.position);group.position.divideScalar(children.length);bone.add(group);for(const child of children){child.position.sub(group.position);group.add(child);}group.userData.basePosition=group.position.clone();group.userData.baseScale=group.scale.clone();registerPair(group,key);}
 }
 applyAccessoryTransforms(avatar,s);
}
export function applyAccessoryTransforms(avatar,s){avatar.root.traverse(o=>{const key=o.userData.accessoryKey;if(!key)return;const t=s.accessoryTransforms?.[key]??{};if(o.userData.garmentFit){applyClothingFit(o,t);return;}o.position.copy(o.userData.basePosition).add(new T.Vector3(t.x??0,t.y??0,t.z??0));o.scale.copy(o.userData.baseScale).multiplyScalar(t.scale??1);o.rotation.z=(t.angle??0)*Math.PI/180;for(const p of pairs.get(o)??[]){p.node.position.copy(p.position);p.node.position[p.axis]+=p.side*(t.gap??0)/2;}});avatar.root.updateMatrixWorld(true);}
export function validateAccessoryTransforms(value){
 if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('액세서리 위치 설정이 올바르지 않습니다.');const out={};
 for(const[key,t]of Object.entries(value)){if(!accessoryKeys.includes(key)||!t||typeof t!=='object'||Array.isArray(t))throw new Error('액세서리 위치 설정이 올바르지 않습니다.');out[key]={};for(const[k,min,max,initial]of[['x',-3,3,0],['y',-3,3,0],['z',-3,3,0],['scale',.2,3,1],['angle',-180,180,0],['gap',-1.2,2,0]]){const v=t[k]??initial;if(typeof v!=='number'||!Number.isFinite(v)||v<min||v>max)throw new Error('액세서리 위치가 범위를 벗어났습니다.');out[key][k]=v;}}
 return out;
}
