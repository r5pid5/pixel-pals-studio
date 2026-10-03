import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {connect} from './cdp.mjs';
const c=await connect(),sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function wait(expr){for(let i=0;i<300;i++){if(await c.evaluate(expr))return;await sleep(50);}throw Error('Timeout '+expr);}
async function drag(button,dx,dy){const p=await c.evaluate(`{const r=document.querySelector('#viewport').getBoundingClientRect();({x:r.left+r.width*.5,y:r.top+r.height*.45})}`);await c.send('Input.dispatchMouseEvent',{type:'mousePressed',x:p.x,y:p.y,button,buttons:button==='left'?1:2,clickCount:1});for(let i=1;i<=8;i++){await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',x:p.x+dx*i/8,y:p.y+dy*i/8,button,buttons:button==='left'?1:2});await sleep(25);}await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',x:p.x+dx,y:p.y+dy,button,buttons:0,clickCount:1});await sleep(900);}
try{
 await c.send('Emulation.setDeviceMetricsOverride',{width:1440,height:1100,deviceScaleFactor:1,mobile:false});await c.send('Page.navigate',{url:'http://127.0.0.1:4178/'});await wait('!!window.pixelPals?.getAvatar()');
 await c.evaluate(`document.querySelector('#play').click();document.querySelector('#camera-front').click();for(let i=0;i<20;i++)document.querySelector('#zoom-in').click();document.querySelector('#camera-pan').click();`);
 const before=await c.evaluate('window.pixelPals.getPerformance()');assert.equal(before.zoom,4);assert.equal(before.panMode,true);
 await drag('left',95,-65);const after=await c.evaluate('window.pixelPals.getPerformance()');assert.ok(Math.abs(after.target[0]-before.target[0])>.04,JSON.stringify({before,after}));assert.ok(Math.abs(after.target[1]-before.target[1])>.04,JSON.stringify({before,after}));assert.equal(after.zoom,4);
 await c.evaluate(`document.querySelector('#camera-pan').click()`);await drag('right',-70,40);const right=await c.evaluate('window.pixelPals.getPerformance()');assert.ok(Math.abs(right.target[0]-after.target[0])>.04,JSON.stringify({after,right}));assert.equal(right.panMode,false);
 await c.evaluate(`document.querySelector('#camera-front').click()`);await sleep(1000);const reset=await c.evaluate('window.pixelPals.getPerformance()');assert.equal(reset.zoom,1);reset.target.forEach((v,i)=>assert.ok(Math.abs(v-[0,1.30,0][i])<.01));
 await c.send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await c.evaluate(`document.querySelector('#camera-pan').click();document.querySelector('#zoom-in').click();`);await sleep(200);
 const p=await c.evaluate(`{const r=document.querySelector('#viewport').getBoundingClientRect();({x:r.left+r.width*.5,y:r.top+r.height*.45})}`),mobileBefore=await c.evaluate('window.pixelPals.getPerformance().target');
 await c.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:p.x,y:p.y}]});for(let i=1;i<=6;i++)await c.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:p.x+50*i/6,y:p.y-30*i/6}]});await c.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await sleep(1000);
 const mobileAfter=await c.evaluate('window.pixelPals.getPerformance().target');assert.ok(Math.abs(mobileBefore[0]-mobileAfter[0])>.1);
 const errors=c.events.filter(e=>e.method==='Runtime.exceptionThrown');assert.equal(errors.length,0,JSON.stringify(errors));const result={maxZoom:after.zoom,leftDragMoved:after.target,rightDragMoved:right.target,reset:true,mobileTouchPan:true,runtimeErrors:0};await writeFile('tests/artifacts/canvas-pan-results.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{c.close();}
