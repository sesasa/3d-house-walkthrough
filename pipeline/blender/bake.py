"""Portable static diffuse lightmaps; run on the development GPU, never at serving time."""
import bpy,json,math,time,hashlib,sys,os
import numpy as np
from pathlib import Path
from mathutils import Vector
base=Path(os.environ.get('HOUSE5_BASE','/workspace/housewalk/house5'))
out=base/'output/baked';out.mkdir(parents=True,exist_ok=True)
rig=json.loads((base/'pipeline/lighting.json').read_text());signature=hashlib.sha256((base/'source/danish-villa.glb').read_bytes()+json.dumps(rig,sort_keys=True).encode()+b'uv-v3-welded').hexdigest();nav=json.loads((base/'source/navigation.json').read_text())
args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
prepare='--prepare' in args
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(base/'source/danish-villa.glb'))
bpy.context.view_layer.update()
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.device='GPU'
prefs=bpy.context.preferences.addons['cycles'].preferences;prefs.compute_device_type='CUDA';prefs.get_devices()
for d in prefs.devices:d.use=d.type=='CUDA'
assert any(d.use for d in prefs.devices),'CUDA GPU required for production bake'
scene.cycles.samples=rig['bake']['samples'];scene.cycles.max_bounces=rig['bake']['bounces'];scene.cycles.diffuse_bounces=rig['bake']['diffuse_bounces'];scene.cycles.transparent_max_bounces=12
scene.cycles.use_denoising=False;scene.render.threads_mode='FIXED';scene.render.threads=12
scene.world=bpy.data.worlds.new('Daylight');scene.world.use_nodes=True
background=scene.world.node_tree.nodes.get('Background');background.inputs['Color'].default_value=(*rig['sky']['color'],1);background.inputs['Strength'].default_value=rig['sky']['strength']
sun=bpy.data.lights.new('Production daylight','SUN');sun.energy=rig['sun']['energy'];sun.angle=math.radians(rig['sun']['angular_size_degrees']);sun.color=rig['sun']['color']
obj=bpy.data.objects.new('Production daylight',sun);scene.collection.objects.link(obj)
def coord(v):return Vector((v[0],-v[2],v[1]))
obj.location=coord(rig['sun']['position']);obj.rotation_euler=(coord(rig['sun']['target'])-obj.location).to_track_quat('-Z','Y').to_euler()
for practical in rig.get('practicals',[]):
 light=bpy.data.lights.new(practical['name'],'AREA');light.energy=practical['power_w'];light.color=practical['color'];light.shape='RECTANGLE';light.size=practical['width'];light.size_y=practical['height']
 lamp=bpy.data.objects.new(practical['name'],light);scene.collection.objects.link(lamp);lamp.location=coord(practical['position']);lamp.rotation_euler=(coord(practical['target'])-lamp.location).to_track_quat('-Z','Y').to_euler()
# Blender lightmaps must use a second UV set; original material maps stay on UV0.
for m in bpy.data.materials:
 if not m.use_nodes:continue
 for node in list(m.node_tree.nodes):
  if node.type=='TEX_IMAGE' and not node.inputs['Vector'].is_linked:
   uv=m.node_tree.nodes.new('ShaderNodeUVMap');uv.uv_map='UVMap';m.node_tree.links.new(uv.outputs['UV'],node.inputs['Vector'])
# Find each original category before flattening. Thin glazing transmits daylight;
# its legacy alpha-blend representation is excluded from diffuse bake occlusion.
groups={};original=[];transparent=[];metal=[]
def category(o):
 p=o
 while p.parent and p.parent.name not in ['Danish_Villa','Danish-Villa']:
  if p.name in ['Architecture','Floors','Fixed','Windows','Furniture','Ceilings','Roof','Garden']:return p.name
  p=p.parent
 return p.name

def room_at(o):
 center=o.matrix_world@(sum((Vector(v) for v in o.bound_box),Vector())/8);x,z=center.x,-center.y
 def dist(r):
  return min(max(b[0]-x,0,x-b[2])**2+max(b[1]-z,0,z-b[3])**2 for b in [r['bounds']]+r.get('extra',[]))
 return min(nav['rooms'],key=dist)['id']
for o in list(bpy.data.objects):
 if o.type!='MESH':continue
 cat=category(o);o['category']=cat;original.append(o)
 mats=[m for m in o.data.materials if m]
 trans=any(m.name in ['Clear glazing','Frosted bathroom glass'] for m in mats)
 ism=bool(mats) and all(any(n.type=='BSDF_PRINCIPLED' and n.inputs['Metallic'].default_value>.8 for n in m.node_tree.nodes) for m in mats if m.use_nodes)
 if trans:transparent.append(o);o.hide_render=True
 if trans or ism or cat in ['Garden','Roof']:continue
 key='ceilings' if cat=='Ceilings' else room_at(o)+'_'+('furniture' if cat=='Furniture' else 'structure')
 groups.setdefault(key,[]).append(o)
print('ATLAS_GROUPS', {k:len(v) for k,v in groups.items()},flush=True)
# Join per atlas and category, preserving the overview/furniture switches and
# materials. Share a non-overlapping UV layout across all objects in each atlas.
records=[]
for key,objects in sorted(groups.items()):
 bpy.ops.object.select_all(action='DESELECT')
 for o in objects:
  matrix=o.matrix_world.copy();o.parent=None;o.matrix_world=matrix;o.data=o.data.copy();o.select_set(True)
 bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 # Temporarily join everything in this atlas. Material slots remember category.
 for o in objects:
  for slot in o.material_slots:
   if slot.material:
    old=slot.material;name=old.name+'__'+key+'__'+o['category']
    mat=bpy.data.materials.get(name)
    if not mat:mat=old.copy();mat.name=name;mat['bakeAtlas']=key;mat['category']=o['category']
    slot.material=mat
 bpy.ops.object.join();o=bpy.context.object;o.name='Baked_'+key
 if not o.data.uv_layers:o.data.uv_layers.new(name='UVMap')
 o.data.uv_layers[0].name='UVMap'
 uv=o.data.uv_layers.new(name='Lightmap');o.data.uv_layers.active=uv
 bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT')
 bpy.ops.mesh.remove_doubles(threshold=0.000001)
 bpy.ops.uv.smart_project(angle_limit=math.radians(66),margin_method='FRACTION',island_margin=.002,area_weight=.15,correct_aspect=True,scale_to_bounds=True)
 bpy.ops.object.mode_set(mode='OBJECT')
 size=1024 if key in ['hall_structure','hall_furniture','wc_structure'] else 2048
 img=bpy.data.images.new('Lightmap_'+key,width=size,height=size,alpha=True,float_buffer=True);img.colorspace_settings.name='Non-Color'
 for mat in o.data.materials:
  node=mat.node_tree.nodes.new('ShaderNodeTexImage');node.name='BAKE_TARGET';node.image=img;mat.node_tree.nodes.active=node
 o.data.calc_loop_triangles();coords=np.array([v.uv[:] for v in o.data.uv_layers['Lightmap'].data]);indices=np.array([t.loops[:] for t in o.data.loop_triangles]);tris=coords[indices];uv_area=float(np.abs(np.cross(tris[:,1]-tris[:,0],tris[:,2]-tris[:,0])).sum()/2)
 assert .1<uv_area<1.001, (key,'Poor UV atlas occupancy',uv_area)
 records.append({'id':key,'object':o.name,'size':size,'image':img.name,'uv_coverage':uv_area})
 scene.render.bake.margin=rig['bake']['margin']
 print('UNWRAPPED',key,len(o.data.polygons),flush=True)
# Store preparation separately; individual maps can resume after interruption.
bpy.ops.wm.save_as_mainfile(filepath=str(out/'production.blend'))
scene.render.bake.use_pass_direct=True;scene.render.bake.use_pass_indirect=True;scene.render.bake.use_pass_color=False
manifest={'version':1,'source_sha256':hashlib.sha256((base/'source/danish-villa.glb').read_bytes()).hexdigest(),'engine':'Blender '+bpy.app.version_string+' / Cycles CUDA','devices':[d.name for d in prefs.devices if d.use],'encoding':'RGBM','range':16,'lightMapIntensity':math.pi,'uvChannel':1,'rig':rig,'atlases':[]}
for rec in records:
 key=rec['id'];o=bpy.data.objects[rec['object']];img=bpy.data.images[rec['image']];path=out/(key+'.png');statsfile=out/(key+'.json')
 if path.exists() and statsfile.exists() and json.loads(statsfile.read_text()).get('signature')==signature:
  manifest['atlases'].append(json.loads(statsfile.read_text()));print('RESUME',key,flush=True);continue
 bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o;o.data.uv_layers.active=o.data.uv_layers['Lightmap']
 started=time.time();print('BAKE_BEGIN',key,flush=True)
 o.data.uv_layers['Lightmap'].active_render=True
 bpy.ops.object.bake(type='DIFFUSE',uv_layer='Lightmap')
 pixels=np.empty(rec['size']**2*4,dtype=np.float32);img.pixels.foreach_get(pixels);pixels=pixels.reshape((-1,4));rgb=np.maximum(pixels[:,:3],0)
 rec.update({'signature':signature,'uv_version':3,'file':key+'.png','seconds':round(time.time()-started,2),'max':float(rgb.max()),'mean':float(rgb.mean()),'clipped_fraction':float(np.mean(rgb>16))})
 assert rec['max']>0 and np.isfinite(rgb).all(), 'Empty/invalid lightmap: '+key
 # Retain linear float output for future rebakes/re-encoding.
 img.filepath_raw=str(out/(key+'.exr'));img.file_format='OPEN_EXR';img.save()
 mult=np.clip(np.ceil(np.max(rgb,axis=1)/16*255)/255,1/255,1);encoded=np.concatenate((np.clip(rgb/(mult[:,None]*16),0,1),mult[:,None]),axis=1)
 png=bpy.data.images.new('RGBM_'+key,width=rec['size'],height=rec['size'],alpha=True,float_buffer=False);png.colorspace_settings.name='Non-Color';png.pixels.foreach_set(encoded.ravel());png.filepath_raw=str(path);png.file_format='PNG';png.save();bpy.data.images.remove(png)
 statsfile.write_text(json.dumps(rec,indent=2));manifest['atlases'].append(rec);(out/'manifest.json').write_text(json.dumps(manifest,indent=2));print('BAKE_DONE',json.dumps(rec),flush=True)
# Export PBR geometry with both UV sets; custom manifest supplies portable maps.
for o in transparent:o.hide_render=False
for m in bpy.data.materials:
 if m.use_nodes:
  for n in list(m.node_tree.nodes):
   if n.name=='BAKE_TARGET':m.node_tree.nodes.remove(n)
for o in bpy.data.objects:
 if o.type=='MESH' and o.data.uv_layers:o.data.uv_layers.active_index=0;o.data.uv_layers[0].active_render=True
bpy.ops.export_scene.gltf(filepath=str(out/'house-baked.glb'),export_format='GLB',export_extras=True,export_yup=True,export_cameras=False,export_lights=False)
manifest['model']='house-baked.glb';(out/'manifest.json').write_text(json.dumps(manifest,indent=2));print('HOUSE5_BAKE_COMPLETE',flush=True)
