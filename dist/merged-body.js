import * as T from './vendor/three.module.js';
import {bodyGeometry} from './body-sculpt.js';
const cache=new Map();
// Combine vertices in their original bind coordinates. No simplification.
export function mergedBody(s,separateArms=false){
 const coverage=!s.clothing||s.clothing==='none'?'none':['tee','raglan','uniform','overalls','sailor','apron'].includes(s.clothing)?'short':'long';
 const trouserCoverage=s.clothing==='uniform'?'short':['pajamas','spacesuit','suit','prison','overalls'].includes(s.clothing)?'long':'none';
 const key=[s.detail,s.body,s.legs,coverage,trouserCoverage,separateArms].join('|');if(cache.has(key)){const g=cache.get(key);cache.delete(key);cache.set(key,g);return g.clone();}
 const out=new T.BufferGeometry(),arrays={},groups=[];let offset=0;
 for(const key of[3,12,15,8,10]){let g=bodyGeometry(key,s);if(g.index){const old=g;g=g.toNonIndexed();old.dispose();}for(const[name,attribute]of Object.entries(g.attributes)){(arrays[name]??=[]).push(attribute.array);}groups.push({start:offset,count:g.attributes.position.count,materialIndex:separateArms&&[8,10].includes(key)?1:0});offset+=g.attributes.position.count;g.dispose();}
 for(const[name,parts]of Object.entries(arrays)){const Type=parts[0].constructor,size=parts.reduce((n,p)=>n+p.length,0),values=new Type(size);let offset=0;for(const part of parts){values.set(part,offset);offset+=part.length;}out.setAttribute(name,new T.BufferAttribute(values,name==='skinIndex'||name==='skinWeight'?4: name==='uv'?2:3));}
 if(separateArms){out.addGroup(0,groups[2].start+groups[2].count,0);out.addGroup(groups[3].start,groups[3].count+groups[4].count,1);}
 out.computeBoundingBox();out.computeBoundingSphere();cache.set(key,out.clone());if(cache.size>12){const first=cache.keys().next().value;cache.get(first).dispose();cache.delete(first);}return out;
}
