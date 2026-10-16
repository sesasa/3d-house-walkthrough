import * as THREE from 'three';
function tiles(name,color,size=.45,diagonal=false){
 const c=document.createElement('canvas');c.width=c.height=512;const g=c.getContext('2d');g.fillStyle=color;g.fillRect(0,0,512,512);
 let seed=927;const random=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
 for(let i=0;i<18000;i++){const v=random()>.5?'255,255,255':'48,39,28';g.fillStyle=`rgba(${v},.035)`;g.fillRect(random()*512,random()*512,2,2);}
 g.fillStyle='#aaa394';g.fillRect(0,0,512,3);g.fillRect(0,0,3,512);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(1/size,1/size);if(diagonal){t.rotation=Math.PI/4;t.center.set(.5,.5);}return new THREE.MeshStandardMaterial({name,map:t,roughness:.63});
}
const mat=(name,color,roughness=.65,extra={})=>new THREE.MeshStandardMaterial({name,color,roughness,...extra});
export async function materials(){
 const m={white:mat('Warm painted white','#f1f1ee',.45),wall:mat('Ivory plaster','#efefec',.86),bedWall:mat('Bedroom pale sand','#c6b79e',.88),hall:mat('Entrance soft yellow','#e9e3cd',.86),oak:mat('Honey oak furniture','#aa7f4f',.46),tile:tiles('Kitchen and utility diagonal stone','#c4bdab',.43,true),bathTile:tiles('Bathroom brown stone','#a18d73',.46),splash:tiles('Kitchen warm stone splashback','#b7a080',.19),chrome:mat('Polished chrome','#cbd0d0',.12,{metalness:1}),steel:mat('Brushed steel','#a1a5a5',.28,{metalness:1}),dark:mat('Graphite lacquer','#202323',.35),leather:mat('Black leather seating','#202321',.52),linen:mat('Cream woven bedding','#e7dfc9',.95),glass:mat('Clear glazing','#d7e7ec',.055,{transparent:true,opacity:.09,metalness:.1,depthWrite:false}),frost:mat('Frosted bathroom glass','#dce4e1',.6,{transparent:true,opacity:.70}),mirror:mat('Mirror silver','#f1f1f1',.015,{metalness:1}),ceramic:mat('White glazed porcelain','#f5f5f3',.32),roof:mat('Dark grey roof tiles','#454846',.95),brick:tiles('Golden exterior masonry','#b9a779',.24),grass:mat('Garden lawn','#697b4d',1),paving:tiles('Terrace paving','#a9a79b',.5),blue:mat('Entrance blue dresser','#284755',.45),green:mat('Indoor leaves','#426141',.85),light:mat('Warm lamp glass','#fff0d2',.5,{emissive:'#ffe4b5',emissiveIntensity:.35})};
 const loader=new THREE.TextureLoader(),base=import.meta.env.BASE_URL;
 const [map,normal,rough]=await Promise.all(['diff','nor_dx','rough'].map(c=>loader.loadAsync(`${base}materials/oak-${c}.webp`)));
 for(const t of [map,normal,rough]){t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=8;}
 map.colorSpace=THREE.SRGBColorSpace;
 // Export a conventional OpenGL normal map, including its green-channel flip.
 const canvas=document.createElement('canvas');canvas.width=normal.image.width;canvas.height=normal.image.height;const ctx=canvas.getContext('2d');ctx.drawImage(normal.image,0,0);const pixels=ctx.getImageData(0,0,canvas.width,canvas.height);for(let i=1;i<pixels.data.length;i+=4)pixels.data[i]=255-pixels.data[i];ctx.putImageData(pixels,0,0);const normalGL=new THREE.CanvasTexture(canvas);normalGL.wrapS=normalGL.wrapT=THREE.RepeatWrapping;
 m.wood=mat('Pale timber floor','#ece5d6',.79,{map,normalMap:normalGL,roughnessMap:rough,normalScale:new THREE.Vector2(.18,.18)});

 const load=async(asset,channel,color=false)=>{const t=await loader.loadAsync(`${base}materials/realism/${asset}/${asset}_${channel}_1k.webp`);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=8;if(color)t.colorSpace=THREE.SRGBColorSpace;return t;};
 const [ln,lr,fn,fr,oc,on,or,gc,gn,gr]=await Promise.all([load('brown_leather','nor_gl'),load('brown_leather','rough'),load('rough_linen','nor_gl'),load('rough_linen','rough'),load('white_oak_veneer','diff',true),load('white_oak_veneer','nor_gl'),load('white_oak_veneer','rough'),load('grass_ground','diff',true),load('grass_ground','nor_gl'),load('grass_ground','rough')]);
 for(const t of [ln,lr])t.repeat.set(3,3);m.leather.normalMap=ln;m.leather.normalScale.set(.13,.13);m.leather.roughnessMap=lr;m.leather.roughness=.55;
 for(const t of [fn,fr])t.repeat.set(4,4);m.linen.normalMap=fn;m.linen.normalScale.set(.30,.30);m.linen.roughnessMap=fr;
 m.oak.map=oc;m.oak.normalMap=on;m.oak.normalScale.set(.18,.18);m.oak.roughnessMap=or;m.oak.color.set('#decbb1');m.oak.roughness=.54;
 for(const t of [gc,gn,gr])t.repeat.set(.45,.45);m.grass.map=gc;m.grass.normalMap=gn;m.grass.normalScale.set(.38,.38);m.grass.roughnessMap=gr;m.grass.color.set('#b1b894');
 m.bedTile=stone('Bedroom rectangular pale stone','#b6b2a7',.60,.30,false);
 m.tile=stone('Diagonal warm limestone','#b1aa99',.43,.43,true);
 m.bathTile=stone('Bathroom rectangular muted stone','#a29b90',.60,.30,false);
 m.splash=stone('Hob backsplash small warm stone','#af9975',.20,.10,false);
 m.bedWall.color.set('#c2b5a0');m.white.roughness=.45;m.chrome.roughness=.16;
 return m;
}
function stone(name,color,w,d,diagonal){
 const c=document.createElement('canvas');c.width=c.height=512;const g=c.getContext('2d');g.fillStyle=color;g.fillRect(0,0,512,512);
 let seed=121;const rand=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
 for(let i=0;i<3500;i++){const x=rand()*512,y=rand()*512,r=5+rand()*48;const grad=g.createRadialGradient(x,y,0,x,y,r);const v=rand()>.5?'255,249,233':'45,39,33';grad.addColorStop(0,`rgba(${v},.007)`);grad.addColorStop(1,`rgba(${v},0)`);g.fillStyle=grad;g.fillRect(x-r,y-r,r*2,r*2);}
 g.fillStyle='#d2c8b7';g.fillRect(0,0,512,3);g.fillRect(0,0,3,512);
 const map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;map.wrapS=map.wrapT=THREE.RepeatWrapping;map.repeat.set(1/w,1/d);map.anisotropy=8;if(diagonal)map.rotation=Math.PI/4;
 const rough=map.clone();rough.colorSpace=THREE.NoColorSpace;rough.needsUpdate=true;
 return new THREE.MeshStandardMaterial({name,map,roughnessMap:rough,roughness:.85});
}
