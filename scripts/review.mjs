import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const out='properties/danish-villa/work/review';await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>{errors.push(e.message);console.log(e.message);});page.on('console',m=>{if(m.type()==='error')console.log(m.text());});
 await page.goto('http://127.0.0.1:5175');await page.waitForFunction(()=>window.houseTour?.ready,null,{timeout:120000});await page.waitForTimeout(700);
 console.log(await page.evaluate(()=>({stats:houseTour.stats(),rooms:houseTour.rooms.map(r=>({id:r.id,blocked:houseTour.nav.blocked(...r.spawn)})),fixedItems:houseTour.house.inventory.length})));
 await page.screenshot({path:out+'/overview.png'});
 for(const id of ['hall','kitchen','living','primary','office','bathroom','wc','utility']){await page.evaluate(id=>houseTour.enterRoom(id),id);await page.waitForFunction(id=>houseTour.reflections.count>=['hall','kitchen','living','primary','office','bathroom','wc','utility'].indexOf(id)+1,id,{timeout:60000});await page.waitForTimeout(500);await page.screenshot({path:`${out}/${id}.png`});console.log('Reviewed',id);}
 await writeFile(out+'/errors.json',JSON.stringify(errors));if(errors.length)throw new Error(errors.join(';'));
}finally{await browser.close();}
