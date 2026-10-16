import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const out='properties/danish-villa/work/front-yard';await mkdir(out,{recursive:true});
const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:false,args:['--no-sandbox','--use-gl=angle','--use-angle=gl']});
try{
 const p=await b.newPage({viewport:{width:1440,height:1000}}),errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await p.goto(process.env.TOUR_URL||'http://localhost:5175/?legacy=1&view=street&doors=closed');await p.waitForFunction(()=>window.houseTour?.ready,null,{timeout:120000});
 if(errors.length)throw Error(errors.join('\n'));
 const audit=await p.evaluate(()=>{const h=houseTour.house,g=h.groups.Garden,site=g.userData.site;h.root.updateMatrixWorld(true);const garage=g.getObjectByName('Garage');let garageBounds=null;if(garage){garage.geometry.computeBoundingBox();const b=garage.geometry.boundingBox.clone().applyMatrix4(garage.matrixWorld);garageBounds={min:b.min.toArray(),max:b.max.toArray()};}return {mode:houseTour.mode,garageBounds,site,front:g.userData.front,stats:houseTour.stats(),roof:h.renderGroups?.Roof.visible??h.groups.Roof.visible,foliage:h.renderGroups.Garden.children.filter(o=>o.material?.vertexColors).map(o=>({name:o.name,colors:o.geometry.getAttribute('color')?Array.from(o.geometry.getAttribute('color').array.slice(0,15)):[]})),frontDoors:h.inventory.filter(i=>['front-door','utility-entry'].includes(i.id)).map(i=>({id:i.id,position:i.position,size:i.size})),named:g.children.map(o=>o.name)};});
 if(audit.site){if(Math.abs(audit.site.garage.bounds[2]+.24)>.001)throw Error('Garage must touch house');const [a,b,c,d]=audit.site.garage.bounds;if(Math.abs((c-a)*(d-b)-24)>.1)throw Error('Garage footprint changed');if(audit.front.streetWidth!==5.5||audit.frontDoors.length!==2)throw Error('Street or entry geometry missing');}
 if(!audit.garageBounds||Math.abs(audit.garageBounds.max[0]+.24)>.003)throw Error('Delivered garage geometry leaves a gap');
 if(audit.foliage.length<3||audit.foliage.some(o=>!o.colors.length||Math.max(...o.colors)<=0))throw Error('Foliage vertex colours lost during export/batching');
 if(audit.mode!=='street'||!audit.roof)throw Error('Street view must display the roof');
 await p.waitForTimeout(1200);await p.screenshot({path:out+'/street-'+(audit.stats.baked?'baked':'source')+'.png'});
 await p.evaluate(()=>{houseTour.camera.position.set(4.2,2.2,-14)});await p.waitForTimeout(600);await p.screenshot({path:out+'/front-'+(audit.stats.baked?'baked':'source')+'.png'});
 await p.setViewportSize({width:390,height:844});await p.evaluate(()=>houseTour.setMode('street'));await p.waitForTimeout(400);if(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1))throw Error('Mobile horizontal overflow');await p.screenshot({path:out+'/mobile-'+(audit.stats.baked?'baked':'source')+'.png'});
 await p.click('#photos-button');await p.waitForFunction(()=>document.querySelector('#active-photo').naturalWidth>0);if(!(await p.locator('#active-photo').getAttribute('src')).endsWith('IMG_9937.webp'))throw Error('Street reference photo mismatch');await p.locator('#photos-dialog .close').click();
 const before=await p.evaluate(()=>({closed:houseTour.doorsClosed,position:houseTour.camera.position.toArray()}));await p.click('#doors-button');await p.waitForFunction(closed=>window.houseTour?.ready&&houseTour.doorsClosed!==closed,before.closed,{timeout:120000});
 const after=await p.evaluate(()=>({mode:houseTour.mode,position:houseTour.camera.position.toArray()}));if(after.mode!=='street'||after.position.some((v,i)=>Math.abs(v-before.position[i])>.001))throw Error('Street camera lost on door toggle');
 if(errors.length)throw Error(errors.join('\n'));
 await writeFile(out+'/audit-'+(audit.stats.baked?'baked':'source')+'.json',JSON.stringify({...audit,errors},null,2));console.log('PASS street view, two front entries, attached 24 m² garage, mobile layout',audit.stats);
}finally{await b.close()}
