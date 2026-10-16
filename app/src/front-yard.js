import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// Photo-scaled front landscaping. All coordinates, UVs and modules use metres.
// The street width and planting heights are estimates, not surveyed dimensions.
export function buildFrontYard(garden, site, houseMaterials) {
  let seed=20260925;
  const rand=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
  const mat=(name,color)=>new THREE.MeshStandardMaterial({name,color,roughness:.9});
  const white=mat('Front gate white timber','#e5e5dd'),metal=mat('Front weathered galvanized metal','#92978e'),dark=mat('Garage brown timber surround','#3e3930'),roller=mat('Garage charcoal roller','#292c28'),bark=mat('Front tree bark','#615749');
  const mesh=(name,geo,material,pos=[0,0,0])=>{const o=new THREE.Mesh(geo,material);o.name=name;o.position.set(...pos);o.castShadow=o.receiveShadow=true;garden.add(o);return o;};
  const box=(name,x,y,z,w,h,d,material)=>mesh(name,new THREE.BoxGeometry(w,h,d),material,[x,y,z]);
  const mergedBoxes=(name,parts,material)=>{
    const geos=parts.map(([x,y,z,w,h,d,angle=0])=>new THREE.BoxGeometry(w,h,d).rotateY(angle).translate(x,y,z));
    const o=mesh(name,mergeGeometries(geos,false),material);geos.forEach(g=>g.dispose());return o;
  };
  function metreUV(geo){const p=geo.attributes.position,n=geo.attributes.normal,uv=geo.attributes.uv;for(let i=0;i<p.count;i++)uv.setXY(i,Math.abs(n.getX(i))>.8?p.getZ(i):p.getX(i),Math.abs(n.getY(i))>.8?p.getZ(i):p.getY(i));return geo;}
  function plane(name,b,y,material){const geo=new THREE.PlaneGeometry(b[2]-b[0],b[3]-b[1]);geo.rotateX(-Math.PI/2);geo.translate((b[0]+b[2])/2,y,(b[1]+b[3])/2);return mesh(name,metreUV(geo),material);}
  function imageTexture(data,size,color=true){const c=document.createElement('canvas');c.width=c.height=size;const ctx=c.getContext('2d');ctx.putImageData(new ImageData(data,size,size),0,0);const t=new THREE.CanvasTexture(c);t.colorSpace=color?THREE.SRGBColorSpace:THREE.NoColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;return t;}
  function pavers(name,w,d,worldSize,stagger,base,tint=[2,1,-3]){
    const n=1024,rgba=new Uint8ClampedArray(n*n*4),heights=new Float32Array(n*n),cols=Math.round(worldSize/w),rows=Math.round(worldSize/d);
    const tones=Array.from({length:rows*cols},()=>rand()*14-7);
    for(let y=0;y<n;y++)for(let x=0;x<n;x++){
      const row=Math.floor(y/n*rows),xx=x/n*cols+(stagger && row%2 ? .5 : 0),col=Math.floor(xx)%cols;
      const fx=xx%1,fy=(y/n*rows)%1,edge=Math.min(Math.min(fx,1-fx)*w,Math.min(fy,1-fy)*d);
      const bevel=THREE.MathUtils.smoothstep(edge,.0014,.0055),v=base+tones[row*cols+col]+(rand()-.5)*9-(1-bevel)*24;
      const i=(y*n+x)*4;rgba.set([v+tint[0],v+tint[1],v+tint[2],255],i);heights[y*n+x]=bevel*.0035;
    }
    const normals=new Uint8ClampedArray(n*n*4),step=worldSize/n;
    for(let y=0;y<n;y++)for(let x=0;x<n;x++){
      const dx=(heights[y*n+(x+1)%n]-heights[y*n+(x+n-1)%n])/(2*step),dy=(heights[((y+1)%n)*n+x]-heights[((y+n-1)%n)*n+x])/(2*step),v=new THREE.Vector3(-dx,dy,1).normalize();
      normals.set([(v.x*.5+.5)*255,(v.y*.5+.5)*255,(v.z*.5+.5)*255,255],(y*n+x)*4);
    }
    const m=mat(name,'#ffffff');m.map=imageTexture(rgba,n);m.normalMap=imageTexture(normals,n,false);for(const t of [m.map,m.normalMap])t.repeat.set(1/worldSize,1/worldSize);m.normalScale.set(.6,.6);return m;
  }
  function aggregate(name,base,size=512){const rgba=new Uint8ClampedArray(size*size*4);for(let i=0;i<size*size;i++){const v=base+(rand()-.5)*30;rgba.set([v+1,v,v-4,255],i*4);}const m=mat(name,'#ffffff');m.map=imageTexture(rgba,size);m.map.repeat.set(2,2);return m;}
  const brick=pavers('Photo ochre running-bond brick',.24,.06,1.44,true,153,[25,8,-26]);
  const roofTiles=pavers('Dark concrete roof tile modules',.30,.42,2.10,false,61,[0,2,0]);
  for(const [target,source] of [[houseMaterials.brick,brick],[houseMaterials.roof,roofTiles]]){target.map=source.map;target.normalMap=source.normalMap;target.normalScale.set(.4,.4);target.color.set('#ffffff');target.needsUpdate=true;}
  const paving=pavers('Front 21 by 14 cm staggered pavers',.21,.14,1.68,true,143);
  const sidewalk=pavers('Street 60 cm concrete sidewalk slabs',.60,.60,2.4,false,167);
  const gravel=aggregate('Front pale stone gravel',185),asphalt=aggregate('Street fine grey asphalt',65),curb=mat('Front concrete edging','#929084');
  // Front boundary is Z ~= -5.46 m. The garage stays recessed, as photographed.
  plane('Front_block_paving',[-6.60,-5.44,13.64,-.24],-.065,paving);
  plane('Garage_block_drive',[-6.60,-.24,-.24,4.42],-.065,paving);
  plane('Front_sidewalk_east',[1.55,-6.72,25,-5.46],-.073,sidewalk);
  plane('Front_sidewalk_west',[-18,-6.72,-6.6,-5.46],-.073,sidewalk);
  const apron=plane('Driveway_dropped_crossing',[-6.6,-6.72,1.55,-5.46],0,paving);const ap=apron.geometry.attributes.position;for(let i=0;i<ap.count;i++)ap.setY(i,THREE.MathUtils.lerp(-.135,-.065,(ap.getZ(i)+6.72)/1.26));apron.geometry.computeVertexNormals();
  plane('Street_asphalt',[-18,-12.37,25,-6.87],-.19,asphalt);
  plane('Opposite_sidewalk',[-18,-13.72,25,-12.52],-.073,sidewalk);
  const kerbs=[];for(let x=-18;x<25;x+=1){const dropped=x>=-7&&x<1;kerbs.push([x+.49,dropped?-.16:-.085,-6.80,.98,dropped?.07:.19,.15]);kerbs.push([x+.49,-.085,-12.445,.98,.19,.15]);}mergedBoxes('Street_kerbstones',kerbs,curb);
  // Curved walk to the existing front door, with gravel on both sides.
  const mainBed=new THREE.Shape();mainBed.moveTo(4.95,5.20);mainBed.lineTo(10.45,5.20);mainBed.quadraticCurveTo(11.0,5.20,11.0,4.60);mainBed.lineTo(11.0,2.0);mainBed.quadraticCurveTo(11.0,1.30,10.3,1.30);mainBed.lineTo(6.35,1.30);mainBed.bezierCurveTo(5.4,1.9,5.55,3.5,4.95,5.20);
  const smallBed=new THREE.Shape();smallBed.moveTo(1.65,5.20);smallBed.lineTo(3.70,5.20);smallBed.bezierCurveTo(4.28,3.8,4.35,2.15,5.0,1.30);smallBed.lineTo(2.30,1.30);smallBed.lineTo(1.65,5.20);
  function bed(name,shape){
    const geo=new THREE.ShapeGeometry(shape,32);geo.rotateX(-Math.PI/2);geo.translate(0,.035,0);mesh(name,metreUV(geo),gravel);
    const points=shape.getSpacedPoints(Math.ceil(shape.getLength()/.235)),blocks=[];
    for(let i=0;i<points.length-1;i++){const a=points[i],b=points[i+1],len=a.distanceTo(b);blocks.push([(a.x+b.x)/2,.025,-(a.y+b.y)/2,len-.008,.18,.15,Math.atan2(b.y-a.y,b.x-a.x)]);}
    mergedBoxes(name+'_stone_border',blocks,curb);
  }
  bed('Main_front_gravel_bed',mainBed);bed('Small_front_gravel_bed',smallBed);
  // Low stone rings around the two photographed plants.
  function ring(x,z,r){const parts=[];for(let i=0;i<16;i++){const a=i*Math.PI/8;parts.push([x+Math.cos(a)*r,.11,z+Math.sin(a)*r,.21,.22,.16,Math.PI/2-a]);}mergedBoxes('Plant_stone_ring',parts,curb);}
  ring(8.8,-3.72,.51);ring(6.8,-2.13,.73);
  function tree(name,x,z,height,rx,rz,leaves,variant){
    const parts=[],trunkTop=height*.58,trunk=new THREE.CylinderGeometry(.045,.075,trunkTop,10);trunk.translate(x,trunkTop/2,z);parts.push(trunk);
    for(let i=0;i<8;i++){const a=i*Math.PI/4,u=new THREE.Vector3(x,.55+rand()*.35,z),v=new THREE.Vector3(x+Math.cos(a)*rx*.6,height*.66+rand()*.15,z+Math.sin(a)*rz*.6),axis=v.clone().sub(u),g=new THREE.CylinderGeometry(.012,.025,axis.length(),7);g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),axis.normalize()));g.translate(...u.add(v).multiplyScalar(.5).toArray());parts.push(g);}
    mesh(name+'_branches',mergeGeometries(parts,false),bark);parts.forEach(g=>g.dispose());
    const base=new THREE.BufferGeometry();base.setAttribute('position',new THREE.Float32BufferAttribute([0,.009,0,-.055,0,0,0,0,.022,.055,0,0,0,0,-.022],3));base.setAttribute('uv',new THREE.Float32BufferAttribute([.5,.5,0,.5,.5,1,1,.5,.5,0],2));base.setIndex([0,1,2,0,2,3,0,3,4,0,4,1]);base.computeVertexNormals();const geometries=[],matrix=new THREE.Matrix4(),quat=new THREE.Quaternion(),colors=[];
    const palette=variant?['#6c773c','#849449','#566b32','#9b9f55']:['#415e2b','#547c32','#698d3a','#375423'];
    for(let i=0;i<leaves;i++){
      const az=rand()*Math.PI*2,v=rand()*2-1,r=Math.cbrt(.15+.85*rand()),horiz=Math.sqrt(1-v*v),cy=height*(variant?.69:.58),ry=height*(variant?.31:.42);
      const pos=new THREE.Vector3(x+Math.cos(az)*horiz*r*rx,cy+v*r*ry,z+Math.sin(az)*horiz*r*rz),s=.8+rand()*.65;
      quat.setFromEuler(new THREE.Euler(rand()*6,rand()*6,rand()*6));matrix.compose(pos,quat,new THREE.Vector3(s,s,s));geometries.push(base.clone().applyMatrix4(matrix));const col=new THREE.Color(palette[i%palette.length]);for(let j=0;j<5;j++)colors.push(col.r,col.g,col.b);
    }
    const geo=mergeGeometries(geometries,false);geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));const foliage=mat(name+' foliage','#ffffff');foliage.vertexColors=true;foliage.side=THREE.DoubleSide;mesh(name+'_leaves',geo,foliage);geometries.forEach(g=>g.dispose());base.dispose();
  }
  tree('Front_round_shrub',6.8,-2.13,2.05,1.06,.94,4500,false);
  tree('Front_small_tree',8.8,-3.72,1.95,.72,.68,2400,true);
  tree('Front_low_shrub',10.05,-2.50,.64,.55,.42,650,false);
  // White side gate at the east end of the existing front facade.
  const gate=site.front.gate,slats=[];for(let x=gate[0]+.07;x<gate[1];x+=.135)slats.push([x,.89,-.04,.125,1.73,.04]);
  for(const x of [gate[0],(gate[0]+gate[1])/2,gate[1]])slats.push([x,.90,-.04,.075,1.80,.09]);
  for(const y of [.25,1.5])slats.push([(gate[0]+gate[1])/2,y,.002,gate[1]-gate[0],.075,.07]);
  const fence=[];for(let z=-5.4;z<-.04;z+=.14)fence.push([13.67,.50,z,.04,1.12,.13]);for(const z of [-5.4,-3.6,-1.8,-.04])fence.push([13.67,.54,z,.09,1.20,.09]);for(const y of [.18,.85])fence.push([13.64,y,-2.72,.07,.075,5.42]);mergedBoxes('Front_east_white_boundary_fence',fence,white);
  mergedBoxes('Front_white_double_gate',slats,white);box('Gate_latch',(gate[0]+gate[1])/2-.1,1.05,-.075,.15,.028,.025,metal);
  // Garage is translated east to touch the house, retaining ~24 m² floor area.
  const [gx,gz,gx2]=site.garage.bounds,cx=(gx+gx2)/2;
  box('Garage_dark_front_surround',cx,1.17,gz-.012,gx2-gx,2.34,.025,dark);
  box('Garage_recessed_roller_door',cx,1.035,gz-.03,2.70,2.07,.025,roller);
  const ribs=[];for(let y=.085;y<2.05;y+=.075)ribs.push([cx,y,gz-.045,2.69,.009,.006]);mergedBoxes('Garage_roller_ribs',ribs,dark);
  box('Garage_door_handle',cx,.90,gz-.065,.075,.035,.025,metal);
  // Standalone letterbox near the kerb, not an invented wall fitting.
  box('Front_letterbox',3.65,.48,-5.05,.36,1.09,.30,metal);
  const cap=box('Letterbox_sloping_cap',3.65,1.045,-5.05,.39,.035,.34,metal);cap.rotation.x=-.18;
  box('Letterbox_slot',3.65,.85,-5.207,.27,.027,.012,dark);
  const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const ctx=canvas.getContext('2d');ctx.fillStyle='#92978e';ctx.fillRect(0,0,128,128);ctx.fillStyle='#273026';ctx.font='75px sans-serif';ctx.textAlign='center';ctx.fillText('5',64,94);const number=mat('Letterbox house number','#ffffff');number.map=new THREE.CanvasTexture(canvas);number.map.colorSpace=THREE.SRGBColorSpace;const face=mesh('Letterbox_number',new THREE.PlaneGeometry(.16,.16),number,[3.65,.67,-5.208]);face.rotation.y=Math.PI;
  garden.userData.front={paverModule:[.21,.14],sidewalkWidth:1.26,streetWidth:5.5,frontDoorX:5.515,garageToHouseGap:0,refs:['IMG_9937.JPG','IMG_9961.JPG'],estimates:site.front};
}
