import * as THREE from 'three';
export function createNavigation(camera,canvas,colliders){
 const keys=new Set(),touch=new Set();let enabled=false,yaw=0,pitch=0,drag=false,lastX=0,lastY=0;
 const radius=.19,eyeHeight=1.62;
 function blocked(x,z){if(x < -.8 || x > 12.2 || z < -.8 || z > 14.0)return true;
  return colliders.some(b=>{const nx=Math.max(b.minX,Math.min(x,b.maxX)),nz=Math.max(b.minZ,Math.min(z,b.maxZ));return (x-nx)**2+(z-nz)**2<radius**2;});}
 function look(){camera.quaternion.setFromEuler(new THREE.Euler(pitch,yaw,0,'YXZ'));}
 function clear(){keys.clear();touch.clear();drag=false;}
 window.addEventListener('blur',clear);document.addEventListener('visibilitychange',clear);
 document.addEventListener('keydown',e=>{if(!enabled||document.querySelector('dialog[open]'))return;if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft','ShiftRight'].includes(e.code)){keys.add(e.code);e.preventDefault();}});
 document.addEventListener('keyup',e=>keys.delete(e.code));
 canvas.addEventListener('pointerdown',e=>{if(!enabled)return;drag=true;lastX=e.clientX;lastY=e.clientY;canvas.setPointerCapture(e.pointerId);canvas.focus();});
 canvas.addEventListener('pointerup',()=>drag=false);canvas.addEventListener('pointercancel',clear);
 document.addEventListener('pointermove',e=>{if(!enabled||document.querySelector('dialog[open]'))return;
  if(document.pointerLockElement===canvas){yaw-=e.movementX*.0023;pitch-=e.movementY*.0023;}
  else if(drag){yaw-=(e.clientX-lastX)*.004;pitch-=(e.clientY-lastY)*.004;lastX=e.clientX;lastY=e.clientY;}else return;
  pitch=THREE.MathUtils.clamp(pitch,-1.15,1.15);look();
 });
 document.querySelectorAll('[data-move]').forEach(b=>{
  b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);touch.add(b.dataset.move);});
  for(const evt of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(evt,()=>touch.delete(b.dataset.move));
 });
 return {
  blocked,
  setEnabled(value){enabled=value;clear();if(!value&&document.pointerLockElement)document.exitPointerLock();},
  teleport(x,z,lookX,lookZ,viewPitch=-.075){camera.position.set(x,eyeHeight,z);yaw=Math.atan2(-(lookX-x),-(lookZ-z));pitch=viewPitch;look();clear();},
  get yaw(){return yaw;},
  update(dt){if(!enabled||document.querySelector('dialog[open]')){clear();return;}
   let forward=Number(keys.has('KeyW')||keys.has('ArrowUp')||touch.has('forward'))-Number(keys.has('KeyS')||keys.has('ArrowDown')||touch.has('back'));
   const turn=Number(keys.has('KeyD')||keys.has('ArrowRight')||touch.has('right'))-Number(keys.has('KeyA')||keys.has('ArrowLeft')||touch.has('left'));
   if(!forward&&!turn)return;
   yaw-=turn*1.35*Math.min(dt,.05);look();
   const speed=(keys.has('ShiftLeft')||keys.has('ShiftRight')?3.2:1.85)*Math.min(dt,.05);
   const dx=-Math.sin(yaw)*forward*speed,dz=-Math.cos(yaw)*forward*speed;
   if(!blocked(camera.position.x+dx,camera.position.z))camera.position.x+=dx;
   if(!blocked(camera.position.x,camera.position.z+dz))camera.position.z+=dz;
  },
 };
}
