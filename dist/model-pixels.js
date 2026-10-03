import * as T from './vendor/three.module.js';

// A small transparent model buffer keeps the backdrop and floor at native resolution.
// Reuse it for the live view and every image/video export; no CPU pixel readback.
export function createModelPixelRenderer(renderer,ground,pedestal){
 const target=new T.WebGLRenderTarget(1,1,{type:T.HalfFloatType,minFilter:T.NearestFilter,magFilter:T.NearestFilter,generateMipmaps:false});
 const material=new T.ShaderMaterial({
  uniforms:{model:{value:target.texture}},transparent:true,depthTest:false,depthWrite:false,
  vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}',
  fragmentShader:`uniform sampler2D model; varying vec2 vUv;
   void main(){
    vec4 color=texture2D(model,vUv);
    if(color.a<0.001)discard;
    // The transparent target stores premultiplied color. Map straight color once.
    color.rgb/=color.a;
    gl_FragColor=color;
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
   }`
 });
 const composite=new T.Scene(),quad=new T.Mesh(new T.PlaneGeometry(2,2),material),view=new T.Camera();
 quad.frustumCulled=false;composite.add(quad);
 return{
  render(scene,camera,{pixelated=false,width=1,height=1}={}){
   if(!pixelated){renderer.render(scene,camera);return;}
   // About two screen pixels per dot: retain the face and silhouette on small screens.
   const w=Math.max(1,Math.round(width/2)),h=Math.max(1,Math.round(height/2));
   if(target.width!==w||target.height!==h)target.setSize(w,h);
   const oldTarget=renderer.getRenderTarget(),oldAutoClear=renderer.autoClear,oldShadowUpdate=renderer.shadowMap.autoUpdate,oldInfoReset=renderer.info.autoReset;
   const oldGround=ground.visible,oldPedestal=pedestal.visible;
   const models=scene.children.filter(o=>o.visible&&o!==ground&&o!==pedestal&&!o.isLight);
   renderer.info.autoReset=false;renderer.info.reset();
   try{
    ground.visible=false;pedestal.visible=false;renderer.autoClear=true;
    renderer.setRenderTarget(target);renderer.render(scene,camera);
    renderer.setRenderTarget(oldTarget);ground.visible=oldGround;pedestal.visible=oldPedestal;
    // Keep the caster map generated above while drawing only the smooth floor.
    renderer.shadowMap.autoUpdate=false;models.forEach(o=>{o.visible=false;});
    if(oldGround||oldPedestal)renderer.render(scene,camera);else renderer.clear();
    models.forEach(o=>{o.visible=true;});
    renderer.autoClear=false;renderer.render(composite,view);
   }finally{
    models.forEach(o=>{o.visible=true;});ground.visible=oldGround;pedestal.visible=oldPedestal;
    renderer.shadowMap.autoUpdate=oldShadowUpdate;renderer.autoClear=oldAutoClear;
    renderer.info.autoReset=oldInfoReset;renderer.setRenderTarget(oldTarget);
   }
  },
  dispose(){target.dispose();material.dispose();quad.geometry.dispose();}
 };
}
