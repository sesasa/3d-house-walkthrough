import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
function extract(geometry,predicate){
 const source=geometry.index?geometry.toNonIndexed():geometry.clone(),p=source.attributes.position,selected=[];
 for(let i=0;i<p.count;i+=3){const center=new THREE.Vector3();for(let j=0;j<3;j++)center.add(new THREE.Vector3().fromBufferAttribute(p,i+j));center.multiplyScalar(1/3);if(predicate(center,i))selected.push(i,i+1,i+2);}
 const result=new THREE.BufferGeometry();
 for(const key of ['position','normal','uv']){const a=source.attributes[key];if(!a)continue;const values=new Float32Array(selected.length*a.itemSize);selected.forEach((old,i)=>{for(let k=0;k<a.itemSize;k++)values[i*a.itemSize+k]=a.array[old*a.itemSize+k];});result.setAttribute(key,new THREE.BufferAttribute(values,a.itemSize));}
 result.computeBoundingBox();source.dispose();return result;
}
function fitted(source,size){const g=source.clone();g.computeBoundingBox();const center=g.boundingBox.getCenter(new THREE.Vector3()),old=g.boundingBox.getSize(new THREE.Vector3());g.translate(-center.x,-center.y,-center.z);g.scale(size.x/old.x,size.y/old.y,size.z/old.z);return g;}

export async function addScannedAssets(house){
const base=import.meta.env.BASE_URL,loader=new GLTFLoader();const [chair,plant]=await Promise.all(['modern_arm_chair_01','potted_plant_02'].map(a=>loader.loadAsync(`${base}assets/${a}/${a}.gltf`)));chair.scene.updateMatrixWorld(true);plant.scene.updateMatrixWorld(true);
 let pillow;
 chair.scene.traverse(o=>{if(o.isMesh&&o.material.name.includes('pillow'))pillow=o;});
 if(!pillow)throw new Error('Scanned upholstery mesh missing');
 const g=pillow.geometry.clone().applyMatrix4(pillow.matrixWorld);g.computeBoundingBox();
 // The scanned mesh contains separate seat/back cushions. Split by welded
 // connectivity, not a height plane that could slice the sloping backrest.
 const source=g.index?g.toNonIndexed():g.clone(),positions=source.attributes.position;
 const parent=Array.from({length:positions.count},(_,i)=>i),same=new Map();
 const find=i=>{while(parent[i]!==i){parent[i]=parent[parent[i]];i=parent[i];}return i;};
 const join=(a,b)=>{parent[find(a)]=find(b);};
 for(let i=0;i<positions.count;i++){
  const key=[positions.getX(i),positions.getY(i),positions.getZ(i)].map(v=>Math.round(v*10000)).join(',');
  if(same.has(key))join(i,same.get(key));else same.set(key,i);
  if(i%3)join(i,i-i%3);
 }
 const components=new Map();
 for(let i=0;i<positions.count;i+=3){const id=find(i);if(!components.has(id))components.set(id,{ids:new Set(),minY:Infinity,maxY:-Infinity});const c=components.get(id);c.ids.add(i);for(let j=0;j<3;j++){c.minY=Math.min(c.minY,positions.getY(i+j));c.maxY=Math.max(c.maxY,positions.getY(i+j));}}
 const parts=[...components.values()].filter(c=>c.ids.size>80).sort((a,b)=>(a.maxY-a.minY)-(b.maxY-b.minY));
 if(parts.length<2)throw new Error('Scanned upholstery components are not separable');
 const seat=extract(g,(_,i)=>parts[0].ids.has(i)),back=extract(g,(_,i)=>parts.at(-1).ids.has(i));
 if(seat.attributes.position.count<30||back.attributes.position.count<30)throw new Error('Scanned cushion split is empty');
 const material=pillow.material.clone();material.name='Scanned charcoal leather upholstery';material.roughness=.72;
 house.root.traverse(o=>{
  if(!o.isMesh)return;
  if(['Leather_seat_cushion','Leather_back_cushion'].includes(o.name)){
   o.geometry.computeBoundingBox();const size=o.geometry.boundingBox.getSize(new THREE.Vector3()).multiply(o.scale);
   o.geometry=fitted(o.name==='Leather_back_cushion'?back:seat,size);o.scale.set(1,1,1);o.material=material;
  }
 });

 const bounds=new THREE.Box3().setFromObject(plant.scene),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
 for(const [x,y,z,h] of [[4.3,.79,6.26,.44],[3.68,.935,4.49,.43],[2.80,.935,7.74,.32]]){const clone=plant.scene.clone(true);clone.name='Photo_reference_potted_plant';clone.scale.setScalar(h/size.y);clone.position.set(x-center.x*clone.scale.x,y-bounds.min.y*clone.scale.y,z-center.z*clone.scale.z);clone.traverse(o=>{if(o.isMesh){o.castShadow=o.receiveShadow=true;if(o.material.name.endsWith('_pot')){o.material=house.materials.ceramic;}if(o.material.name.includes('leaves')){o.material.side=THREE.DoubleSide;o.material.alphaTest=.4;}}});house.groups.Furniture.add(clone);}
 house.root.userData.scannedDetails={source:'Poly Haven CC0',cushionTriangles:[seat.attributes.position.count/3,back.attributes.position.count/3],plants:3};
}
