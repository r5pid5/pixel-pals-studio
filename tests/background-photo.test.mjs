import test from 'node:test';
import assert from 'node:assert/strict';
import {photoLayout,validBackgroundData,maxBackgroundDataLength} from '../dist/background-photo.js';
import {defaults} from '../dist/avatar.js';
import {validateState} from '../dist/mmd.js';
import {readProject} from '../dist/project-io.js';
import {enumRules} from '../dist/options.js';
import {zipSync,strToU8} from '../dist/vendor/fflate.module.js';
const pixel='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aS1sAAAAASUVORK5CYII=';
test('photo cover and contain preserve proportions and use the chosen crop alignment',()=>{
 assert.deepEqual(photoLayout(800,400,400,400,'cover',0,50),{x:0,y:0,width:800,height:400});
 assert.deepEqual(photoLayout(800,400,400,400,'cover',100,50),{x:-400,y:0,width:800,height:400});
 assert.deepEqual(photoLayout(800,400,400,400,'contain',50,80),{x:0,y:160,width:400,height:200});
 assert.deepEqual(photoLayout(200,800,400,400,'cover',50,100),{x:0,y:-1200,width:400,height:1600});
});
test('embedded photos validate independently of boolean settings and legacy projects keep no photo',()=>{
 const s=validateState({...defaults,background:'image',backgroundImage:pixel,backgroundImageName:'우리 사진.png',backgroundImageFit:'contain',backgroundImageX:30,backgroundImageY:80},defaults);
 assert.equal(s.backgroundImage,pixel);assert.equal(s.backgroundImageY,80);
 assert.equal(validateState({name:'이전 친구'},defaults).backgroundImage,'');
 assert.equal(validBackgroundData(''),true);
 for(const value of ['https://example.com/photo.jpg','data:image/svg+xml;base64,PHN2Zz4=','data:image/png;base64,???',42,'data:image/png;base64,'+'A'.repeat(maxBackgroundDataLength)])assert.equal(validBackgroundData(value),false);
 assert.throws(()=>validateState({...defaults,backgroundImageX:101},defaults));
});
test('JSON and ZIP project imports retain photos and every newly added studio motion',async()=>{
 const actors=enumRules.motion.slice(0,6).map((motion,i)=>({x:0,z:0,angle:0,scale:1,speed:1,motion,state:{...defaults,backgroundImage:pixel}}));
 const project={format:'pixel-pals',version:1,state:{...defaults,background:'image',backgroundImage:pixel},studio:{enabled:true,actors}};
 for(const motion of enumRules.motion){project.studio.actors[0].motion=motion;const data=JSON.stringify(project),json=await readProject({name:'photo.json',size:data.length,text:async()=>data});assert.equal(json.studio.actors[0].motion,motion);assert.equal(json.state.backgroundImage,pixel);}
 const zip=zipSync({'project.json':strToU8(JSON.stringify(project))});
 const parsed=await readProject({name:'photo.zip',size:zip.length,arrayBuffer:async()=>zip.buffer.slice(zip.byteOffset,zip.byteOffset+zip.byteLength)});
 assert.equal(parsed.state.backgroundImage,pixel);assert.equal(parsed.studio.actors[5].state.backgroundImage,pixel);
});
