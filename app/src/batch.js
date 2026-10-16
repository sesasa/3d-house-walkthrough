import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
// Render static objects in material batches, while preserving the named source
// scene separately for editable GLB export. Glass keeps per-object sorting.
export function batchHouse(source){
 source.updateMatrixWorld(true);const root=new THREE.Group();root.name='Batched_house';const groups={};
 for(const category of source.children){
  const target=new THREE.Group();target.name=category.name;root.add(target);groups[category.name]=target;const buckets=new Map();
  category.traverse(mesh=>{
   if(!mesh.isMesh)return;
   if(!Array.isArray(mesh.material)&&mesh.material.transparent){const copy=new THREE.Mesh(mesh.geometry,mesh.material);copy.name=mesh.name;copy.applyMatrix4(mesh.matrixWorld);copy.castShadow=false;copy.receiveShadow=false;target.add(copy);return;}
   const base=mesh.geometry.index?mesh.geometry.toNonIndexed():mesh.geometry.clone();
   // Meshopt positions can be normalized integers. Expand before applying
   // world transforms, otherwise metre coordinates overflow their storage.
   for(const key of ['position','normal','uv','uv1','color']){const a=base.getAttribute(key);if(!a)continue;const values=new Float32Array(a.count*a.itemSize);for(let i=0;i<a.count;i++)for(let c=0;c<a.itemSize;c++)values[i*a.itemSize+c]=a.getComponent(i,c);base.setAttribute(key,new THREE.Float32BufferAttribute(values,a.itemSize));}
   base.applyMatrix4(mesh.matrixWorld);
   const chunks=Array.isArray(mesh.material)?base.groups.map(g=>({start:g.start,count:g.count,material:mesh.material[g.materialIndex]})):[{start:0,count:base.attributes.position.count,material:mesh.material}];
   for(const chunk of chunks){
    const geometry=new THREE.BufferGeometry();
    for(const key of ['position','normal','uv','uv1','color']){const a=base.attributes[key];if(!a)continue;const values=new Float32Array(chunk.count*a.itemSize);for(let i=0;i<chunk.count;i++)for(let c=0;c<a.itemSize;c++)values[i*a.itemSize+c]=a.getComponent(chunk.start+i,c);geometry.setAttribute(key,new THREE.Float32BufferAttribute(values,a.itemSize));}
    if(!buckets.has(chunk.material.uuid))buckets.set(chunk.material.uuid,{material:chunk.material,geometries:[]});buckets.get(chunk.material.uuid).geometries.push(geometry);
   }
   base.dispose();
  });
  for(const {material,geometries} of buckets.values()){
   const geometry=mergeGeometries(geometries,false);const mesh=new THREE.Mesh(geometry,material);mesh.name=category.name+'_'+material.name;mesh.castShadow=true;mesh.receiveShadow=true;target.add(mesh);for(const g of geometries)g.dispose();
  }
 }
 return {root,groups};
}
