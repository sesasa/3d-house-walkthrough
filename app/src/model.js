import {buildYard} from './yard.js';
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {materials} from './materials.js';
import {rooms,walls,cabinets,accuracyNotes,doorsClosed} from './property.js';
import {sewnPillow} from './upholstery.js';
import {refineQuality} from './quality.js';
import {addScannedAssets} from './scanned-assets.js';
export async function buildHouse(){
 const m=await materials(),root=new THREE.Group();root.name='Danish_Villa';
 const groups={};for(const name of ['Architecture','Floors','Fixed','Windows','Furniture','Ceilings','Roof','Garden']){groups[name]=new THREE.Group();groups[name].name=name;root.add(groups[name]);}
 const colliders=[],inventory=[],mirrors=[];
 function mesh(name,g,mat,pos,parent=groups.Fixed){const o=new THREE.Mesh(g,mat);o.name=name;o.position.set(...pos);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
 function box(name,pos,size,mat,parent=groups.Fixed,r=0){return mesh(name,r?new RoundedBoxGeometry(...size,2,r):new THREE.BoxGeometry(...size),mat,pos,parent);}
 function cyl(name,pos,r,h,mat,parent=groups.Fixed){return mesh(name,new THREE.CylinderGeometry(r,r,h,24),mat,pos,parent);}
 function tube(name,points,r,mat,parent=groups.Fixed){return mesh(name,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),24,r,8,false),mat,[0,0,0],parent);}
 function collider(x,z,w,d,name){colliders.push({minX:x-w/2,maxX:x+w/2,minZ:z-d/2,maxZ:z+d/2,name});}
 function uvMetres(o){const p=o.geometry.attributes.position,n=o.geometry.attributes.normal,uv=o.geometry.attributes.uv;for(let i=0;i<p.count;i++){const ax=Math.abs(n.getX(i)),ay=Math.abs(n.getY(i));uv.setXY(i,ax>.8?p.getZ(i):p.getX(i),ay>.8?p.getZ(i):p.getY(i));}return o;}
 function register(id,kind,room,pos,size,refs,note,object,confidence='Photo-backed placement; dimensions estimated'){
  object.userData.itemId=id;inventory.push({id,kind,room,position:pos,size,refs:refs.map(n=>`IMG_${n}.JPG`),note,confidence,objectName:object.name});
 }
 // Floors join at the open kitchen/living throat, with no invented divider.
 for(const r of rooms)for(const b of [r.bounds,...(r.extra||[])]){const [x,z,x2,z2]=b;uvMetres(box(r.id+'_floor',[(x+x2)/2,-.035,(z+z2)/2],[x2-x,.07,z2-z],m[r.floor],groups.Floors));}
 uvMetres(box('Open_kitchen_living_threshold',[6.405,-.035,8.07],[2.33,.07,.12],m.wood,groups.Floors));
 // Wall openings generate all trim and blocking geometry together.
 for(const wall of walls){
  const thick=wall.outer?.24:.12,isX=wall.axis==='x',height=3.05;
  const pos=(t,y)=>isX?[t,y,wall.at]:[wall.at,y,t],size=(length,h,depth=thick)=>isX?[length,h,depth]:[depth,h,length];
  function segment(a,b,lo,hi){if(b-a<.001||hi-lo<.001)return;
   const center=pos((a+b)/2,(lo+hi)/2),mat=wall.id==='east'&&center[2]<4.08?m.bedWall:wall.id==='north'&&center[0]>6.70?m.bedWall:wall.id.includes('hall')?m.hall:m.wall;
   const mats=Array(6).fill(mat);
   // Hall paint belongs only on the hall-facing surface of shared partitions.
   if(wall.id==='bath-hall'||wall.id==='wc-hall-step'){mats.fill(m.wall);mats[0]=m.hall;}
   if(wall.id==='hall-primary'){mats.fill(m.wall);mats[1]=m.hall;}
   if(wall.id==='wc-hall-return'){mats.fill(m.wall);mats[4]=m.hall;}
   if(wall.outer)mats[isX?(wall.inside===1?5:4):(wall.inside===1?1:0)]=m.brick;
   uvMetres(box(`${wall.id}_wall`,center,size(b-a,hi-lo),mats,groups.Architecture));
   if(lo<1.6&&hi>.2)collider(center[0],center[2],isX?b-a:thick,isX?thick:b-a,wall.id);
   if(lo===0)for(const sign of [-1,1]){const p=pos((a+b)/2,.04);p[isX?2:0]+=sign*(thick/2+.009);box('Skirting',p,size(b-a,.08,.018),m.white,groups.Architecture);}
  }
  let cursor=wall.start;
  for(const opening of wall.openings){const {a,b,sill,head,id,kind}=opening,len=b-a;
   segment(cursor,a,0,height);segment(a,b,0,sill);segment(a,b,head,height);cursor=b;
   const assembly=new THREE.Group();assembly.name=id;groups.Windows.add(assembly);
   for(const t of [a,b])box('Frame_jamb',pos(t,(head+sill)/2),size(.055,head-sill,thick+.035),m.white,assembly);
   box('Frame_head',pos((a+b)/2,head),size(len+.05,.055,thick+.035),m.white,assembly);
   if(kind==='window'){
    box('Window_sill',pos((a+b)/2,sill),size(len+.07,.04,thick+.10),m.white,assembly);
    box('Window_glass',pos((a+b)/2,(head+sill)/2),size(len,head-sill,.008),opening.opaque?m.frost:m.glass,assembly).castShadow=false;
    for(const f of opening.divisions||[])box('Window_mullion',pos(a+len*f,(head+sill)/2),size(.045,head-sill,.065),m.white,assembly);
    if(opening.transom)box('Window_transom',pos((a+b)/2,opening.transom),size(len,.038,.065),m.white,assembly);
    const p=pos((a+b)/2,0);collider(p[0],p[2],isX?len:thick,isX?thick:len,id);
   }else{
    const halves=opening.double?2:1;
    for(let i=0;i<halves;i++){
     const first=opening.double?i===0:opening.hinge==='a',sign=first?1:-1;
     const angle=THREE.MathUtils.degToRad(opening.openDegrees),side=['east','south'].includes(opening.opensTo)?1:-1;
     // Closed leaf direction follows the wall; the perpendicular component
     // explicitly points into the room/outdoors recorded in the door schedule.
     const dx=isX?sign*Math.cos(angle):side*Math.sin(angle),dz=isX?side*Math.sin(angle):sign*Math.cos(angle);
     const leaf=new THREE.Group();leaf.name=id+'_open_leaf_'+i;leaf.position.set(...pos(first?a:b,0));leaf.rotation.y=Math.atan2(-dz/sign,dx/sign);assembly.add(leaf);
     const w=len/halves-.04;leaf.userData.handing={hinge:first?'a':'b',opensTo:opening.opensTo,openDegrees:opening.openDegrees,width:w};
     box('Door_leaf',[sign*w/2,head/2,0],[w,head-.04,.036],opening.glazed?m.glass:m.white,leaf,.006);
     for(const x of [0,sign*w])box('Door_stile',[x,head/2,0],[.07,head,.055],m.white,leaf);
     for(const y of opening.glazed?[.08,.65,1.35,head-.05]:[.08,.85,1.95])box('Door_rail',[sign*w/2,y,.024],[w,.075,.018],m.white,leaf);
     if(!opening.glazed)for(const [y,h] of [[.46,.61],[1.4,.9]])box('Recessed_door_panel',[sign*w/2,y,.025],[w-.18,h,.01],m.white,leaf,.008);
     tube('Door_handle',[[sign*(w-.11),1.0,.06],[sign*(w-.22),1.0,.06]],.009,m.chrome,leaf);
    }
    // Floor threshold closes the space between adjacent room floor slabs.
    if(doorsClosed){const p=pos((a+b)/2,0);collider(p[0],p[2],isX?len:.06,isX?.06:len,id+'_closed');}
    const center=pos((a+b)/2,-.028);box('Door_threshold',center,size(len,.04,thick+.05),m.tile,groups.Floors);
   }
   register(id,kind,opening.room,pos((a+b)/2,(head+sill)/2),size(len,head-sill),opening.refs,kind==='door'?`Main-plan hinge: ${opening.hinge}; opens ${opening.opensTo}. Shown at ${opening.openDegrees}° for walking; angle is a presentation choice.`:'One opening confirmed in plan and photographs.',assembly,opening.confidence);
  }
  segment(cursor,wall.end,0,height);
 }
 // Pitched ceilings are essential to the character of this house. Heights
 // outside the annotated living room remain photo-derived estimates.
 for(const r of rooms){const [x,z,x2,z2]=r.bounds,cx=(x+x2)/2,cz=(z+z2)/2;
  if(r.ceiling==='flat')box(r.id+'_ceiling',[cx,r.height,cz],[x2-x,.06,z2-z],m.white,groups.Ceilings);
  else{
   const alongX=r.ceiling==='gableX',half=(alongX?z2-z:x2-x)/2,drop=r.height-r.eave,angle=Math.atan2(drop,half),length=Math.hypot(half,drop);
   for(const side of [-1,1]){const ceiling=box(r.id+'_pitched_ceiling',[alongX?cx:cx+side*half/2,(r.height+r.eave)/2,alongX?cz+side*half/2:cz],[alongX?x2-x:length,.06,alongX?length:z2-z],m.white,groups.Ceilings);if(alongX)ceiling.rotation.x=side*angle;else ceiling.rotation.z=-side*angle;}
  }
  for(const b of r.extra||[]){box(r.id+'_alcove_ceiling',[(b[0]+b[2])/2,r.height,(b[1]+b[3])/2],[b[2]-b[0],.06,b[3]-b[1]],m.white,groups.Ceilings);}
 }
 // Cabinet carcasses are hollow, allowing genuine basin recesses and glass fronts.
 function cabinet(c){
  const g=new THREE.Group();g.name=c.id;g.position.set(c.x,c.y,c.z);g.rotation.y=c.angle;groups.Fixed.add(g);
  const {w,d,h}=c;
  for(const x of [-w/2+.015,w/2-.015])box('Cabinet_side',[x,h/2,0],[.03,h,d],m.white,g,.003);
  box('Cabinet_back',[0,h/2,-d/2+.012],[w,h,.025],m.white,g);
  box('Cabinet_base',[0,.04,0],[w,.06,d],m.white,g);
  if(!c.sink&&!c.vanity)box('Cabinet_top',[0,h-.02,0],[w,.04,d],m.white,g);
  const cell=w/c.doors;
  function panel(x,y,pw,ph,glass=false){
   box('Cabinet_door_panel',[x,y,d/2+.012],[pw,ph,.02],glass?m.glass:m.white,g,.003);
   if(!c.plain){for(const dx of [-pw/2+.024,pw/2-.024])box('Cabinet_stile',[x+dx,y,d/2+.028],[.044,ph,.022],m.white,g,.002);for(const dy of [-ph/2+.024,ph/2-.024])box('Cabinet_rail',[x,y+dy,d/2+.028],[pw-.092,.044,.022],m.white,g,.002);}
   if(ph>.18)tube('Cabinet_pull',[[x-.065,y+ph*.27,d/2+.046],[x-.065,y+ph*.27,d/2+.065],[x+.065,y+ph*.27,d/2+.065],[x+.065,y+ph*.27,d/2+.046]],.006,m.chrome,g);
  }
  for(let j=0;j<c.doors;j++){
   const x=-w/2+cell*(j+.5),pw=cell-.012;
   if(c.oven){panel(x,.21,pw,.30);panel(x,2.02,pw,.35);for(const y of [.72,1.37]){box('Built_in_oven',[x,y,d/2+.026],[pw,.58,.05],m.dark,g,.012);box('Oven_control_strip',[x,y+.22,d/2+.06],[pw-.04,.08,.012],m.steel,g);tube('Oven_handle',[[x-.21,y+.13,d/2+.10],[x+.21,y+.13,d/2+.10]],.01,m.chrome,g);}}
   else if(c.fridge){panel(x,.39,pw,.59);panel(x,1.36,pw,1.31);panel(x,2.10,pw,.21);box('Fridge_vent',[x,.13,d/2+.026],[pw-.08,.065,.008],m.dark,g);}
   else if(c.laundry){panel(x,.23,pw,.31);box('Laundry_machine',[x,.91,d/2-.1],[pw,.84,.23],m.white,g,.01);const ring=mesh('Laundry_door',new THREE.TorusGeometry(.19,.025,10,32),m.steel,[x,.86,d/2+.032],g);const disc=cyl('Laundry_door_glass',[x,.86,d/2+.035],.167,.015,m.dark,g);disc.rotation.x=Math.PI/2;panel(x,1.91,pw,.60);box('Laundry_controls',[x,1.20,d/2+.035],[pw-.07,.075,.015],m.steel,g);}
   else if(c.vanity){for(let k=0;k<2;k++)panel(x,.12+(h-.16)/4+k*(h-.16)/2,pw,(h-.16)/2-.008);}
   else if(c.glass&&h>1.5){panel(x,.49,pw,.86);panel(x,1.48,pw,1.05,true);for(const y of [1.0,1.27,1.55,1.83]){box('Display_shelf',[x,y,0],[pw,.016,d-.04],m.glass,g);box('Folded_towel',[x,y+.045,0],[pw*.8,.07,d*.72],m.linen,g,.015);}}
   else{panel(x,h/2+.015,pw,h-.12,Boolean(c.glass));if(c.glass)for(const y of [.2,.45])box('Glass_cabinet_shelf',[x,y,0],[pw,.016,d-.04],m.white,g);}
  }
  if(c.y===0)box('Cabinet_recessed_plinth',[0,.055,-.025],[w-.07,.11,d-.07],m.white,g);
  if(c.worktop||c.vanity){
   const basinCount=c.vanity&&w>1?2:1,shape=new THREE.Shape();shape.moveTo(-w/2-.015,-d/2-.02);shape.lineTo(w/2+.015,-d/2-.02);shape.lineTo(w/2+.015,d/2+.035);shape.lineTo(-w/2-.015,d/2+.035);shape.closePath();
   if(c.sink||c.vanity)for(let i=0;i<basinCount;i++){const x=(basinCount===2?(i-.5)*w*.5:0)+(c.sinkOffset||0),hole=new THREE.Path();hole.absellipse(x,0,c.vanity?.19:.25,c.vanity?.16:.19,0,Math.PI*2,true);shape.holes.push(hole);}
   const top=new THREE.ExtrudeGeometry(shape,{depth:.035,bevelEnabled:true,bevelThickness:.002,bevelSize:.002,bevelSegments:2,steps:1,curveSegments:32});top.rotateX(-Math.PI/2);mesh('Stone_countertop',top,c.vanity?m.ceramic:m.white,[0,h+.035,0],g);
   if(c.sink||c.vanity)for(let i=0;i<basinCount;i++){const x=(basinCount===2?(i-.5)*w*.5:0)+(c.sinkOffset||0),r=c.vanity?.19:.25;
    const profile=[[0,-.145],[r*.6,-.14],[r,-.01],[r+.012,.008],[r,.015],[r-.012,0],[r*.7,-.11],[.02,-.125]].map(v=>new THREE.Vector2(...v));const b=mesh('Recessed_basin',new THREE.LatheGeometry(profile,32),c.vanity?m.ceramic:m.steel,[x,h+.075,0],g);b.scale.z=c.vanity?.84:.76;
    cyl('Basin_drain',[x,h-.05,0],.018,.005,m.chrome,g);
    tube('Mixer_tap',[[x,h+.06,-.22],[x,h+(c.vanity?.23:.40),-.22],[x,h+(c.vanity?.25:.44),-.07],[x,h+(c.vanity?.21:.34),-.035]],.012,m.chrome,g);
   }
  }
  if(c.vanity){const mw=w-.05,mh=c.room==='wc'?.65:.97,centerY=c.room==='wc'?1.43:1.62;
   const mirror=box('Mirror_surface',[0,centerY-c.y,-d/2+.035],[mw,mh,.018],m.mirror,g);mirrors.push(mirror);
   for(const x of (c.room==='wc'?[-mw/2,mw/2]:[-mw/2,-mw/4,0,mw/4,mw/2]))box('Mirror_frame',[x,centerY-c.y,-d/2+.055],[.032,mh,.025],m.white,g);
  }
  if(c.vanity&&c.room!=='wc'){for(const y of [1.135,2.105])box('Mirror_cabinet_edge',[0,y-c.y,-d/2+.035],[w,.025,.12],m.white,g);}
  const rw=Math.abs(Math.cos(c.angle))*w+Math.abs(Math.sin(c.angle))*d,rd=Math.abs(Math.sin(c.angle))*w+Math.abs(Math.cos(c.angle))*d;
  if(c.y<1.62)collider(c.x,c.z,rw,rd,c.id);
  register(c.id,'cabinet',c.room,[c.x,c.y+h/2,c.z],[rw,h,rd],c.refs,c.note,g);
 }
 cabinets.forEach(cabinet);
 // Continuous warm splashback on the hob run, not a fictitious window.
 uvMetres(box('Kitchen_hob_splashback',[.035,1.18,6.53],[.024,.57,2.77],m.splash));
 box('Induction_hob',[.35,.94,6.30],[.47,.025,.62],m.dark,groups.Fixed,.008);
 for(const z of [6.14,6.45])for(const x of [.21,.47]){const ring=mesh('Induction_zone',new THREE.TorusGeometry(.075,.002,6,32),m.steel,[x,.955,z]);ring.rotation.x=Math.PI/2;}
 const hood=box('Concealed_extractor',[.30,1.53,6.3],[.56,.10,.64],m.steel);register('kitchen-hob-extractor','appliance','kitchen',[.3,1.23,6.3],[.6,.64,.64],[9958],'Induction hob and integrated extractor on west wall; exact module position estimated.',hood);
 function toilet(id,x,z,angle,room){const g=new THREE.Group();g.name=id;g.position.set(x,0,z);g.rotation.y=angle;groups.Fixed.add(g);box('Concealed_cistern',[0,.51,-.12],[.4,1.02,.2],m.wall,g,.02);
  const profile=[[0,.09],[.12,.09],[.14,.25],[.20,.41],[.19,.45],[.16,.44],[.12,.31],[0,.28]].map(v=>new THREE.Vector2(...v));const b=mesh('WC_bowl',new THREE.LatheGeometry(profile,32),m.ceramic,[0,0,.15],g);b.scale.z=1.3;
  const seat=mesh('WC_seat',new THREE.TorusGeometry(.179,.013,8,40),m.ceramic,[0,.451,.15],g);seat.rotation.x=Math.PI/2;seat.scale.y=1.35;
  // The reference photographs show a closed oval lid, not a dark open bowl.
  const lid=mesh('WC_closed_lid',new THREE.SphereGeometry(1,40,20),m.ceramic,[0,.467,.15],g);lid.scale.set(.188,.018,.245);
  collider(x,z,.43,.68,id);register(id,'sanitary',room,[x,.50,z],[.43,1.02,.68],room==='wc'?[9949,9955]:[9946], 'Toilet position follows plan and photos; fixture dimensions estimated.',g);
 }
 toilet('bath-wc',4.36,.39,0,'bathroom');toilet('guest-wc',4.03,3.77,Math.PI,'wc');
 // Two rain showers in the long recessed bay, with a real glass partition.
 const shower=new THREE.Group();shower.name='double-shower';groups.Fixed.add(shower);
 uvMetres(box('Shower_west_tile',[2.535,1.19,3.32],[.026,2.38,1.50],m.bathTile,shower));uvMetres(box('Shower_end_tile',[3.04,1.19,4.055],[1.04,2.38,.025],m.bathTile,shower));uvMetres(box('Shower_east_tile',[3.545,1.19,3.32],[.025,2.38,1.5],m.bathTile,shower));
 for(const z of [2.98,3.73]){tube('Shower_riser',[[2.61,1.05,z],[2.61,2.10,z],[2.91,2.12,z]],.012,m.chrome,shower);cyl('Rain_shower',[2.91,2.09,z],.105,.02,m.chrome,shower);tube('Shower_hose',[[2.62,1.04,z],[2.69,.67,z+.12],[2.73,1.55,z+.13]],.005,m.chrome,shower);}
 box('Shower_fixed_glass',[3.31,1.12,2.60],[.48,2.18,.009],m.glass,shower).castShadow=false;
 box('Shower_open_glass_door',doorsClosed?[2.85,1.12,2.60]:[2.58,1.12,2.31],doorsClosed?[.58,2.18,.009]:[.009,2.18,.58],m.glass,shower).castShadow=false;
 collider(3.31,2.60,.48,.009,'Shower_screen');
 register('double-shower','sanitary','bathroom',[3.04,1.19,3.34],[1.04,2.38,1.48],[9948,9954],'Twin shower heads in southwest recess; screen door hinged at west jamb, opening north into bathroom per main plan; panel proportions estimated.',shower);
 // Full-height towel radiator, visibly anchored to the north bathroom wall.
 const rail=new THREE.Group();rail.name='bath-towel-radiator';groups.Fixed.add(rail);
 for(const x of [3.11,3.62])cyl('Radiator_upright',[x,1.1,.10],.012,1.82,m.white,rail);
 for(let i=0;i<26;i++)tube('Radiator_rail',[[3.11,.22+i*.066,.10],[3.62,.22+i*.066,.10]],.009,m.white,rail);
 register('bath-towel-radiator','fixed fitting','bathroom',[3.365,1.1,.1],[.55,1.82,.08],[9946,9947],'Tall white towel rail beside high window.',rail);
 const stove=new THREE.Group();stove.name='dining-wood-stove';stove.position.set(7.42,0,4.58);groups.Fixed.add(stove);box('Wood_stove',[0,.45,0],[.48,.90,.43],m.dark,stove,.025);box('Stove_glass',[0,.47,.223],[.32,.5,.012],m.glass,stove);cyl('Stove_flue',[0,1.86,0],.065,1.96,m.dark,stove);collider(7.42,4.58,.54,.50,stove.name);register(stove.name,'fixed fitting','kitchen',[7.42,1.43,4.58],[.54,2.86,.5],[9941,9959],'Black stove beside office wall, with vertical flue.',stove);
 // Loose furnishings follow the photos and remain separately hideable.
 function furnitureBox(name,pos,size,mat,r=.015){return box(name,pos,size,mat,groups.Furniture,r);}
 function table(name,x,z,w,d,h=.76){furnitureBox(name,[x,h,z],[w,.05,d],m.oak,.012);for(const sx of [-1,1])for(const sz of [-1,1])furnitureBox('Table_leg',[x+sx*(w/2-.08),h/2,z+sz*(d/2-.08)],[.065,h,.065],m.oak,.006);collider(x,z,w,d,name);}
 table('Dining_table',4.3,6.26,2.05,1.04);
 const pendant=new THREE.Group();pendant.name='Dining_five_arm_pendant';groups.Fixed.add(pendant);
 cyl('Pendant_stem',[4.3,2.40,6.26],.013,.60,m.chrome,pendant);
 for(let i=0;i<5;i++){const a=i*Math.PI*2/5,x=4.3+Math.cos(a)*.36,z=6.26+Math.sin(a)*.36;tube('Pendant_arm',[[4.3,2.15,6.26],[x,2.05,z],[x,2.19,z]],.012,m.chrome,pendant);mesh('Opal_shade',new THREE.SphereGeometry(.105,16,12),m.ceramic,[x,2.22,z],pendant);}
 register('dining-pendant','fixed fitting','kitchen',[4.3,2.38,6.26],[.94,.66,.94],[9958],'Five-arm opal-glass pendant above the dining table; dimensions estimated.',pendant);

 function chair(x,z,angle){const g=new THREE.Group();g.name='Oak_dining_chair';g.position.set(x,0,z);g.rotation.y=angle;groups.Furniture.add(g);box('Chair_seat',[0,.46,0],[.44,.055,.44],m.oak,g,.015);box('Chair_seat_cushion',[0,.5,0],[.39,.045,.38],m.leather,g,.02);for(const sx of [-1,1])for(const sz of [-1,1])box('Chair_leg',[sx*.18,.23,sz*.18],[.04,.46,.04],m.oak,g,.005);for(const x of [-.18,0,.18])box('Chair_back_slat',[x,.74,-.18],[.075,.43,.04],m.oak,g,.006);box('Chair_back_rail',[0,.97,-.18],[.44,.06,.05],m.oak,g,.007);}
 for(const x of [3.63,4.32,4.99]){chair(x,5.46,0);chair(x,7.08,Math.PI);}
 function sofa(x,z,w,angle){const g=new THREE.Group();g.name='Leather_sofa';g.position.set(x,0,z);g.rotation.y=angle;groups.Furniture.add(g);box('Sofa_base',[0,.27,0],[w,.34,.85],m.leather,g,.055);box('Sofa_back',[0,.70,-.34],[w,.75,.18],m.leather,g,.05);for(const sign of [-1,1]){box('Sofa_arm',[sign*(w/2-.07),.55,0],[.14,.45,.89],m.leather,g,.055);tube('Bentwood_arm_trim',[[sign*w/2,.7,-.30],[sign*w/2,.73,.08],[sign*w/2,.66,.39]],.025,m.oak,g);}const count=Math.round(w/.65);for(let j=0;j<count;j++){const sx=(j-(count-1)/2)*(w-.25)/count;box('Leather_seat_cushion',[sx,.49,.07],[(w-.25)/count-.015,.16,.66],m.leather,g,.055);box('Leather_back_cushion',[sx,.78,-.20],[(w-.25)/count-.01,.45,.14],m.leather,g,.05);}collider(x,z,Math.abs(Math.cos(angle))*w+Math.abs(Math.sin(angle))*.85,Math.abs(Math.sin(angle))*w+Math.abs(Math.cos(angle))*.85,'Sofa');}
 sofa(10.45,10.37,2.65,-Math.PI/2);sofa(8.05,10.37,1.85,Math.PI/2);table('Living_coffee_table',9.27,10.38,.88,1.48,.43);

 for(const x of [8.78,10.05]){recliner(x,12.13,Math.PI);}
 furnitureBox('Media_unit',[8.30,.35,8.41],[1.75,.58,.42],m.oak);furnitureBox('Television',[8.30,1.02,8.35],[1.12,.67,.045],m.dark);
 function recliner(x,z,angle){const g=new THREE.Group();g.name='Bentwood_leather_recliner';g.position.set(x,0,z);g.rotation.y=angle;groups.Furniture.add(g);
 const ring=mesh('Recliner_round_wood_base',new THREE.TorusGeometry(.31,.038,10,48),m.oak,[0,.09,0],g);ring.rotation.x=Math.PI/2;
 for(const sign of [-1,1])tube('Recliner_bentwood_support',[[sign*.24,.12,.23],[sign*.18,.22,-.08],[sign*.22,.45,-.16],[sign*.29,.67,.09]],.033,m.oak,g);
 box('Leather_seat_cushion',[0,.45,.045],[.59,.16,.55],m.leather,g,.06);const back=box('Leather_back_cushion',[0,.89,-.21],[.64,.87,.19],m.leather,g,.065);back.rotation.x=-.14;
 for(const sign of [-1,1])box('Recliner_arm',[sign*.36,.64,.035],[.15,.15,.62],m.leather,g,.065);
 collider(x,z,.85,.90,'Recliner');}
 const bed=new THREE.Group();bed.name='Main_bed';bed.position.set(10.28,0,2.04);bed.rotation.y=-Math.PI/2;groups.Furniture.add(bed);
 box('Bed_base',[0,.23,0],[1.65,.30,2.05],m.white,bed,.035);box('Mattress',[0,.45,0],[1.66,.22,2.06],m.linen,bed,.045);box('Black_headboard',[0,.79,-1.02],[1.76,1.08,.075],m.leather,bed,.025);
 const duvet=await new GLTFLoader().loadAsync(`${import.meta.env.BASE_URL}duvet.glb`);duvet.scene.updateMatrixWorld(true);let cloth;duvet.scene.traverse(o=>{if(o.isMesh)cloth=o.geometry.clone().applyMatrix4(o.matrixWorld).rotateY(Math.PI);});
 const bedding=mesh('Draped_duvet',cloth,m.linen,[0,.57,0],bed);bedding.scale.set(1.65/1.8,1,2.05/2);m.linen.side=THREE.DoubleSide;
 for(const x of [-.40,.40]){const pillow=mesh('Bed_pillow',sewnPillow(.65,.18,.4,x<0?1:2),m.linen,[x,.66,-.68],bed);pillow.rotation.y=x*.1;}
 collider(10.28,2.04,2.05,1.76,'Main_bed');
 table('Bed_foot_bench',9.04,2.04,.42,1.45,.43);
 for(const z of [.84,3.24])furnitureBox('Bedside_drawers',[10.99,.34,z],[.47,.68,.46],m.white);
 furnitureBox('Bedroom_chest',[7.20,.75,.95],[.48,1.5,1.5],m.white);
 furnitureBox('Bedroom_wall_TV',[7.02,1.83,1.15],[.045,.65,1.02],m.dark);
 table('Office_desk',10.77,6.22,.65,1.5,.75);for(const z of [5.90,6.5]){furnitureBox('Office_monitor',[10.84,1.08,z],[.045,.4,.51],m.dark);furnitureBox('Monitor_stand',[10.87,.83,z],[.025,.14,.04],m.dark);furnitureBox('Monitor_foot',[10.79,.786,z],[.22,.02,.24],m.dark);}
 chair(10.1,6.22,Math.PI/2);sofa(9.14,4.72,1.82,0);furnitureBox('Office_bookcase',[10.12,1.0,7.76],[1.18,2.0,.3],m.oak);
 for(let i=0;i<14;i++)furnitureBox('Office_book',[9.67+i*.069,.70,7.57],[.045,.25,.20],i%3?m.linen:m.blue,.001);
 furnitureBox('Entrance_blue_dresser',[5.18,.5,.58],[.44,1.0,.90],m.blue);
 buildYard(groups.Garden,m);

 // Roof is a contextual exterior approximation, kept separate from the
 // room ceiling surfaces that follow the interior photographs.
 for(const sign of [-1,1]){const g=uvMetres(box('Main_pitched_roof',[5.68,3.42,4.02+sign*2.25],[12.1,.12,4.7],m.roof,groups.Roof));g.rotation.x=sign*.25;}
 for(const sign of [-1,1]){const g=uvMetres(box('Living_pitched_roof',[8.41+sign*1.63,3.15,10.76],[3.42,.12,5.3],m.roof,groups.Roof));g.rotation.z=-sign*.23;}
 const house={root,groups,rooms,materials:m,colliders,inventory,mirrors};
 await refineQuality(house);await addScannedAssets(house);
 // Furniture was authored against the first pass. Translate whole assemblies
 // with their labelled rooms; keep their physical sizes unchanged.
 for(const o of groups.Furniture.children){if(o.position.z>=8.13||(o.position.z<4.2&&o.position.x>=6.79)||(o.position.z>=4.2&&o.position.x>=7.78))o.position.x-=.21;}
 const furnitureColliders=new Set(['Sofa','Recliner','Main_bed','Living_coffee_table','Bed_foot_bench','Office_desk','Living_oak_storage']);
 for(const c of colliders)if(furnitureColliders.has(c.name)){c.minX-=.21;c.maxX-=.21;}
 for(const o of groups.Fixed.children)if(o.name==='dining-wood-stove'||o.name==='Living_air_conditioner'||o.name==='AC_louvre')o.position.x-=.21;
 for(const item of inventory)if(['dining-wood-stove','living-air-conditioner'].includes(item.id))item.position[0]-=.21;
 const stoveCollider=colliders.find(c=>c.name==='dining-wood-stove');stoveCollider.minX-=.21;stoveCollider.maxX-=.21;

 for(const item of inventory){const opening=walls.flatMap(w=>w.openings).find(o=>o.id===item.id);if(opening?.measurement)item.measurement=opening.measurement;}
 root.updateMatrixWorld(true);root.userData={...root.userData,property:'Danish Villa',accuracyNotes};
 return {root,groups,rooms,materials:m,colliders,inventory,mirrors};
}
