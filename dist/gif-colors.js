// GIF alpha is a separate one-bit mask. Keep opaque RGB at its full precision,
// especially the close dark tones that otherwise turn shaded faces into bands.
export function createGifColorMap({transparent=false,maxColors=256,samplesPerFrame=80000}={}){
 const histogram=new Map();
 function sample(pixels){
  const stride=Math.max(1,Math.floor(pixels.length/(4*samplesPerFrame)))*4;
  for(let i=0;i<pixels.length;i+=stride){
   if(transparent&&pixels[i+3]<128)continue;
   const key=pixels[i]*65536+pixels[i+1]*256+pixels[i+2];
   const point=histogram.get(key);
   if(point)point.count++;else histogram.set(key,{rgb:[pixels[i],pixels[i+1],pixels[i+2]],count:1,key});
  }
 }
 function finish(){
  const limit=Math.min(256,Math.max(2,maxColors))-(transparent?1:0);
  const points=[...histogram.values()];
  function box(items){
   let count=0;const sum=[0,0,0],squared=[0,0,0];
   for(const p of items){count+=p.count;for(let c=0;c<3;c++){sum[c]+=p.rgb[c]*p.count;squared[c]+=p.rgb[c]**2*p.count;}}
   const error=sum.map((value,c)=>Math.max(0,squared[c]-value*value/count));
   return{items,count,sum,error,score:items.length>1?error[0]+error[1]+error[2]:0};
  }
  const boxes=points.length?[box(points)]:[];
  while(boxes.length<limit){
   let selected=-1,score=0;
   for(let i=0;i<boxes.length;i++)if(boxes[i].score>score){selected=i;score=boxes[i].score;}
   if(selected<0)break;
   const current=boxes[selected],channel=current.error.indexOf(Math.max(...current.error));
   current.items.sort((a,b)=>a.rgb[channel]-b.rgb[channel]||a.key-b.key);
   let weight=0,cut=1;
   for(let i=0;i<current.items.length-1;i++){weight+=current.items[i].count;cut=i+1;if(weight>=current.count/2)break;}
   boxes.splice(selected,1,box(current.items.slice(0,cut)),box(current.items.slice(cut)));
  }
  const palette=boxes.map(b=>b.sum.map(value=>Math.round(value/b.count)));
  if(!palette.length)palette.push([0,0,0]);
  if(transparent)palette.unshift([0,0,0]);
  histogram.clear();
  // One shared palette and exact-RGB cache for the entire animation avoid both
  // coarse color buckets and changes in shading as the frame palette changes.
  const cache=new Map(),first=transparent?1:0;
  for(let i=first;i<palette.length;i++){const p=palette[i];cache.set(p[0]*65536+p[1]*256+p[2],i);}
  function mapFrame(pixels){
   const indices=new Uint8Array(pixels.length/4);
   for(let i=0,j=0;i<pixels.length;i+=4,j++){
    if(transparent&&pixels[i+3]<128){indices[j]=0;continue;}
    const r=pixels[i],g=pixels[i+1],b=pixels[i+2],key=r*65536+g*256+b;
    let index=cache.get(key);
    if(index===undefined){
     let distance=Infinity;index=first;
     for(let k=first;k<palette.length;k++){
      const p=palette[k],dr=r-p[0],dg=g-p[1],db=b-p[2],d=dr*dr+dg*dg+db*db;
      if(d<distance){distance=d;index=k;if(d===0)break;}
     }
     cache.set(key,index);
    }
    indices[j]=index;
   }
   return indices;
  }
  return{palette,mapFrame,transparentIndex:transparent?0:-1};
 }
 return{sample,finish};
}
