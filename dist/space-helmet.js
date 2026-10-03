import * as T from './vendor/three.module.js';
import {solidMesh,wearableMaterial,roundBox,lineTube,ball} from './wearable-meshes.js';

export function addSpaceHelmet(head,s,origin,surface){
 const g=new T.Group();g.name='SpaceHelmet';head.add(g);
 const top=surface.top(0,0),center=(top+.16+.74)/2,rx=1.095,ry=(top+.16-.74)/2+.08,rz=.77,thetaBottom=Math.acos((.83-center)/ry),thetaBrow=.58;
 g.position.set(0,center-origin[1],0);const scale=[rx,ry,rz];
 const frame=wearableMaterial(s,'spaceHelmetColor'),seal=wearableMaterial(s,null,'#81909a'),trim=wearableMaterial(s,null,'#d5a571'),glass=new T.MeshPhysicalMaterial({color:'#edf7f9',roughness:.12,transparent:true,opacity:.09,depthWrite:false});
 const pointed=['cat','fox','wolf','bunny','uprightPuppy'].includes(s.species),cx=s.species==='bunny'?.42:s.species==='fox'?.49:s.species==='wolf'?.51:.54,portX=s.species==='bunny'?.17:.21,portZ=s.species==='bunny'?.12:.16;
 const port=(x,y,z)=>pointed&&y+center>1.90&&((Math.abs(x)-cx)/portX)**2+((z+.10)/portZ)**2<1;
 function shell(geometry,name){const flat=geometry.toNonIndexed();geometry.dispose();const p=flat.attributes.position,n=flat.attributes.normal,positions=[],normals=[];for(let i=0;i<p.count;i+=3){const x=(p.getX(i)+p.getX(i+1)+p.getX(i+2))/3*rx,y=(p.getY(i)+p.getY(i+1)+p.getY(i+2))/3*ry,z=(p.getZ(i)+p.getZ(i+1)+p.getZ(i+2))/3*rz;if(port(x,y,z))continue;for(let j=0;j<3;j++){positions.push(p.getX(i+j),p.getY(i+j),p.getZ(i+j));normals.push(n.getX(i+j),n.getY(i+j),n.getZ(i+j));}}flat.dispose();const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setAttribute('normal',new T.Float32BufferAttribute(normals,3));return solidMesh(g,geo,frame,[0,0,0],scale,name);}
 shell(new T.SphereGeometry(1,40,30,Math.PI-.04,Math.PI+.08,thetaBrow,thetaBottom-thetaBrow),'HelmetRearShell');
 shell(new T.SphereGeometry(1,64,20,0,Math.PI*2,0,thetaBrow),'HelmetCrown');
 solidMesh(g,new T.SphereGeometry(1,48,30,.04,Math.PI-.08,thetaBrow,thetaBottom-thetaBrow),glass,[0,0,0],scale,'HelmetClearVisor');
 const at=(t,phi,extra=0)=>[-(rx+extra)*Math.sin(t)*Math.cos(phi),(ry+extra)*Math.cos(t),(rz+extra)*Math.sin(t)*Math.sin(phi)];
 const rim=[];for(let i=0;i<=30;i++)rim.push(at(thetaBrow,.04+(Math.PI-.08)*i/30));for(let i=1;i<=30;i++)rim.push(at(T.MathUtils.lerp(thetaBrow,thetaBottom,i/30),Math.PI-.04));for(let i=1;i<=40;i++)rim.push(at(thetaBottom,Math.PI-.04-(Math.PI-.08)*i/40));for(let i=1;i<=30;i++)rim.push(at(T.MathUtils.lerp(thetaBottom,thetaBrow,i/30),.04));
 solidMesh(g,lineTube(rim,.017,132),seal,[0,0,0],[1,1,1],'HelmetVisorSeal');
 const radius=Math.sin(thetaBottom),collar=new T.TorusGeometry(rx*radius,.041,10,64);collar.rotateX(Math.PI/2);solidMesh(g,collar,frame,[0,ry*Math.cos(thetaBottom)-.014,0],[1,1,rz/rx],'HelmetNeckCollar');
 if(pointed)for(const side of[-1,1]){const edge=[];for(let i=0;i<=48;i++){const angle=i/48*Math.PI*2,x=side*cx+portX*Math.cos(angle),z=-.10+portZ*Math.sin(angle),y=ry*Math.sqrt(Math.max(0,1-(x/rx)**2-(z/rz)**2));edge.push([x,y+.008,z]);}solidMesh(g,lineTube(edge,.013,52),frame,[0,0,0],[1,1,1],'HelmetEarPort');}
 for(const side of[-1,1]){const x=side*(rx-.025),y=1.38-center;solidMesh(g,roundBox(.15,.255,.21,.055),frame,[x,y,-.035],[1,1,1],'HelmetCommsPod');for(let i=0;i<3;i++)solidMesh(g,roundBox(.013,.066,.010,.003),seal,[x+side*.076,y,-.09+i*.045]);ball(g,trim,[x,y-.078,.077],[.021,.021,.010]);}
 const shine=new T.MeshBasicMaterial({color:'#ffffff',transparent:true,opacity:.48,depthWrite:false}),arc=[];for(let i=0;i<15;i++)arc.push(at(.79+i/14*.25,2.15,.009));solidMesh(g,lineTube(arc,.009,20),shine);
 const latch=solidMesh(g,roundBox(.15,.052,.068,.016),seal,[0,.83-center-.019,rz*radius]);solidMesh(latch,roundBox(.077,.015,.008,.004),trim,[0,0,.038]);
}
