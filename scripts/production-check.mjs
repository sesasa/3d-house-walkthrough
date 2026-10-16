import {chromium} from 'playwright';
import {writeFile} from 'node:fs/promises';
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1200,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text()+' '+JSON.stringify(m.location()));});page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
 await page.goto('http://localhost:4175');await page.waitForFunction(()=>window.houseTour?.ready,null,{timeout:120000});
 const dimensions=await page.evaluate(()=>{const rs=Object.fromEntries(houseTour.rooms.map(r=>[r.id,r]));return {kitchen:rs.kitchen.bounds[2]-rs.kitchen.bounds[0],primary:rs.primary.bounds[2]-rs.primary.bounds[0],office:rs.office.bounds[2]-rs.office.bounds[0],living:rs.living.bounds[2]-rs.living.bounds[0],upperHall:rs.hall.bounds[2]-rs.hall.bounds[0],wideHall:rs.hall.bounds[2]-rs.hall.extra[0][0],calibratedOpenings:houseTour.house.inventory.filter(i=>i.measurement).length};});
 const expected={kitchen:7.57,primary:4.46,office:3.47,living:5.92,upperHall:1.66,wideHall:1.87,calibratedOpenings:16};for(const k in expected)if(Math.abs(dimensions[k]-expected[k])>1e-6)throw Error('Dimension regression '+k);
 await page.evaluate(()=>houseTour.enterRoom('living'));await page.waitForFunction(()=>houseTour.reflections.count>=1,null,{timeout:60000});
 await page.click('#detail-button');if(await page.locator('#detail-button').getAttribute('aria-pressed')!=='false')throw Error('Detail toggle');
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(300);if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1))throw Error('Mobile overflow');await page.screenshot({path:'properties/danish-villa/work/review/mobile-final.png'});
 await page.goto('http://localhost:4175/measurements/');await page.waitForFunction(()=>[...document.images].every(i=>i.complete&&i.naturalWidth>0));if(await page.locator('tbody tr').count()!==16)throw Error('Missing measurement rows');
 const model=await page.request.get('http://localhost:4175/models/danish-villa.glb');if(!model.ok())throw Error('Model download failed');
 if(errors.length)throw Error(errors.join('\n'));console.log({dimensions,errors,production:'passed'});await writeFile('properties/danish-villa/work/review/production-check.json',JSON.stringify({dimensions,errors,production:'passed'},null,2));
}finally{await browser.close();}
