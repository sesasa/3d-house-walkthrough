import * as THREE from 'three';
import site from './site.json';
import {buildFrontYard} from './front-yard.js';
// Simple exterior masses: mapped footprints, photo colours, quiet detail.
export function buildYard(group,m){
 const material=(name,color)=>new THREE.MeshStandardMaterial({name,color,roughness:.88});
 const white=material('Exterior painted white','#e9e9e1'),yellow=material('Garden ochre timber','#c5a04c'),dark=material('Garage dark timber','#34332e'),grey=material('Rear store neutral grey estimate','#909b94'),roof=material('Outbuilding charcoal roof','#454846'),paving=material('Outdoor grey paving','#989b93');
 const box=(name,x,y,z,w,h,d,mat)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);o.name=name;o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;group.add(o);return o;};
 const slab=(name,b,y,mat)=>box(name,(b[0]+b[2])/2,y,(b[1]+b[3])/2,b[2]-b[0],.06,b[3]-b[1],mat);
 const shape=new THREE.Shape();site.parcel.slice(0,-1).forEach(([x,z],i)=>i?shape.lineTo(x,-z):shape.moveTo(x,-z));shape.closePath();const g=new THREE.ShapeGeometry(shape);g.rotateX(-Math.PI/2);
 const uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,g.attributes.position.getX(i),g.attributes.position.getZ(i));
 m.grass.color.set('#86bd6c');const lawn=new THREE.Mesh(g,m.grass);lawn.name='Mapped_780m2_plot';lawn.position.y=-.115;lawn.receiveShadow=true;group.add(lawn);
 // Front hardstanding, kitchen/living terrace and the narrow side paths.
 slab('West_garden_path',[-6.6,4.42,-4.22,15.1],-.075,paving);
 slab('Kitchen_terrace',[-4.22,8.10,5.1,15.1],-.065,paving);
 slab('Living_terrace',[5.1,13.15,13.55,15.1],-.065,paving);
 slab('East_side_path',[11.35,-.30,13.55,15.1],-.075,paving);
 slab('Covered_garden_paving',[6.4,22.8,11.35,27.0],-.065,paving);
 slab('Rear_storage_path',[-5,30.9,13.6,32.3],-.075,paving);
 function building(name,b,h,mat){slab(name+'_base',b,-.025,paving);box(name,(b[0]+b[2])/2,h/2,(b[1]+b[3])/2,b[2]-b[0],h,b[3]-b[1],mat);slab(name+'_roof',[b[0]-.14,b[1]-.14,b[2]+.14,b[3]+.14],h+.07,roof);}
 building('Garage',site.garage.bounds,site.garage.height,white);
 box('Garage_south_window',-1.90,1.45,11.645,1.64,.78,.025,m.dark);
 for(const x of [-2.73,-1.90,-1.07])box('Garage_window_frame',x,1.45,11.67,.045,.85,.04,white);
 for(const y of [1.04,1.86])box('Garage_window_frame',-1.90,y,11.67,1.70,.045,.04,white);
 building('Rear_yellow_depot',site.depot.bounds,site.depot.height,yellow);
 building('Rear_grey_store',site.rearStore.bounds,site.rearStore.height,grey);
 box('Rear_store_door',-2.52,1.0,28.43,.9,2.0,.025,dark);
 const b=site.coveredTerrace.bounds,h=site.coveredTerrace.height;
 slab('White_canopy_roof',[b[0]-.15,b[1]-.18,b[2]+.15,b[3]+.1],h,white);
 box('Covered_seating_yellow_side',b[2],h/2,(b[1]+b[3])/2,.09,h,b[3]-b[1],yellow);
 for(const x of [b[0],b[2]])for(const z of [b[1],b[3]])box('Canopy_white_post',x,h/2,z,.10,h,.10,white);
 for(let z=b[1];z<b[3];z+=.45)box('Canopy_white_beam',(b[0]+b[2])/2,h-.09,z,b[2]-b[0]+.25,.14,.07,white);
 box('Garden_table',8.9,.74,25.1,1.65,.065,.85,dark);
 for(const x of [8.2,9.6])for(const z of [24.78,25.42])box('Garden_table_leg',x,.36,z,.055,.72,.055,dark);
 // Raised border along west hedge, as seen from the living room.
 box('Raised_garden_border',-6.10,.22,21.4,.65,.55,12.1,grey);
 // White side screen visible beyond the living room's east windows.
 box('East_white_privacy_screen',13.32,1.0,10.3,.08,2.0,8.8,white);
 buildFrontYard(group,site,m);
 group.userData.site=site;
}
