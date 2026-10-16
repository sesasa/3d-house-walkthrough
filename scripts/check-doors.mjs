import {chromium} from 'playwright';
import fs from 'node:fs/promises';
const base='properties/danish-villa';
// Independent transcription of hinge coordinates and open leaf directions
// from IMG_9962; tests actual transformed geometry, not just configuration.
const expected={
 'utility-entry':['east',[0,0,1]],'front-door':['east',[0,0,-1]],
 'kitchen-terrace-door':['west',[0,0,1]],'living-garden-door':['south',[-1,0,0]],
 'bath-door':['south',[-1,0,0]],'wc-door':['north',[1,0,0]],
 'bedroom-door':['north',[1,0,0]],'utility-kitchen-door':['east',[0,0,-1]],
 'hall-double-door':['both',[0,0,1]],'office-door':['north',[1,0,0]],
};
const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:false,args:['--no-sandbox','--use-gl=angle','--use-angle=gl']});
try{const p=await b.newPage();await p.goto('http://localhost:5175/?legacy=1');await p.waitForFunction(()=>window.houseTour?.ready,null,{timeout:120000});
const result=await p.evaluate(()=>{const h=houseTour.house;h.root.updateMatrixWorld(true);const doors=h.inventory.filter(i=>i.kind==='door').map(i=>{const a=h.root.getObjectByName(i.id);const leaves=a.children.filter(c=>c.userData.handing).map(l=>{const d=l.userData.handing,tip=l.position.clone().set((d.hinge==='a'?1:-1)*d.width,0,0);l.localToWorld(tip);const hinge=l.getWorldPosition(l.position.clone());return {hinge:hinge.toArray(),tip:tip.toArray(),direction:tip.sub(hinge).normalize().toArray(),handing:d}});return {id:i.id,position:i.position,size:i.size,leaves}});const shower=h.root.getObjectByName('Shower_open_glass_door');return {doors,shower:{center:shower.getWorldPosition(shower.position.clone()).toArray(),depth:shower.geometry.parameters.depth},inventory:h.inventory,colliders:h.colliders};});
for(const door of result.doors){const [hinge,dir]=expected[door.id];if(door.leaves.length!==(hinge==='both'?2:1))throw Error('Leaf count '+door.id);for(const leaf of door.leaves){if(leaf.direction.some((v,i)=>Math.abs(v-dir[i])>1e-6))throw Error('Wrong swing '+door.id);const axis=['east','west'].includes(hinge)?0:2;if(hinge!=='both'){const endpoint=door.position[axis]+(['east','south'].includes(hinge)?1:-1)*door.size[axis]/2;if(Math.abs(leaf.hinge[axis]-endpoint)>1e-6)throw Error('Wrong hinge '+door.id)}}}
if(Math.abs(result.shower.center[0]-2.58)>1e-6||Math.abs(result.shower.center[2]+result.shower.depth/2-2.60)>1e-6)throw Error('Shower must hinge at west jamb and open north');
const metadata=JSON.parse(await fs.readFile(base+'/pipeline/browser/metadata.json','utf8'));metadata.inventory=result.inventory;metadata.colliders=result.colliders;metadata.doors=result.doors;
await fs.writeFile(base+'/pipeline/browser/metadata.json',JSON.stringify(metadata));await fs.writeFile(base+'/app/public/baked/metadata.json',JSON.stringify(metadata));
await fs.mkdir(base+'/work/neutral-door-refinement',{recursive:true});await fs.writeFile(base+'/work/neutral-door-refinement/door-audit.json',JSON.stringify({doors:result.doors,shower:result.shower},null,2));console.log('PASS: 10 door openings / 11 leaves plus shower screen agree with main-plan hinge and opening sides.');
}finally{await b.close()}
