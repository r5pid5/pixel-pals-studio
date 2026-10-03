export const backgroundKeys=new Set(['background','backgroundColor','backgroundImage','backgroundImageName','backgroundImageFit','backgroundImageX','backgroundImageY']);
export const maxBackgroundDataLength=4*1024*1024;
let cachedData='',cachedImage=null,cachedPromise=null;

export function validBackgroundData(value){
 return typeof value==='string'&&value.length<=maxBackgroundDataLength&&(value===''||/^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(value));
}
export function ensureBackgroundImage(s){
 if(s.background!=='image'||!s.backgroundImage)return Promise.resolve(null);
 if(cachedData===s.backgroundImage&&cachedPromise)return cachedPromise;
 const data=s.backgroundImage;
 cachedData=data;cachedImage=null;
 cachedPromise=new Promise((resolve,reject)=>{
  const img=new Image();
  img.onload=()=>{if(cachedData===data)cachedImage=img;resolve(img);};
  img.onerror=()=>reject(new Error('배경 사진을 읽을 수 없습니다. 다른 사진을 선택해 주세요.'));
  img.src=data;
 });
 return cachedPromise;
}
export function photoLayout(imageWidth,imageHeight,width,height,fit='cover',x=50,y=50){
 const scale=(fit==='contain'?Math.min:Math.max)(width/imageWidth,height/imageHeight);
 const w=imageWidth*scale,h=imageHeight*scale;
 return{x:(width-w)*x/100||0,y:(height-h)*y/100||0,width:w,height:h};
}
export function drawBackgroundPhoto(ctx,width,height,s){
 ctx.fillStyle=s.backgroundColor;ctx.fillRect(0,0,width,height);
 if(cachedData!==s.backgroundImage||!cachedImage)return;
 const p=photoLayout(cachedImage.naturalWidth,cachedImage.naturalHeight,width,height,s.backgroundImageFit,s.backgroundImageX,s.backgroundImageY);
 ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
 ctx.drawImage(cachedImage,p.x,p.y,p.width,p.height);
}
export function applyBackground(stage,s){
 stage.dataset.background=s.background;
 stage.style.background=s.background==='solid'||s.background==='image'?s.backgroundColor:s.background==='transparent'?'repeating-conic-gradient(#eee8f3 0% 25%,#faf8fc 0% 50%) 0 0 / 20px 20px':s.background==='grid'?'#f2eef7':'';
 if(s.background==='image'&&s.backgroundImage){
  stage.style.backgroundImage=`url("${s.backgroundImage}")`;
  stage.style.backgroundSize=s.backgroundImageFit;
  stage.style.backgroundPosition=`${s.backgroundImageX}% ${s.backgroundImageY}%`;
  stage.style.backgroundRepeat='no-repeat';
  ensureBackgroundImage(s).catch(()=>{});
 }
}
export function backgroundPhotoControls(){return `<div class="background-photo-controls"><input id="background-photo-file" type="file" accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp" hidden><button id="background-photo-upload" class="secondary-button full-width" type="button">배경 사진 선택</button><div id="background-photo-current" class="background-photo-current" hidden><img id="background-photo-thumbnail" alt="선택한 배경 사진"><span id="background-photo-name"></span><button id="background-photo-remove" type="button" aria-label="배경 사진 삭제">×</button></div><p class="panel-note">PNG·JPG·WebP 사진을 넣을 수 있어요. 사진도 프로젝트에 함께 저장됩니다.</p></div>`;}
export function initBackgroundControls(api){
 const input=document.querySelector('#background-photo-file'),button=document.querySelector('#background-photo-upload');
 button.addEventListener('click',()=>input.click());
 input.addEventListener('change',async()=>{
  const file=input.files[0];input.value='';if(!file)return;
  button.disabled=true;button.setAttribute('aria-busy','true');
  try{const data=await prepareBackgroundPhoto(file);await ensureBackgroundImage({background:'image',backgroundImage:data});api.change({background:'image',backgroundImage:data,backgroundImageName:file.name.slice(0,120),backgroundImageX:50,backgroundImageY:50});api.toast('배경 사진을 넣었어요. 채우기와 전체 보기로 조절해 주세요.');}
  catch(e){api.toast(e.message||'사진을 불러올 수 없습니다.');}
  finally{button.disabled=false;button.removeAttribute('aria-busy');}
 });
 document.querySelector('#background-photo-remove').addEventListener('click',()=>api.change({backgroundImage:'',backgroundImageName:'',...(api.getState().background==='image'?{background:'mood'}:{})}));
}
export function syncBackgroundControls(s){
 const current=document.querySelector('#background-photo-current');if(!current)return;
 current.hidden=!s.backgroundImage;
 const img=document.querySelector('#background-photo-thumbnail');
 if(img.getAttribute('src')!==s.backgroundImage){if(s.backgroundImage)img.src=s.backgroundImage;else img.removeAttribute('src');}
 document.querySelector('#background-photo-name').textContent=s.backgroundImageName||'배경 사진';
 document.querySelector('#background-photo-fit-controls').hidden=s.background!=='image';
}
export async function prepareBackgroundPhoto(file){
 if(!['image/png','image/jpeg','image/webp'].includes(file.type))throw new Error('PNG·JPG·WebP 사진을 선택해 주세요.');
 if(file.size>32*1024*1024)throw new Error('사진은 32MB 이내로 선택해 주세요.');
 const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('사진 파일을 읽을 수 없습니다.'));reader.readAsDataURL(file);});
 const img=await new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(new Error('사진을 읽을 수 없습니다.'));image.src=data;});
 let limit=2048;
 for(let i=0;i<5;i++){
  const scale=Math.min(1,limit/Math.max(img.naturalWidth,img.naturalHeight)),canvas=document.createElement('canvas');
  canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
  const ctx=canvas.getContext('2d');ctx.imageSmoothingQuality='high';ctx.drawImage(img,0,0,canvas.width,canvas.height);
  const output=canvas.toDataURL(file.type==='image/jpeg'?'image/jpeg':'image/png',.9);
  if(output.length<=maxBackgroundDataLength)return output;
  limit*=.75;
 }
 throw new Error('사진을 줄일 수 없습니다. 더 작은 사진을 선택해 주세요.');
}
