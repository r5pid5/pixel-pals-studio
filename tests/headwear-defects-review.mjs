import {writeFile} from 'node:fs/promises';import assert from 'node:assert/strict';import {connect} from './cdp.mjs';
const before=process.argv.includes('--before'),tag=process.argv.find(v=>v.startsWith('--tag='))?.slice(6),c=await connect();assert.ok(!tag||/^[a-z0-9-]+$/.test(tag));
try{
 await c.send('Page.navigate',{url:'http://127.0.0.1:4178/'});for(let i=0;i<200;i++){if(await c.evaluate('!!window.pixelPals?.getAvatar()'))break;await new Promise(r=>setTimeout(r,50));}
 const data=await c.evaluate(`(async()=>{
  const T=await import('./vendor/three.module.js'),{buildAvatar,defaults,poseAvatar,disposeAvatar}=await import('./avatar.js'),{clothingPatch}=await import('./clothing-options.js'),{createStudioLighting,applyStudioLighting}=await import('./lighting.js');
  const r=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});r.setSize(400,460);r.outputColorSpace=T.SRGBColorSpace;r.toneMapping=T.ACESFilmicToneMapping;const scene=new T.Scene();scene.background=new T.Color('#f3f0e9');applyStudioLighting(createStudioLighting(scene),{...defaults,shadeStrength:.4});const camera=new T.OrthographicCamera(-1.24,1.24,1.426,-1.426,.1,30),pages=[];
  const sets=[
   [['후드 · 아래 정면',{...clothingPatch('hoodieUp')},0,'below'],['후드 · 아래 옆',{...clothingPatch('hoodieUp')},1.15,'below'],['후드 · 아래 뒤',{...clothingPatch('hoodieUp')},Math.PI,'below'],['후드 · 작은 머리',{...clothingPatch('hoodieUp'),head:.75},.4,'front']],
   [['잠옷 모자 · 정면',{sleepCap:true},0,'head'],['잠옷 모자 · 옆',{sleepCap:true},1.25,'head'],['잠옷 모자 · 뒤',{sleepCap:true},Math.PI,'head'],['잠옷 모자 · 위',{sleepCap:true},.4,'above']],
   [['후드 · 정면',clothingPatch('hoodieUp'),0,'front'],['후드 · 옆',clothingPatch('hoodieUp'),1.2,'front'],['후드 · 뒤',clothingPatch('hoodieUp'),Math.PI,'front'],['후드 · 큰 머리',{...clothingPatch('hoodieUp'),head:1.3},.4,'front']],
   ...['round','square','sunglasses','dropSunglasses','tearRound','tearSquare'].map((style,i)=>[[['원형','사각','선글라스','물방울 선글라스','눈물 원형','눈물 사각'][i]+' · 정면',{glasses:true,glassesStyle:style},0,'face'],['옆',{glasses:true,glassesStyle:style},1.1,'face'],['안경 단독',{glasses:true,glassesStyle:style},.8,'frameOnly']])
  ];
  for(let p=0;p<sets.length;p++){const cells=sets[p],canvas=document.createElement('canvas');canvas.width=cells.length*400;canvas.height=496;const ctx=canvas.getContext('2d');ctx.fillStyle='#f3f0e9';ctx.fillRect(0,0,canvas.width,canvas.height);
   for(let i=0;i<cells.length;i++){const[label,patch,angle,view]=cells[i],a=buildAvatar({...defaults,expression:'basic',tail:'none',hoodEarMode:'outside',...patch});scene.add(a.root);poseAvatar(a,'still',0);a.root.rotation.y=angle;
    if(view==='frameOnly'){const visible=new Set();a.root.getObjectByName('Accessory-glasses').traverse(m=>{if(m.isMesh)visible.add(m);});a.root.traverse(m=>{if(m.isMesh)m.visible=visible.has(m);});}
    camera.up.set(0,1,0);const face=view==='face'||view==='frameOnly';camera.left=face?-1.12:patch.head>1?-1.75:-1.24;camera.right=-camera.left;camera.top=(camera.right-camera.left)/2*460/400;camera.bottom=-camera.top;
    if(view==='below'){camera.position.set(0,-3,6);camera.lookAt(0,1.1,0);}else if(view==='above'){camera.position.set(0,6,4);camera.lookAt(0,2.10,0);}else{camera.position.set(0,face?1.5:2.6,7);camera.lookAt(0,view==='head'?2.1:face?1.43:patch.head>1?1.45:1.30,0);}
    camera.updateProjectionMatrix();r.render(scene,camera);ctx.drawImage(r.domElement,i*400,0);ctx.font='19px sans-serif';ctx.fillStyle='#776758';ctx.textAlign='center';ctx.fillText(label,i*400+200,483);scene.remove(a.root);disposeAvatar(a);
   }pages.push(canvas.toDataURL().split(',')[1]);
  }r.dispose();r.forceContextLoss();return pages;
 })()`);
 for(let i=0;i<data.length;i++)await writeFile('tests/artifacts/headwear-'+(tag??(before?'before':'after'))+'-'+i+'.png',Buffer.from(data[i],'base64'));
 assert.equal(c.events.filter(e=>e.method==='Runtime.exceptionThrown').length,0);console.log('Below/side/back/top hood and sleep cap, plus front/side views of all six glasses; exceptions: 0');
}finally{c.close();}
