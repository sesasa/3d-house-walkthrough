import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const root='properties/danish-villa';
for(const p of ['output/models','app/public/models','work/review'])await mkdir(`${root}/${p}`,{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://localhost:5175/?legacy=1');await page.waitForFunction(()=>window.houseTour?.ready,null,{timeout:120000});
const checks=await page.evaluate(()=>{
 const h=houseTour,{nav,rooms}=h,step=.06;
 const inside=(x,z)=>rooms.some(r=>[r.bounds,...(r.extra||[])].some(b=>x>=b[0]-.07&&x<=b[2]+.07&&z>=b[1]-.07&&z<=b[3]+.07));
 const start=rooms[0].spawn.map(v=>Math.round(v/step)),queue=[start],seen=new Set([start.join(',')]);
 for(let i=0;i<queue.length;i++){const [x,z]=queue[i];for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,nz=z+dz,k=`${nx},${nz}`;if(!seen.has(k)&&inside(nx*step,nz*step)&&!nav.blocked(nx*step,nz*step)){seen.add(k);queue.push([nx,nz]);}}}
 return {reachable:rooms.map(r=>({room:r.id,reachable:seen.has(r.spawn.map(v=>Math.round(v/step)).join(',')),blocked:nav.blocked(...r.spawn)})),walkableCells:seen.size,inventory:h.house.inventory,colliders:h.house.colliders,rooms,stats:h.stats()};
});
console.log(JSON.stringify(checks.reachable));
if(checks.reachable.some(r=>!r.reachable||r.blocked))throw Error('Disconnected room');
await page.evaluate(()=>houseTour.enterRoom('hall'));const before=await page.evaluate(()=>({p:houseTour.camera.position.toArray(),yaw:houseTour.nav.yaw}));await page.keyboard.down('KeyD');await page.waitForFunction(yaw=>Math.abs(houseTour.nav.yaw-yaw)>.04,before.yaw,{timeout:60000});await page.keyboard.up('KeyD');const turned=await page.evaluate(()=>({p:houseTour.camera.position.toArray(),yaw:houseTour.nav.yaw}));if(Math.abs(turned.yaw-before.yaw)<.02||turned.p.some((v,i)=>v!==before.p[i]))throw Error('Turn controls failed '+JSON.stringify({before,turned}));
await page.keyboard.down('KeyW');await page.waitForFunction(p=>houseTour.camera.position.toArray().some((v,i)=>Math.abs(v-p[i])>.02),turned.p,{timeout:60000});await page.keyboard.up('KeyW');const moved=await page.evaluate(()=>houseTour.camera.position.toArray());if(moved.every((v,i)=>v===turned.p[i]))throw Error('Forward control failed');
await page.click('#inventory-button');if(await page.locator('.item-row').count()!==checks.inventory.length)throw Error('Inventory mismatch');await page.locator('.item-row').first().click();await page.waitForTimeout(200);await page.screenshot({path:root+'/work/review/fixed-inspection.png'});
await page.click('#photos-button');await page.locator('#photos-dialog .close').click();
await page.evaluate(()=>houseTour.setMode('plan'));await page.screenshot({path:root+'/work/review/plan.png'});
await page.setViewportSize({width:390,height:844});await page.evaluate(()=>houseTour.enterRoom('kitchen'));await page.waitForTimeout(250);await page.screenshot({path:root+'/work/review/mobile.png'});if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1))throw Error('Mobile overflow');
await writeFile(root+'/output/models/fixed-items.json',JSON.stringify(checks.inventory,null,2));
await writeFile(root+'/output/models/navigation.json',JSON.stringify({rooms:checks.rooms,colliders:checks.colliders},null,2));
const csv=[['id','kind','room','x_m','y_m','z_m','width_m','height_m','depth_m','sources','note','confidence'],...checks.inventory.map(i=>[i.id,i.kind,i.room,...i.position,...i.size,i.refs.join(';'),i.note,i.confidence])].map(r=>r.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(',')).join('\n');await writeFile(root+'/output/models/fixed-items.csv',csv);
console.log('Exporting GLB');const base64=await page.evaluate(async()=>{const buffer=await houseTour.exportGLB();return await new Promise(resolve=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.readAsDataURL(new Blob([buffer]));});});
for(const p of ['output/models','app/public/models'])await writeFile(`${root}/${p}/danish-villa.glb`,Buffer.from(base64,'base64'));
const glb=await page.evaluate(()=>houseTour.validateGLB('models/danish-villa.glb'));console.log(glb);if(!glb.meshes)throw Error('GLB invalid');
await writeFile(root+'/work/review/validation.json',JSON.stringify({reachable:checks.reachable,walkableCells:checks.walkableCells,stats:checks.stats,items:checks.inventory.length,keyboard:'passed',mobile:'passed',glb,errors},null,2));if(errors.length)throw Error(errors.join(';'));console.log('Validation and export passed');
}finally{await browser.close();}
