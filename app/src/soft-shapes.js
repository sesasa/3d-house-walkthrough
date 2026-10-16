import * as THREE from 'three';
const clamp=THREE.MathUtils.clamp;
function rng(seed){return()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};}
// Average normals across coincident positions without losing UV seams.
function softenNormals(g){
 g.computeVertexNormals();const p=g.attributes.position,n=g.attributes.normal,buckets=new Map();
 for(let i=0;i<p.count;i++){const key=[p.getX(i),p.getY(i),p.getZ(i)].map(x=>Math.round(x*100000)).join(',');let b=buckets.get(key);if(!b){b={v:new THREE.Vector3(),ids:[]};buckets.set(key,b);}b.v.add(new THREE.Vector3(n.getX(i),n.getY(i),n.getZ(i)));b.ids.push(i);}
 for(const b of buckets.values()){b.v.normalize();for(const i of b.ids)n.setXYZ(i,b.v.x,b.v.y,b.v.z);}return g;
}
export function upholsteredGeometry(w,h,d,seed=1){
 const g=new THREE.BoxGeometry(w,h,d,20,10,18),p=g.attributes.position;
 const r=Math.min(w,h,d)*.24,half=new THREE.Vector3(w/2-r,h/2-r,d/2-r),v=new THREE.Vector3(),q=new THREE.Vector3();
 for(let i=0;i<p.count;i++){
  v.fromBufferAttribute(p,i);q.set(clamp(v.x,-half.x,half.x),clamp(v.y,-half.y,half.y),clamp(v.z,-half.z,half.z));
  const n=v.clone().sub(q).normalize();v.copy(q).addScaledVector(n,r);
  const u=v.x/w*2,t=v.z/d*2,a=v.y/h*2;
  const bulge=Math.max(0,1-u*u)*Math.max(0,1-t*t)*Math.min(h*.2,.027);
  const folds=(Math.sin(v.x*37+v.z*19+seed)*Math.sin(v.z*23-seed)+.35*Math.sin(v.x*83+v.z*9))*Math.min(h*.016,.0035);
  v.y+=Math.sign(a)*(bulge+folds)*(Math.abs(n.y));
  v.z+=Math.sin(v.x*25+seed)*.002*Math.max(0,n.z);
  p.setXYZ(i,v.x,v.y,v.z);
 }return softenNormals(g);
}
