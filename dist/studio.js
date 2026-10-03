import {createSharedBlanket} from './social-motion.js';
import {createGrassPatch,sleepMotions,sleepFootprint} from './sleep-motion.js';
import {motionNames} from './motions.js';
import * as T from './vendor/three.module.js';
import {facetMesh} from './surface.js';
import {buildAvatar,disposeAvatar,poseAvatar} from './avatar.js';
import {applyVMD} from './mmd.js';import{readProject}from'./project-io.js';import{icon}from'./icons.js';
let api,enabled=false,actors=[],selected=-1,id=0,sharedBlanket,sharedGrass;
const $=s=>document.querySelector(s);
const motionLabels={shared:'같은 모션',...motionNames};
export function initStudio(value){api=value;sharedBlanket=createSharedBlanket();sharedBlanket.visible=false;api.getScene()?.add(sharedBlanket);sharedGrass=createGrassPatch();sharedGrass.visible=false;api.getScene()?.add(sharedGrass);const nav=$('.editor-tabs');nav.insertAdjacentHTML('beforeend',`<button class="editor-tab" id="tab-studio" data-tab="studio" role="tab" aria-selected="false" aria-controls="panel-studio" tabindex="-1">${icon('layers')}함께</button>`);$('.editor-content').insertAdjacentHTML('beforeend',`<section id="panel-studio" class="tab-panel" role="tabpanel" aria-labelledby="tab-studio" hidden><div class="control-heading"><h3>함께하는 작은 무대</h3><span id="studio-count">0 / 6</span></div><p class="panel-note">만든 친구들을 한 무대에 모아보세요.</p><label class="advanced-check"><input type="checkbox" id="studio-enabled">함께하는 무대 켜기</label><div class="studio-add"><button id="studio-add-current" class="secondary-button">현재 친구 추가</button><button id="studio-import" class="secondary-button">파일에서 추가</button></div><input type="file" id="studio-files" accept=".json,.glb,.zip" multiple hidden><div class="formation-row"><button data-formation="line">나란히</button><button data-formation="v">V자</button><button data-formation="circle">동그랗게</button><button data-formation="picnic">마주앉기</button><button id="studio-sync">동시에 시작</button></div><div id="studio-actors"></div><div id="actor-settings" hidden><div class="control-section"><h3>선택한 친구의 자리</h3><label class="advanced-field"><span>이름</span><input id="actor-name" maxlength="36"></label><label class="advanced-field"><span>움직임</span><select id="actor-motion">${Object.entries(motionLabels).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select></label>${[['x','가로 위치',-3,3,.05],['z','앞뒤 위치',-2,2,.05],['angle','바라보는 방향',-180,180,1],['scale','크기',.5,1.4,.01],['speed','움직임 속도',.4,2,.1]].map(([key,label,min,max,step])=>`<label class="advanced-field range-field"><span>${label}<output id="actor-${key}-value"></output></span><input type="range" data-actor-range="${key}" min="${min}" max="${max}" step="${step}" aria-label="${label}"></label>`).join('')}</div></div><div class="control-section"><h3>모두 함께 촬영하기</h3><p class="panel-note">현재 카메라와 필터를 그대로 담습니다.</p><button class="secondary-button full-width" id="studio-record">${icon('record')}함께 모션 녹화</button><button class="text-button" id="studio-record-settings">촬영 시간과 배경 설정</button></div></section>`);
$('#studio-enabled').addEventListener('change',e=>setEnabled(e.target.checked));$('#studio-add-current').addEventListener('click',()=>addActor(api.getState()));$('#studio-import').addEventListener('click',()=>$('#studio-files').click());$('#studio-files').addEventListener('change',async e=>{for(const file of e.target.files){try{const p=await readProject(file);addActor(p.state);}catch(error){api.toast(error.message);}}e.target.value='';});document.querySelectorAll('[data-formation]').forEach(b=>b.addEventListener('click',()=>formation(b.dataset.formation)));$('#studio-sync').addEventListener('click',()=>{actors.forEach(a=>a.phase=0);api.syncTime();api.toast('모든 친구의 모션을 함께 시작했어요.');});$('#studio-actors').addEventListener('click',e=>{const select=e.target.closest('[data-actor-id]');if(select){selected=Number(select.dataset.actorId);syncStudio();}const remove=e.target.closest('[data-remove-actor]');if(remove){const i=actors.findIndex(a=>a.id===Number(remove.dataset.removeActor));const a=actors[i];if(a){api.getScene().remove(a.group);disposeAvatar(a.avatar);actors.splice(i,1);if(selected===a.id)selected=actors[0]?.id??-1;syncStudio();}}});$('#actor-name').addEventListener('change',e=>{const a=actors.find(x=>x.id===selected);if(a){a.state.name=e.target.value||'친구';syncStudio();}});$('#actor-motion').addEventListener('change',e=>{const a=actors.find(x=>x.id===selected);if(a)a.motion=e.target.value;});document.querySelectorAll('[data-actor-range]').forEach(el=>el.addEventListener('input',()=>{const a=actors.find(x=>x.id===selected);if(a){a[el.dataset.actorRange]=Number(el.value);position(a);syncRanges(a);}}));$('#studio-record').addEventListener('click',()=>api.record());$('#studio-record-settings').addEventListener('click',()=>api.selectTab('motion'));syncStudio();}
function setEnabled(on){enabled=on;if(!on){sharedBlanket.visible=false;sharedGrass.visible=false;}if(on&&actors.length===0)addActor(api.getState());if(api.getAvatar())api.getAvatar().root.visible=!enabled;actors.forEach(a=>a.group.visible=enabled);syncStudio();api.adjustCamera(enabled);}
function addActor(s,props={}){if(actors.length>=6){api.toast('한 무대에는 최대 6명의 친구를 놓을 수 있어요.');return;}const state=structuredClone(s),avatar=buildAvatar(state),group=new T.Group();group.add(avatar.root);group.visible=enabled;const actor={id:++id,state,avatar,group,x:0,z:0,angle:0,scale:.82,motion:'shared',speed:1,phase:0,...props};actors.push(actor);api.getScene().add(group);selected=actor.id;if(Object.keys(props).length)position(actor);else formation('line');syncStudio();}
function formation(kind){const n=actors.length;actors.forEach((a,i)=>{if(kind==='line'){a.x=(i-(n-1)/2)*1.55;a.z=0;a.angle=0;}if(kind==='v'){a.x=(i-(n-1)/2)*1.5;a.z=Math.abs(i-(n-1)/2)*.55;a.angle=0;}if(kind==='picnic'){a.x=(i-(n-1)/2)*1.34;a.z=Math.abs(i-(n-1)/2)*.10;a.angle=a.x<0?18:a.x>0?-18:0;}if(kind==='circle'){const t=i/n*Math.PI*2;a.x=Math.cos(t)*Math.min(2.2,n*.45);a.z=Math.sin(t)*Math.min(1.4,n*.30);a.angle=-t*180/Math.PI-90;while(a.angle< -180)a.angle+=360;}a.x=T.MathUtils.clamp(a.x,-3,3);a.z=T.MathUtils.clamp(a.z,-2,2);position(a);});syncStudio();}
function position(a){api?.requestRender?.();a.group.position.set(a.x,0,a.z);a.group.rotation.y=a.angle*Math.PI/180;a.group.scale.setScalar(a.scale);}
function syncRanges(a){document.querySelectorAll('[data-actor-range]').forEach(el=>{const k=el.dataset.actorRange;el.value=a[k];el.style.setProperty('--fill',`${(el.value-el.min)/(el.max-el.min)*100}%`);$(`#actor-${k}-value`).textContent=a[k].toFixed(k==='angle'?0:2);});}
function syncStudio(){if(!api)return;api.requestRender?.();$('#studio-enabled').checked=enabled;$('#studio-count').textContent=`${actors.length} / 6`;$('#studio-actors').innerHTML=actors.length?actors.map(a=>`<div class="actor-card ${a.id===selected?'selected':''}"><button data-actor-id="${a.id}"><span>✦</span><span class="actor-name-text"></span></button><button data-remove-actor="${a.id}" aria-label="무대에서 친구 빼기">×</button></div>`).join(''):'<p class="panel-note">친구를 추가해서 무대를 채워보세요.</p>';$('#studio-actors').querySelectorAll('.actor-name-text').forEach((el,i)=>el.textContent=actors[i].state.name);const a=actors.find(x=>x.id===selected);$('#actor-settings').hidden=!a;if(a){$('#actor-name').value=a.state.name;$('#actor-motion').value=a.motion;syncRanges(a);}$('#studio-add-current').disabled=actors.length>=6;$('#studio-import').disabled=actors.length>=6;$('#studio-record').disabled=!enabled||actors.length===0;}
export function updateStudio(t,external,applyFBX,sharedState){
 if(!api)return;
 const scene=api.getScene();if(!sharedBlanket.parent)scene?.add(sharedBlanket);if(!sharedGrass.parent)scene?.add(sharedGrass);
 if(api.getAvatar())api.getAvatar().root.visible=!enabled;
 sharedBlanket.visible=false;sharedGrass.visible=false;if(!enabled)return;
 const mode=a=>a.motion==='shared'?sharedState.motion:a.motion;
 const picnickers=actors.filter(a=>mode(a).startsWith('picnic'));
 if(picnickers.length){
  const xs=picnickers.map(a=>a.x),zs=picnickers.map(a=>a.z),left=Math.min(...xs),right=Math.max(...xs),front=Math.min(...zs),back=Math.max(...zs);
  sharedBlanket.visible=true;sharedBlanket.position.set((left+right)/2,.018,(front+back)/2+.22);sharedBlanket.scale.set((right-left+1.35)/1.65,1,(back-front+1.15)/1.28);
 }
 const footprints=[];
 for(const a of actors){
  a.avatar.sharedBlanket=true;a.avatar.sharedGrass=true;a.avatar.socialSide=a.x<=0?1:-1;a.group.visible=true;
  const at=(t+a.phase)*a.speed;
  if(a.motion==='shared'&&external?.type==='vmd')applyVMD(a.avatar,external.mapped,at%external.duration);
  else if(a.motion==='shared'&&external?.type==='fbx')applyFBX(at%external.duration,a.avatar);
  else{
   poseAvatar(a.avatar,mode(a),at,a.motion==='shared'?sharedState.speed:1);
   const f=sleepFootprint(a.avatar);
   if(sleepMotions.has(mode(a))&&f){const center=a.group.localToWorld(new T.Vector3(f.x,0,f.z));footprints.push({x:center.x,z:center.z,radius:f.radius*a.scale});}
  }
 }
 if(footprints.length){
  const left=Math.min(...footprints.map(f=>f.x-f.radius)),right=Math.max(...footprints.map(f=>f.x+f.radius)),front=Math.min(...footprints.map(f=>f.z-f.radius)),back=Math.max(...footprints.map(f=>f.z+f.radius));
  const x=(left+right)/2,z=(front+back)/2,radius=Math.max(...footprints.map(f=>Math.hypot(f.x-x,f.z-z)+f.radius));
  sharedGrass.position.set(x,0,z);sharedGrass.scale.set(radius,1,radius);sharedGrass.visible=true;
 }
}

export function filterStudio(filter){for(const a of actors)a.avatar.root.traverse(o=>facetMesh(o,filter==='lowpoly'));}
export function studioSnapshot(){return{enabled,actors:actors.map(({state,x,z,angle,scale,motion,speed})=>({state:structuredClone(state),x,z,angle,scale,motion,speed}))};}
export function restoreStudio(snapshot){actors.forEach(a=>{api.getScene().remove(a.group);disposeAvatar(a.avatar);});actors=[];selected=-1;enabled=snapshot?.enabled??false;for(const a of snapshot?.actors??[])addActor(a.state,a);if(api.getAvatar())api.getAvatar().root.visible=!enabled;syncStudio();api.adjustCamera(enabled);}
export function studioEnabled(){return enabled;}
