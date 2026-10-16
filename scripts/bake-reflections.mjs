import {mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:!process.argv.includes('--native'),args:process.argv.includes('--native')?['--no-sandbox','--use-gl=angle','--use-angle=gl']:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});const baked=process.argv.includes('--baked');const closed=process.argv.includes('--closed');const baseURL='http://localhost:5175/'+(baked?'?baked=1':'?legacy=1')+(closed?'&doors=closed':'');const output='properties/danish-villa/app/public/'+(baked?(closed?'baked-closed/reflections':'baked/reflections'):'reflections');
await mkdir(output,{recursive:true});
try{
 const page=await browser.newPage({viewport:{width:800,height:600}});await page.goto(baseURL);await page.waitForFunction(()=>window.houseTour?.ready,null,{timeout:120000});
 // Ceilings must be present. Keep navigation inactive while capturing.
 await page.evaluate(()=>{houseTour.house.renderGroups.Ceilings.visible=true;houseTour.house.renderGroups.Roof.visible=false;});
 const rooms=await page.evaluate(()=>houseTour.house.rooms.map(r=>r.id)),records=[];
 for(const id of rooms){
  const result=await page.evaluate(id=>houseTour.reflections.bake(houseTour.house.rooms.find(r=>r.id===id)),id);
  const header=new Uint32Array([result.width,result.height]),data=new Uint16Array(result.data);
  const bytes=Buffer.concat([Buffer.from(header.buffer),Buffer.from(data.buffer)]);await writeFile(`${output}/${id}.bin`,bytes);
  records.push({room:id,width:result.width,height:result.height,bytes:bytes.length});console.log(`Baked ${id}: ${bytes.length} bytes`);
 }
 await writeFile(`${output}/manifest.json`,JSON.stringify({revision:baked?'house-5-cycles-v1':'house-5-quality-v2',format:'little-endian uint32 width/height then RGBA float16 PMREM; linear color',rooms:records},null,2)+'\n');
}finally{await browser.close();}
