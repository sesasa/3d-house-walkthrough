import {chromium} from 'playwright';import {mkdir,writeFile,readFile} from 'node:fs/promises';
const closed=process.argv.includes('--closed');
const root='properties/danish-villa',out=root+'/work/front-yard/'+(closed?'closed':'open'),url=process.env.TOUR_URL||('http://localhost:4175/'+(closed?'?doors=closed':''));
const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:false,args:['--no-sandbox','--use-gl=angle','--use-angle=gl']});
try{
 const page=await b.newPage({viewport:{width:1200,height:900}}),errors=[],requests=[],external=[];
 await page.route('**/*',async route=>{const u=new URL(route.request().url());if(!['localhost','127.0.0.1'].includes(u.hostname)){external.push(u.href);await route.abort()}else await route.continue()});
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});page.on('response',r=>{requests.push(r.url());if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`)});
 await page.goto(url);await page.waitForFunction(()=>window.houseTour?.ready,null,{timeout:120000});
 const report=await page.evaluate(()=>({stats:houseTour.stats(),geometry:houseTour.geometryAudit(),items:houseTour.house.inventory.length,openings:houseTour.house.inventory.filter(i=>i.measurement).length,shadows:houseTour.renderer.shadowMap.enabled,areaLights:houseTour.scene.children.filter(o=>o.isRectAreaLight).length,sourceHash:houseTour.house.baked.manifest.source_sha256,denoising:houseTour.house.baked.manifest.denoising,rooms:houseTour.rooms.map(r=>({id:r.id,blocked:houseTour.nav.blocked(...r.spawn)}))}));
 if(!report.stats.baked||report.stats.lightmaps!==14||report.items!==46||report.openings!==16||report.shadows||report.areaLights)throw Error('Baked configuration mismatch');
 for(const [k,v] of Object.entries(report.geometry.categories))if(v.source.some((x,i)=>Math.abs(x-v.render[i])>.001))throw Error('Compressed geometry transform regression: '+k);
 if(report.geometry.floors.some(r=>r.height===null||Math.abs(r.height)>.03))throw Error('Floor geometry no longer matches navigation');
 if(report.rooms.some(r=>r.blocked))throw Error('Blocked room entry');
 const doorAudit=JSON.parse(await readFile(root+'/pipeline/browser/metadata'+(closed?'-closed':'')+'.json','utf8'));
 const rays=doorAudit.doors.flatMap(d=>d.leaves.map((l,i)=>{const n=[-l.direction[2],0,l.direction[0]];return {id:d.id+'_'+i,origin:[(l.hinge[0]+l.tip[0])/2+n[0]*.2,1,(l.hinge[2]+l.tip[2])/2+n[2]*.2],direction:n.map(v=>-v)};}));
 report.doorGeometry=(await page.evaluate(r=>houseTour.geometryAudit(r),rays)).doorRays;
 if(report.doorGeometry.some(r=>r.distance===null||r.distance<.14||r.distance>.25))throw Error('Baked door geometry differs from audited hinge/swing: '+JSON.stringify(report.doorGeometry));

 for(const r of report.rooms){await page.evaluate(id=>houseTour.enterRoom(id),r.id);await page.waitForFunction(n=>houseTour.reflections.count>=n,report.rooms.indexOf(r)+1,{timeout:30000})}
 await page.evaluate(()=>houseTour.enterRoom('hall'));const before=await page.evaluate(()=>({p:houseTour.camera.position.toArray(),yaw:houseTour.nav.yaw}));await page.keyboard.down('KeyD');await page.waitForFunction(y=>Math.abs(houseTour.nav.yaw-y)>.08,before.yaw);await page.keyboard.up('KeyD');const after=await page.evaluate(()=>({p:houseTour.camera.position.toArray(),yaw:houseTour.nav.yaw}));if(after.p.some((v,i)=>v!==before.p[i]))throw Error('A/D must rotate in place');
 await page.keyboard.down('KeyW');await page.waitForFunction(p=>houseTour.camera.position.toArray().some((v,i)=>Math.abs(v-p[i])>.02),after.p);await page.keyboard.up('KeyW');
 await page.click('#inventory-button');if(await page.locator('.item-row').count()!==46)throw Error('Inventory UI');await page.locator('.item-row').first().click();await page.click('#photos-button');await page.waitForFunction(()=>document.querySelector('#active-photo').naturalWidth>0);await page.locator('#photos-dialog .close').click();
 await page.click('#detail-button');await page.click('#furniture-button');await page.click('#furniture-button');await page.evaluate(()=>houseTour.setMode('plan'));await page.evaluate(()=>houseTour.enterRoom('kitchen'));
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(400);if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1))throw Error('Mobile layout overflow');
 await mkdir(out,{recursive:true});await page.screenshot({path:out+'/mobile-final.png'});
 if(external.length||errors.length)throw Error(JSON.stringify({external,errors}));
 if(requests.some(u=>u.includes('/models/danish-villa.glb')))throw Error('Unnecessary source-model download');
 Object.assign(report,{errors,externalRequests:external,localRequests:requests.length,keyboard:'passed',inventory:'passed',photos:'passed',mobileLayout:'passed',cloudDependency:'none; all external requests blocked during test'});await writeFile(out+'/validation.json',JSON.stringify(report,null,2));console.log('BAKED VALIDATION PASSED',report.stats,report.geometry.floors);
}finally{await b.close()}
