// Clothes fit the existing arm pose; equipping a garment must not widen the
// body or move its elbow/wrist bind positions.
export const armSpread=()=>0;
export const handBindX=s=>(.305+armSpread(s))*s.body;
const smooth=(x,a,b)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
export function armWeights(s,p,arm){
 const side=arm===7?1:-1,shift=(1.54/5.2)*(s.legs-1),dx=side*(handBindX(s)-.20*s.body),dy=-.296,dz=.03;
 const along=((p.x-side*.20*s.body)*dx+(p.y-.79-shift)*dy+p.z*dz)/(dx*dx+dy*dy+dz*dz),lower=smooth(along,.35,.65),wrist=smooth(along,.73,.93);
 return[[arm,1-lower],[arm+1,lower*(1-wrist)],[arm+2,lower*wrist]];
}
