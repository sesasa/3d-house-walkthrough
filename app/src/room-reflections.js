import {doorsClosed} from './property.js';
import * as THREE from 'three';
// Precomputed PMREM data from this house supplies local glossy reflections.
// Loading it avoids six scene renders whenever a visitor enters a new room.
export function createRoomReflections(renderer,scene,mirrors,baked=false){
 const fallback=scene.environment,intensity=scene.environmentIntensity,cache=new Map(),pending=new Map();
 const pmrem=new THREE.PMREMGenerator(renderer);let current=null,enabled=true,revision=0;
 const base=import.meta.env.BASE_URL+(baked?(doorsClosed?'baked-closed/':'baked/'):'');
 function apply(){
  scene.environment=enabled&&current&&cache.has(current.id)?cache.get(current.id):fallback;
  scene.environmentIntensity=scene.environment===fallback?intensity:.65;
  revision++; // Let the otherwise idle renderer refresh when a probe arrives.
 }
 async function load(room){
  if(cache.has(room.id)||pending.has(room.id))return;
  const promise=(async()=>{
   const response=await fetch(`${base}reflections/${room.id}.bin`);if(!response.ok)throw new Error('Reflection data unavailable');
   const buffer=await response.arrayBuffer(),header=new Uint32Array(buffer,0,2),data=new Uint16Array(buffer,8);
   if(data.length!==header[0]*header[1]*4)throw new Error('Invalid reflection data');
   const texture=new THREE.DataTexture(data,header[0],header[1],THREE.RGBAFormat,THREE.HalfFloatType);
   texture.mapping=THREE.CubeUVReflectionMapping;texture.minFilter=texture.magFilter=THREE.LinearFilter;texture.generateMipmaps=false;texture.needsUpdate=true;
   cache.set(room.id,texture);apply();
  })().catch(()=>{/* Generic lighting remains available if a probe fails. */});
  pending.set(room.id,promise);await promise;
 }
 return {
  enter(room){current=room;apply();if(enabled)void load(room);},
  setEnabled(value){enabled=value;apply();if(enabled&&current)void load(current);},
  get count(){return cache.size;},get revision(){return revision;},
  // Used only by the offline bake script, never by the visitor's navigation.
  bake(room){
   const target=new THREE.WebGLCubeRenderTarget(128,{type:THREE.HalfFloatType}),camera=new THREE.CubeCamera(.08,65,target);
   camera.position.set(room.spawn[0],1.45,room.spawn[1]);
   const oldTarget=renderer.getRenderTarget(),oldAuto=renderer.shadowMap.autoUpdate,oldNeeds=renderer.shadowMap.needsUpdate;
   mirrors.setEnabled(false);scene.environment=fallback;scene.environmentIntensity=intensity;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=false;
   let result;
   try{
    camera.update(renderer,scene);result=pmrem.fromCubemap(target.texture);
    const data=new Uint16Array(result.width*result.height*4);renderer.readRenderTargetPixels(result,0,0,result.width,result.height,data);
    return {width:result.width,height:result.height,data:Array.from(data)};
   }finally{result?.dispose();target.dispose();renderer.setRenderTarget(oldTarget);renderer.shadowMap.autoUpdate=oldAuto;renderer.shadowMap.needsUpdate=oldNeeds;mirrors.setEnabled(enabled);apply();}
  },
 };
}
