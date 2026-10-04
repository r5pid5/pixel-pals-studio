import test from 'node:test';
import assert from 'node:assert/strict';
import {EditHistory,editingState,sceneSettings} from '../dist/studio-editor.js';

test('the normal editor reads the selected friend while retaining shared scene settings',()=>{
 const main={name:'Main',head:1,glasses:false,motion:'sleepSprawl',speed:1.2,filter:'soft',background:'transparent'},friend={name:'Friend',head:1.3,glasses:true,motion:'idle',speed:.8,filter:'retro',background:'solid'};
 const result=editingState(main,friend);
 assert.equal(result.name,'Friend');assert.equal(result.head,1.3);assert.equal(result.glasses,true);
 for(const key of ['motion','speed','filter','background'])assert.equal(result[key],main[key]);
 assert.equal(friend.motion,'idle');assert.equal(main.glasses,false);assert.equal(editingState(main,null),main);
 for(const key of ['clothing','accessoryTransforms','dessertBase','name','expression','head','bodyColor'])assert.ok(!sceneSettings.has(key));
});
test('undo and redo are isolated for each friend and the main character',()=>{
 const history=new EditHistory();history.remember(1,{glasses:false},{glasses:true});history.remember(2,{clothing:'none'},{clothing:'pajamas'});history.remember('main',{name:'A'},{name:'B'});
 assert.deepEqual(history.undo(1),{glasses:false});assert.equal(history.for(2).past.length,1);assert.equal(history.for('main').past.length,1);
 assert.deepEqual(history.redo(1),{glasses:true});history.forget(1);assert.equal(history.for(1).past.length,0);
});
test('history stores only changed fields and clones accessory transforms',()=>{
 const history=new EditHistory(),before={name:'Friend',head:1,accessoryTransforms:{glasses:{y:0}}},after={...before,accessoryTransforms:{glasses:{y:.2}}};history.remember(1,before,after);after.accessoryTransforms.glasses.y=3;
 assert.deepEqual(history.undo(1),{accessoryTransforms:{glasses:{y:0}}});assert.deepEqual(history.redo(1),{accessoryTransforms:{glasses:{y:.2}}});
});
test('new edits clear only that target’s redo; each target retains at most 60 edits',()=>{
 const history=new EditHistory();for(let i=0;i<80;i++)history.remember(1,{head:i},{head:i+1});assert.equal(history.for(1).past.length,60);
 history.remember(2,{head:1},{head:2});history.undo(2);history.undo(1);history.remember(1,{head:79},{head:70});assert.equal(history.for(1).future.length,0);assert.equal(history.for(2).future.length,1);
});
