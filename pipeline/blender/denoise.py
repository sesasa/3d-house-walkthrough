"""Denoise linear lightmaps on the development GPU before RGBM encoding."""
import bpy,numpy as np,json,time,subprocess,os
from pathlib import Path
base=Path(os.environ.get('HOUSE5_BASE','/workspace/housewalk/house5'));out=base/'output/baked';manifest=json.loads((out/'manifest.json').read_text())
oidn=base/'tools/oidn-2.3.3.x86_64.linux/bin/oidnDenoise'
for a in manifest['atlases']:
 start=time.time();img=bpy.data.images.load(str(out/(a['id']+'.exr')));w,h=img.size
 pixels=np.empty(w*h*4,dtype=np.float32);img.pixels.foreach_get(pixels);rgb=pixels.reshape(h,w,4)[:,:,:3].copy();src=out/'denoise-input.pfm';dst=out/'denoise-output.pfm'
 with src.open('wb') as f:f.write(f'PF\n{w} {h}\n-1.0\n'.encode());f.write(rgb.astype('<f4').tobytes())
 subprocess.run([str(oidn),'-d','cuda','-f','RTLightmap','--hdr',str(src),'-o',str(dst),'-q','high','--maxmem','2048'],check=True)
 with dst.open('rb') as f:
  assert f.readline().strip()==b'PF';rw,rh=map(int,f.readline().split());scale=float(f.readline());assert (rw,rh)==(w,h)
  clean=np.frombuffer(f.read(),dtype='<f4' if scale<0 else '>f4').reshape(h*w,3).copy()
 assert np.isfinite(clean).all();clean=np.maximum(clean,0)
 grade=json.loads((base/'pipeline/presentation.json').read_text()) if (base/'pipeline/presentation.json').exists() else manifest['rig'].get('presentation',{});manifest['presentation']=grade;retention=grade.get('indirect_color_retention',1.0)
 luminance=(clean*np.array([.2126,.7152,.0722],dtype=np.float32)).sum(axis=1,keepdims=True)
 clean=luminance+(clean-luminance)*retention
 floor=grade.get('shadow_floor',0)
 if a['id'].endswith('_structure'):floor=grade.get('structure_shadow_floor',floor)
 if a['id']=='ceilings':floor=grade.get('ceiling_shadow_floor',floor)
 if a['id'] in ['bathroom_structure','wc_structure']:floor=grade.get('wet_room_shadow_floor',floor)
 clean=np.sqrt(clean*clean+floor*floor)
 a['denoised_mean']=float(clean.mean());a['denoise_seconds']=round(time.time()-start,2)
 mult=np.clip(np.ceil(clean.max(axis=1)/16*255)/255,1/255,1);encoded=np.concatenate((np.clip(clean/(mult[:,None]*16),0,1),mult[:,None]),axis=1)
 png=bpy.data.images.new('Denoised_RGBM',width=w,height=h,alpha=True,float_buffer=False);png.colorspace_settings.name='Non-Color';png.pixels.foreach_set(encoded.ravel());png.filepath_raw=str(out/a['file']);png.file_format='PNG';png.save();bpy.data.images.remove(png);bpy.data.images.remove(img)
 print('DENOISED',a['id'],a['denoise_seconds'],a['denoised_mean'],flush=True)
manifest['denoising']={'tool':'Intel Open Image Denoise 2.3.3','filter':'RTLightmap','device':'CUDA','quality':'high','source':'linear EXR; albedo is not baked into the lightmap'}
(out/'manifest.json').write_text(json.dumps(manifest,indent=2));src.unlink(missing_ok=True);dst.unlink(missing_ok=True)
print('HOUSE5_DENOISE_COMPLETE',flush=True)
