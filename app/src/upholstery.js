import * as THREE from 'three';
export function sewnPillow(w,h,d,seed=1){
 const positions=[],uv=[],indices=[],n=20;
 for(const side of [1,-1])for(let j=0;j<=n;j++)for(let i=0;i<=n;i++){
  const u=i/n*2-1,v=j/n*2-1,edge=Math.min(1-Math.abs(u),1-Math.abs(v));
  const fill=Math.pow(Math.max(0,(1-u*u)*(1-v*v)),.52);
  const crease=Math.sin(u*31+v*9+seed)*Math.sin(v*26-u*7)*Math.exp(-edge*9)*Math.sin(Math.PI*edge*3);
  const x=u*w/2*(1-.065*Math.pow(Math.abs(v),8)),z=v*d/2*(1-.075*Math.pow(Math.abs(u),8));
  const dent=.018*Math.exp(-((u-.3)**2/.09+(v+.1)**2/.13));
  positions.push(x,side*(.004+h*.5*fill+.013*crease)-(side>0?dent*fill:0),z);
  uv.push(i/n,j/n);
 }
 const k=(n+1)**2;
 for(let s=0;s<2;s++)for(let j=0;j<n;j++)for(let i=0;i<n;i++){
  const a=s*k+j*(n+1)+i,b=a+1,c=a+n+1,d=c+1;
  indices.push(...(s===0?[a,c,b,b,c,d]:[a,b,c,b,d,c]));
 }
 const boundary=[];for(let i=0;i<=n;i++)boundary.push(i);for(let j=1;j<=n;j++)boundary.push(j*(n+1)+n);for(let i=n-1;i>=0;i--)boundary.push(n*(n+1)+i);for(let j=n-1;j>0;j--)boundary.push(j*(n+1));
 for(let i=0;i<boundary.length;i++){const a=boundary[i],b=boundary[(i+1)%boundary.length];indices.push(a,b,a+k,b,b+k,a+k);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;
}
