import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const root='properties/danish-villa',url=process.env.TOUR_URL||'http://localhost:4175/';
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:false,args:['--no-sandbox','--use-gl=angle','--use-angle=gl']});
try{
 const page=await browser.newPage({viewport:{width:1200,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url);await page.waitForFunction(()=>window.houseTour?.ready,null,{timeout:120000});
 await page.evaluate(()=>houseTour.enterRoom('kitchen'));
 const before=await page.evaluate(()=>({position:houseTour.camera.position.toArray(),yaw:houseTour.nav.yaw}));
 await page.click('#doors-button');await page.waitForURL('**doors=closed');await page.waitForFunction(()=>window.houseTour?.ready&&houseTour.doorsClosed,null,{timeout:120000});
 const closed=await page.evaluate(()=>({position:houseTour.camera.position.toArray(),yaw:houseTour.nav.yaw,blockedDoors:houseTour.house.colliders.filter(c=>c.name.endsWith('_closed')).map(c=>({name:c.name,blocked:houseTour.nav.blocked((c.minX+c.maxX)/2,(c.minZ+c.maxZ)/2)})),rooms:houseTour.rooms.map(r=>({id:r.id,blocked:houseTour.nav.blocked(...r.spawn)}))}));
 if(closed.position.some((v,i)=>Math.abs(v-before.position[i])>.001)||Math.abs(closed.yaw-before.yaw)>.001)throw Error('Door switch lost camera');
 if(closed.blockedDoors.length!==10||closed.blockedDoors.some(d=>!d.blocked)||closed.rooms.some(r=>r.blocked))throw Error('Closed door navigation regression');
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(400);
 const layout=await page.evaluate(()=>{const a=document.querySelector('.toolbar').getBoundingClientRect(),b=document.querySelector('.view-card').getBoundingClientRect();return {toolbarBottom:a.bottom,cardTop:b.top,overflow:document.documentElement.scrollWidth>innerWidth+1};});
 if(layout.overflow||layout.toolbarBottom>layout.cardTop)throw Error('Mobile overlap: '+JSON.stringify(layout));
 await page.click('#doors-button');await page.waitForFunction(()=>window.houseTour?.ready&&!houseTour.doorsClosed,null,{timeout:120000});
 if(await page.evaluate(()=>houseTour.house.colliders.some(c=>c.name.endsWith('_closed'))))throw Error('Open pose still blocks doors');
 if(errors.length)throw Error(errors.join('\n'));
 const out=root+'/work/front-yard';await mkdir(out,{recursive:true});await writeFile(out+'/door-toggle.json',JSON.stringify({before,closed,layout,errors},null,2));console.log('PASS: door toggle preserves view, blocks 10 closed openings, keeps 8 room entries safe, and fits mobile toolbar');
}finally{await browser.close()}
