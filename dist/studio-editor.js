import {backgroundKeys} from './background-photo.js';

// Camera, playback and stage appearance belong to the shared scene. All other
// editor settings belong to the selected character.
export const sceneSettings=new Set([...backgroundKeys,'motion','speed','filter','shading','shadeStrength','shadows','floor']);
export function editingState(main,friend){
 if(!friend)return main;
 const state={...friend};
 for(const key of sceneSettings)state[key]=main[key];
 return state;
}
export function changedSettings(before,after){return Object.keys(after).filter(key=>JSON.stringify(before[key])!==JSON.stringify(after[key]));}
export class EditHistory{
 constructor(){this.targets=new Map();}
 for(target){if(!this.targets.has(target))this.targets.set(target,{past:[],future:[]});return this.targets.get(target);}
 remember(target,before,after){
  const keys=changedSettings(before,after);if(!keys.length)return;
  const entry={before:{},after:{}};
  for(const key of keys){entry.before[key]=structuredClone(before[key]);entry.after[key]=structuredClone(after[key]);}
  const history=this.for(target);history.past.push(entry);if(history.past.length>60)history.past.shift();history.future=[];
 }
 undo(target){const history=this.for(target),entry=history.past.pop();if(!entry)return null;history.future.push(entry);return structuredClone(entry.before);}
 redo(target){const history=this.for(target),entry=history.future.pop();if(!entry)return null;history.past.push(entry);return structuredClone(entry.after);}
 forget(target){this.targets.delete(target);}
}
