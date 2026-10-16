import site from './site.json';
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {upholsteredGeometry} from './soft-shapes.js';
import {sewnPillow} from './upholstery.js';
import {walls} from './property.js';
export async function refineQuality(house){
 const {root,groups,materials:m}=house;
 const mesh=(name,g,mat,pos,parent=groups.Furniture)=>{const o=new THREE.Mesh(g,mat);o.name=name;o.position.set(...pos);o.castShadow=o.receiveShadow=true;parent.add(o);return o;};
 const box=(name,pos,size,mat,parent=groups.Furniture,r=.004)=>mesh(name,new RoundedBoxGeometry(...size,2,r),mat,pos,parent);
 const tube=(name,points,r,mat,parent=groups.Furniture,closed=false)=>mesh(name,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)),closed),32,r,8,closed),mat,[0,0,0],parent);
 const lathe=(name,profile,pos,mat,parent=groups.Furniture)=>mesh(name,new THREE.LatheGeometry(profile.map(p=>new THREE.Vector2(...p)),32),mat,pos,parent);
 const tan=m.linen.clone();tan.name='Warm taupe woven cushions';tan.color.set('#a58b6d');const dark=m.leather.clone();dark.name='Leather seam';dark.color.set('#151814');
 const all=[];root.traverse(o=>{if(o.isMesh)all.push(o);});let seed=1;
 for(const o of all){o.geometry.computeBoundingBox();const size=o.geometry.boundingBox.getSize(new THREE.Vector3());
  if(['Sofa_arm','Sofa_back','Recliner_arm'].includes(o.name)){o.geometry=upholsteredGeometry(size.x,size.y,size.z,seed++);if(o.name==='Sofa_back')o.rotation.x=-.09;}
  if(o.name==='Sofa_arm'){const p=o.geometry.attributes.position;for(let i=0;i<p.count;i++){const z=p.getZ(i);p.setY(i,p.getY(i)+.10*((z/size.z)-.25)**2);}o.geometry.computeVertexNormals();}
  if(o.name==='Leather_seat_cushion'){const w=size.x*.47,d=size.z*.46;tube('Sewn_leather_piping',[[-w,.015,-d],[0,.015,-d],[w,.015,-d],[w,.015,d],[-w,.015,d]],.002,dark,o,true);}
  if(o.name==='Opal_shade'){o.geometry=new THREE.LatheGeometry([[.035,.05],[.055,.035],[.083,-.045],[.088,-.065],[.083,-.065],[.075,-.042],[.048,.03],[.03,.045]].map(p=>new THREE.Vector2(...p)),32);o.material=m.light;}
  if(o.name==='Bed_foot_bench'||o.name==='Table_leg'&&Math.abs(o.position.x-9.04)<.3&&Math.abs(o.position.z-2.04)<.85)o.material=m.white;
  if(o.name==='Mirror_frame'&&o.parent.name==='bath-vanity'){o.geometry=new THREE.BoxGeometry(.05,size.y,.045);o.position.z+=.015;}
 }
 // Loose cushions and the curved wood trim are visible in the living photographs.
 for(const sofa of groups.Furniture.children.filter(o=>o.name==='Leather_sofa')){const base=sofa.children.find(o=>o.name==='Sofa_base');const w=base.geometry.parameters.width||2;
  for(const sign of [-1,1]){const p=mesh('Taupe_scatter_cushion',sewnPillow(.43,.16,.43,seed++),tan,[sign*(w/2-.37),.78,-.08],sofa);p.rotation.set(1.18,sign*.12,sign*.10);}
 }
 // A woven throw gives the photographed coffee table its softer silhouette.
 const cloth=new THREE.PlaneGeometry(1.0,1.64,24,32);cloth.rotateX(-Math.PI/2);const cp=cloth.attributes.position;
 for(let i=0;i<cp.count;i++){const x=cp.getX(i),z=cp.getZ(i),edge=Math.max(0,Math.abs(x)-.40);cp.setY(i,-edge*2.0+.006*Math.sin(x*35+z*12));}cloth.computeVertexNormals();const linen=m.linen.clone();linen.side=THREE.DoubleSide;mesh('Coffee_table_linen',cloth,linen,[9.27,.467,10.38]);
 // Tall freestanding storage under the living clerestories (not built-in cabinetry).
 box('Living_oak_storage',[11.08,.79,10.75],[.43,1.58,2.77],m.oak);house.colliders.push({minX:10.865,maxX:11.295,minZ:9.365,maxZ:12.135,name:'Living_oak_storage'});
 for(let i=0;i<5;i++){box('Living_storage_front',[10.851,.81,9.64+i*.55],[.028,1.47,.53],m.oak);box('Storage_pull',[10.825,.89,9.82+i*.55],[.03,.13,.018],m.steel);}
 // Bed-end fleece, low drawers and softly rounded drawer pulls.
 const fleece=upholsteredGeometry(.43,.07,1.25,43);mesh('Bed_bench_fleece',fleece,m.linen,[9.04,.49,2.04]);
 for(const o of groups.Furniture.children.filter(o=>o.name==='Bedside_drawers')){for(let k=0;k<3;k++){box('Bedside_drawer_front',[o.position.x-.241,.15+k*.195,o.position.z],[.018,.18,.42],m.white);const knob=mesh('Bedside_round_knob',new THREE.SphereGeometry(.013,12,8),m.chrome,[o.position.x-.258,.15+k*.195,o.position.z]);}}
 // Window hardware and rolled blinds are attached to the real openings only.
 for(const w of walls)for(const o of w.openings.filter(o=>o.kind==='window')){
  const alongX=w.axis==='x',len=o.b-o.a,mid=(o.a+o.b)/2,inside=w.inside||1,at=w.at+inside*.15;
  if(o.head-o.sill>.7){const roller=mesh('Window_blind_roller',new THREE.CylinderGeometry(.024,.024,len,.0+24),o.room==='living'?m.oak:m.white,alongX?[mid,o.head+.035,at]:[at,o.head+.035,mid],groups.Windows);roller.rotation.z=alongX?Math.PI/2:0;if(!alongX)roller.rotation.x=Math.PI/2;
   box('Rolled_blind_fabric',alongX?[mid,o.head-.035,at]:[at,o.head-.035,mid],alongX?[len,.07,.035]:[.035,.07,len],m.linen,groups.Windows);
  }
  if(!o.opaque){const t=o.b-.08;box('Window_handle',alongX?[t,(o.sill+o.head)*.5,at]:[at,(o.sill+o.head)*.5,t],alongX?[.018,.11,.027]:[.027,.11,.018],m.white,groups.Windows);}
 }
 // Cabinet contents and a few photo-backed countertop objects.
 for(const g of groups.Fixed.children.filter(o=>o.name==='kitchen-display-upper'))for(let i=0;i<8;i++){lathe('Display_cup',[[.025,0],[.031,.055],[.029,.059],[.026,.055],[.021,.004]],[ -.88+i*.25,.18,0],m.ceramic,g);}
 lathe('Kitchen_kettle',[[0,0],[.095,.015],[.09,.16],[.045,.23],[0,.24]],[.38,.94,5.89],m.steel);
 tube('Kettle_handle',[[.35,1.15,5.84],[.35,1.24,5.95],[.35,1.12,6.05]],.012,m.dark);
 const board=box('Oak_chopping_board',[.07,1.08,7.12],[.026,.31,.24],m.oak);board.rotation.z=-.10;
 for(const x of [1.30,2.05,2.80]){lathe('Kitchen_pendant_shade',[[.015,.04],[.04,.005],[.10,-.06],[.10,-.067],[.09,-.065],[.032,.004]],[x,2.02,7.40],m.light,groups.Fixed);tube('Kitchen_pendant_cord',[[x,2.065,7.40],[x,2.515,7.40]],.003,m.steel,groups.Fixed);}
 // Wall-attached air conditioner visible above the east clerestory in IMG_9952.
 const ac=box('Living_air_conditioner',[11.19,2.32,10.0],[.22,.30,.86],m.white,groups.Fixed,.025);ac.userData.itemId='living-air-conditioner';house.inventory.push({id:'living-air-conditioner',kind:'fixed fitting',room:'living',position:[11.19,2.32,10],size:[.22,.30,.86],refs:['IMG_9952.JPG'],note:'Wall-mounted air conditioner above east clerestory; size estimated from photo.',confidence:'Photo-backed; dimensions estimated',objectName:ac.name});
 for(let i=0;i<5;i++)box('AC_louvre',[11.068,2.24+i*.015,10.0],[.012,.007,.72],m.wall,groups.Fixed);
 // Restrained acoustic ceiling detail in bathroom; no floating electrical fittings.
 const acoustic=m.wall.clone();acoustic.name='Bathroom acoustic panel';acoustic.color.set('#dbd8cf');
 for(let x=2.62;x<4.8;x+=.6)for(let z=.10;z<2.5;z+=.6)box('Bathroom_acoustic_panel',[x+.20,2.466,z+.20],[.39,.018,.39],acoustic,groups.Ceilings);
 await hedge(groups,m,mesh,box);
 root.updateMatrixWorld(true);
}
async function hedge(groups,m,mesh,box){
 // Individual folded leaves replace the earlier polygonal shrub balls.
 const leaves=[],leaf=new THREE.BufferGeometry();leaf.setAttribute('position',new THREE.Float32BufferAttribute([0,.01,0,-.07,0,0,0,0,.03,.07,0,0,0,0,-.03],3));leaf.setAttribute('uv',new THREE.Float32BufferAttribute([.5,.5,0,.5,.5,1,1,.5,.5,0],2));leaf.setIndex([0,1,2,0,2,3,0,3,4,0,4,1]);leaf.computeVertexNormals();let seed=77;const rand=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
 const matrix=new THREE.Matrix4(),q=new THREE.Quaternion();
 const edges=site.parcel.slice(0,-1).map((a,i)=>({a,b:site.parcel[i+1],length:Math.hypot(site.parcel[i+1][0]-a[0],site.parcel[i+1][1]-a[1])})).filter(e=>(e.a[1]+e.b[1])/2>-5);
 // The photo shows a low white fence, rather than a hedge, at the east front boundary.
 for(const e of edges){if(e.a[0]>13&&e.b[0]>13&&Math.min(e.a[1],e.b[1])<0){const a=[...e.a],b=[...e.b],t=(0-a[1])/(b[1]-a[1]),cut=[a[0]+t*(b[0]-a[0]),0];if(a[1]<0)e.a=cut;else e.b=cut;e.length=Math.hypot(e.b[0]-e.a[0],e.b[1]-e.a[1]);}}
 const total=edges.reduce((n,e)=>n+e.length,0);
 for(let i=0;i<14000;i++){let distance=rand()*total,edge=edges[0];for(const e of edges){edge=e;if(distance<e.length)break;distance-=e.length;}const t=distance/edge.length,x=edge.a[0]+t*(edge.b[0]-edge.a[0]),z=edge.a[1]+t*(edge.b[1]-edge.a[1]),y=.12+rand()*1.65;
 q.setFromEuler(new THREE.Euler(rand()*3,rand()*6,rand()*3));const s=.65+rand()*.9;matrix.compose(new THREE.Vector3(x+(rand()-.5)*.5,y,z+(rand()-.5)*.5),q,new THREE.Vector3(s,s,s));leaves.push(leaf.clone().applyMatrix4(matrix));}
 const foliage=m.green.clone();foliage.name='Boundary foliage';foliage.color.set('#425638');foliage.roughness=.92;foliage.side=THREE.DoubleSide;
 mesh('Layered_boundary_leaves',mergeGeometries(leaves,false),foliage,[0,0,0],groups.Garden);for(const g of leaves)g.dispose();leaf.dispose();
 const core=foliage.clone();core.color.set('#bec6a9');
 const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const ctx=canvas.getContext('2d');ctx.fillStyle='#203420';ctx.fillRect(0,0,512,512);for(let i=0;i<2200;i++){ctx.fillStyle=['#3c5534','#4d633b','#2d482a','#526740'][i%4];ctx.beginPath();ctx.ellipse(rand()*512,rand()*512,3+rand()*9,2+rand()*4,rand()*6,0,Math.PI*2);ctx.fill();}const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;map.wrapS=map.wrapT=THREE.RepeatWrapping;map.repeat.set(10,1);core.map=map;
for(const e of edges){const o=box('Mapped_boundary_hedge',[(e.a[0]+e.b[0])/2,.85,(e.a[1]+e.b[1])/2],[e.length,1.7,.30],core,groups.Garden,.04);o.rotation.y=-Math.atan2(e.b[1]-e.a[1],e.b[0]-e.a[0]);}
}
