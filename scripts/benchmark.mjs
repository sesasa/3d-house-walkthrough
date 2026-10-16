import {chromium} from 'playwright';import {mkdir,writeFile} from 'node:fs/promises';
const baked=process.argv.includes('--baked'),base=process.env.TOUR_URL||`http://localhost:5175/?${baked?'baked':'legacy'}=1`;
const out='properties/danish-villa/work/baked-lighting';await mkdir(out,{recursive:true});
const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:false,args:['--no-sandbox','--use-gl=angle','--use-angle=gl','--window-position=0,0']});
try{const p=await b.newPage({viewport:{width:1200,height:900}}),errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});const start=Date.now();await p.goto(base);await p.waitForFunction(()=>window.houseTour?.ready,null,{timeout:180000});const loadMs=Date.now()-start;
const gpu=await p.evaluate(()=>{const gl=houseTour.renderer.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info');return gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)}),results=[];
for(const room of ['kitchen','living','bathroom']){
 await p.evaluate(id=>houseTour.enterRoom(id),room);await p.waitForTimeout(1500);await p.keyboard.down('KeyD');await p.waitForTimeout(1000);
 const before=await p.evaluate(()=>({t:performance.now(),frames:houseTour.stats().renderedFrames}));await p.waitForTimeout(7000);const after=await p.evaluate(()=>({t:performance.now(),frames:houseTour.stats().renderedFrames,stats:houseTour.stats()}));await p.keyboard.up('KeyD');results.push({room,fps:Math.round((after.frames-before.frames)/(after.t-before.t)*10000)/10,stats:after.stats});
}
const result={mode:baked?'baked':'legacy',gpu,viewport:[1200,900],loadMs,results,errors};await writeFile(`${out}/benchmark-${baked?'baked':'legacy'}.json`,JSON.stringify(result,null,2));console.log(result);if(errors.length)throw Error(errors.join('\n'));
}finally{await b.close()}
