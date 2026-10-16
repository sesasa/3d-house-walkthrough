import * as THREE from 'three';
import {rooms,doorsClosed} from './property.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
// Static diffuse lighting is computed offline; standard PBR still supplies
// camera-dependent specular. TEXCOORD_0 keeps material detail; TEXCOORD_1 is GI.
export async function loadBakedHouse(){
 const base=`${import.meta.env.BASE_URL}${doorsClosed?'baked-closed':'baked'}/`;
 const json=async name=>{const response=await fetch(base+name);if(!response.ok)throw Error(`Missing baked asset: ${name}`);return response.json();};
 const [manifest,metadata]=await Promise.all([json('manifest.json'),json('metadata.json')]);
 const textures=new Map(),loader=new THREE.TextureLoader();
 await Promise.all(manifest.atlases.map(async atlas=>{
  const texture=await loader.loadAsync(base+atlas.file);texture.colorSpace=THREE.NoColorSpace;texture.flipY=false;texture.channel=1;texture.generateMipmaps=false;texture.minFilter=texture.magFilter=THREE.NearestFilter;
  textures.set(atlas.id,texture);
 }));
 const gltf=await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(base+manifest.model),root=new THREE.Group(),groups={};root.name='Baked_house';
 for(const name of ['Architecture','Floors','Fixed','Windows','Furniture','Ceilings','Roof','Garden']){const group=new THREE.Group();group.name=name;groups[name]=group;root.add(group);}
 gltf.scene.updateMatrixWorld(true);let bakedMeshes=0;
 const configured=new Set();
 gltf.scene.traverse(mesh=>{
  if(!mesh.isMesh)return;
  const materials=Array.isArray(mesh.material)?mesh.material:[mesh.material];
  for(const material of materials){
   if(configured.has(material))continue;configured.add(material);
   const atlas=material.userData.bakeAtlas;
   if(!atlas)continue;
   if(!textures.has(atlas))throw Error(`Missing lightmap ${atlas}`);
   material.lightMap=textures.get(atlas);material.lightMapIntensity=manifest.lightMapIntensity;
   material.onBeforeCompile=shader=>{
    shader.fragmentShader=shader.fragmentShader.replace('void main() {', `
vec3 house5Lightmap(sampler2D lm, vec2 uv) {
 ivec2 size = textureSize(lm, 0);
 vec2 p = uv * vec2(size) - 0.5;
 ivec2 i = ivec2(floor(p));
 vec2 f = fract(p);
 vec4 a = texelFetch(lm, clamp(i, ivec2(0), size-1), 0);
 vec4 b = texelFetch(lm, clamp(i+ivec2(1,0), ivec2(0), size-1), 0);
 vec4 c = texelFetch(lm, clamp(i+ivec2(0,1), ivec2(0), size-1), 0);
 vec4 d = texelFetch(lm, clamp(i+ivec2(1,1), ivec2(0), size-1), 0);
 return mix(mix(a.rgb*a.a,b.rgb*b.a,f.x),mix(c.rgb*c.a,d.rgb*d.a,f.x),f.y)*${Number(manifest.range).toFixed(1)};
}
void main() {`);
    shader.fragmentShader=shader.fragmentShader.replace('#include <lights_fragment_maps>',THREE.ShaderChunk.lights_fragment_maps
     .replace('vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;','vec3 lightMapIrradiance = house5Lightmap(lightMap, vLightMapUv) * lightMapIntensity;')
     .replace('irradiance += lightMapIrradiance;','irradiance = lightMapIrradiance;')
     .replace('iblIrradiance += getIBLIrradiance( geometryNormal );','// Diffuse sky and its occlusion are already baked.'));
    shader.fragmentShader=shader.fragmentShader.replace('#include <lights_fragment_end>','#include <lights_fragment_end>\nreflectedLight.directDiffuse = vec3(0.0);');
   };
   material.customProgramCacheKey=()=>`house5-rgbm-linear-filter-v2-${manifest.range}`;
  }
  let category=materials[0]?.userData.category;
  for(let p=mesh;p&&!category;p=p.parent)category=p.userData.category||(groups[p.name]?p.name:null);
  const copy=new THREE.Mesh(mesh.geometry,mesh.material);copy.name=mesh.name;copy.applyMatrix4(mesh.matrixWorld);copy.castShadow=false;copy.receiveShadow=false;
  if(materials.some(m=>m.lightMap)){if(!mesh.geometry.getAttribute('uv1'))throw Error('Missing second UV set');bakedMeshes++;}
  (groups[category]||groups.Fixed).add(copy);
 });
 if(!bakedMeshes)throw Error('No baked geometry loaded');
 const mirrors=metadata.mirrors.map(m=>{const mesh=new THREE.Mesh(new THREE.BoxGeometry(m.parameters.width,m.parameters.height,m.parameters.depth));mesh.name=m.name;mesh.applyMatrix4(new THREE.Matrix4().fromArray(m.matrix));return mesh;});
 groups.Garden.userData.site=metadata.site;groups.Garden.userData.front=metadata.front;
 return {root,groups,rooms,renderGroups:groups,mirrors,inventory:metadata.inventory,colliders:metadata.colliders,baked:{manifest,meshCount:bakedMeshes,atlasCount:textures.size}};
}
