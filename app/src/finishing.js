import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {SSAOPass} from 'three/addons/postprocessing/SSAOPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
export function createFinishing(renderer,scene,camera,baked=false){
 // Offline GI already includes contact shadows. Render directly to the
 // antialiased canvas without allocating SSAO/compositor render targets.
 if(baked)return {resize(){},render(){renderer.render(scene,camera);},setEnabled(){}};
 const target=new THREE.WebGLRenderTarget(1,1,{type:THREE.HalfFloatType,samples:2});
 const composer=new EffectComposer(renderer,target);composer.addPass(new RenderPass(scene,camera));
 const ao=new SSAOPass(scene,camera,1,1,8);ao.ssaoMaterial.fragmentShader=ao.ssaoMaterial.fragmentShader.replace("1.0 - occlusion", "1.0 - 0.65 * occlusion");ao.kernelRadius=.25;ao.minDistance=.00025;ao.maxDistance=.045;
 // Transparent glazing should not occlude the room in the normal/depth pass.
 const originalOverride=ao._overrideVisibility.bind(ao);
 ao._overrideVisibility=()=>{originalOverride();scene.traverse(o=>{if(o.isMesh&&o.material.transparent&&o.visible){ao._visibilityCache.push(o);o.visible=false;}});};
 composer.addPass(ao);composer.addPass(new OutputPass());
 return {
  resize(w,h){composer.setSize(w,h);ao.setSize(Math.max(1,Math.round(w*.7)),Math.max(1,Math.round(h*.7)));},
  render(){ao.ssaoMaterial.uniforms.cameraProjectionMatrix.value.copy(camera.projectionMatrix);ao.ssaoMaterial.uniforms.cameraInverseProjectionMatrix.value.copy(camera.projectionMatrixInverse);composer.render();},
  setEnabled(enabled){ao.enabled=enabled;},
 };
}
