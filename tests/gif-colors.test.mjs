import assert from 'node:assert/strict';
import test from 'node:test';
import {createGifColorMap} from '../dist/gif-colors.js';
function pixels(colors){return Uint8ClampedArray.from(colors.flat());}
function decoded(colors,indices){return [...indices].map(i=>colors.palette[i]);}
test('transparent GIF keeps all 96 neighboring dark shades and opaque black',()=>{
 const shades=Array.from({length:96},(_,i)=>[i,i,i,255]);
 const frame=pixels([[0,0,0,0],...shades,[250,249,247,255]]);
 const collector=createGifColorMap({transparent:true});collector.sample(frame);
 const colors=collector.finish(),indices=colors.mapFrame(frame);
 assert.equal(indices[0],colors.transparentIndex);assert.notEqual(indices[1],colors.transparentIndex);
 assert.deepEqual(decoded(colors,indices).slice(1),[...shades,[250,249,247,255]].map(c=>c.slice(0,3)));
});
test('full RGB values in the same former four-bit bucket stay distinct',()=>{
 const input=pixels([[48,47,46,255],[49,48,47,255],[50,49,48,255],[51,50,49,255],[63,133,144,255],[0,0,0,0]]);
 const collector=createGifColorMap({transparent:true});collector.sample(input);const colors=collector.finish();
 assert.equal(new Set(colors.mapFrame(input).slice(0,5)).size,5);
 assert.deepEqual(decoded(colors,colors.mapFrame(input)).slice(0,5),[[48,47,46],[49,48,47],[50,49,48],[51,50,49],[63,133,144]]);
});
test('shared animation palette preserves repeated tones and the GIF color limit',()=>{
 const colors=Array.from({length:2048},(_,i)=>[i%256,(i*7)%256,(i*13)%256,255]);
 const collector=createGifColorMap({transparent:true});collector.sample(pixels(colors));collector.sample(pixels(colors.slice().reverse()));
 const palette=collector.finish();assert.ok(palette.palette.length<=256);
 const repeated=pixels([[44,43,42,255],[72,70,68,255],[0,0,0,0]]),first=palette.mapFrame(repeated);
 assert.deepEqual(palette.mapFrame(repeated),first);assert.equal(first[2],0);
});
