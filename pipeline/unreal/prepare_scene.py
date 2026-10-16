"""Create an isolated, actual Unreal scene for House 5 production review."""
import json,math,hashlib,os
from pathlib import Path
import unreal
base=Path(os.environ.get('HOUSE5_BASE','/workspace/housewalk/house5'));p=Path(unreal.Paths.project_dir()).resolve()
levels=unreal.get_editor_subsystem(unreal.LevelEditorSubsystem);actors=unreal.get_editor_subsystem(unreal.EditorActorSubsystem)
revision=os.environ.get('HOUSE5_REVISION','Final')
map_path='/Game/Maps/HouseWalk_'+revision;destination='/Game/House5/'+revision
if unreal.EditorAssetLibrary.does_asset_exist(map_path):raise RuntimeError('Refusing to overwrite an existing scene')
assert levels.new_level(map_path)
source=unreal.InterchangeManager.create_source_data(str(base/'source/danish-villa.glb'))
params=unreal.ImportAssetParameters();params.is_automated=True;params.replace_existing=False
assert unreal.InterchangeManager.get_interchange_manager_scripted().import_scene(destination,source,params)
floors={};count=0
for actor in actors.get_all_level_actors():
 label=actor.get_actor_label()
 for c in actor.get_components_by_class(unreal.StaticMeshComponent):
  if not c.static_mesh:continue
  count+=1;c.set_collision_profile_name('NoCollision')
  if label in ['hall_floor','kitchen_floor','primary_floor']:
   center,extent,_=unreal.SystemLibrary.get_component_bounds(c)
   # The first/largest slab is the main hall rectangle, not its small return.
   if label not in floors or extent.x*extent.y>floors[label][1]:floors[label]=([center.x,center.y,center.z+extent.z],extent.x*extent.y)
assert count>1000,count
rooms=json.loads((base/'source/navigation.json').read_text())['rooms'];lookup={r['id']:r for r in rooms}
refs=['hall','kitchen','primary'];src=[];dst=[]
for id in refs:
 b=lookup[id]['bounds'];src.append([(b[0]+b[2])/2,(b[1]+b[3])/2]);dst.append(floors[id+'_floor'][0])
ax,ay=src[0];bx,by=src[1][0]-ax,src[1][1]-ay;cx,cy=src[2][0]-ax,src[2][1]-ay;det=bx*cy-by*cx
assert abs(det)>.01

def world(x,z,h=0):
 dx,dy=x-ax,z-ay;b=(dx*cy-dy*cx)/det;c=(bx*dy-by*dx)/det
 return unreal.Vector(*[dst[0][i]+b*(dst[1][i]-dst[0][i])+c*(dst[2][i]-dst[0][i])+(h*100 if i==2 else 0) for i in range(3)])
a,b=world(0,0),world(1,0);scale=math.hypot(b.x-a.x,b.y-a.y);assert abs(scale-100)<.1,scale
shots=[]
for i,r in enumerate(rooms):
 pos=world(*r['spawn'],1.62);target=world(*r['look'],1.5);yaw=math.degrees(math.atan2(target.y-pos.y,target.x-pos.x));rot=unreal.Rotator(pitch=-5,yaw=yaw,roll=0)
 marker=actors.spawn_actor_from_class(unreal.TargetPoint,pos,rot);marker.set_actor_label('HouseWalk_Room_'+r['id']);marker.set_editor_property('tags',[unreal.Name('HouseWalkRoom'+str(i))])
 if r['id']=='hall':
  start=actors.spawn_actor_from_class(unreal.PlayerStart,world(*r['spawn'],.95),rot);start.set_actor_label('HouseWalk_PlayerStart')
 if r['id'] in ['kitchen','living','primary']:shots.append({'name':r['id'],'position_cm':[pos.x,pos.y,pos.z],'rotation':[-5,yaw,0],'fov':82})
rig=json.loads((base/'pipeline/lighting.json').read_text());sp=rig['sun']['position'];st=rig['sun']['target'];v=world(sp[0],sp[2],sp[1]);t=world(st[0],st[2],st[1]);rotation=unreal.MathLibrary.find_look_at_rotation(v,t)
sun=actors.spawn_actor_from_class(unreal.DirectionalLight,v,rotation);sun.set_actor_label('House5_Sun');c=sun.light_component;c.set_mobility(unreal.ComponentMobility.MOVABLE);c.set_intensity(rig['unreal']['sun_lux']);c.set_editor_property('light_source_angle',rig['sun']['angular_size_degrees']);c.set_editor_property('atmosphere_sun_light',True);c.set_editor_property('use_temperature',True);c.set_editor_property('temperature',6500.)
sky=actors.spawn_actor_from_class(unreal.SkyLight,world(5,5,10));sky.set_actor_label('House5_Sky');sky.light_component.set_mobility(unreal.ComponentMobility.MOVABLE);sky.light_component.set_intensity(1.0);sky.light_component.set_editor_property('real_time_capture',True)
actors.spawn_actor_from_class(unreal.SkyAtmosphere,unreal.Vector())
post=actors.spawn_actor_from_class(unreal.PostProcessVolume,unreal.Vector());post.set_editor_property('unbound',True);s=post.get_editor_property('settings')
for k,val in {'override_auto_exposure_min_brightness':True,'override_auto_exposure_max_brightness':True,'auto_exposure_min_brightness':8.0,'auto_exposure_max_brightness':8.0,'override_auto_exposure_bias':True,'auto_exposure_bias':0.0,'override_motion_blur_amount':True,'motion_blur_amount':0.0,'override_lumen_scene_lighting_quality':True,'lumen_scene_lighting_quality':4.0,'override_lumen_final_gather_quality':True,'lumen_final_gather_quality':4.0,'override_bloom_intensity':True,'bloom_intensity':.10}.items():s.set_editor_property(k,val)
post.set_editor_property('settings',s)
for practical in rig.get('practicals',[]):
 v=practical['position'];t=practical['target'];pos=world(v[0],v[2],v[1]);target=world(t[0],t[2],t[1]);lamp=actors.spawn_actor_from_class(unreal.RectLight,pos,unreal.MathLibrary.find_look_at_rotation(pos,target));lamp.set_actor_label(practical['name']);c=lamp.light_component;c.set_mobility(unreal.ComponentMobility.MOVABLE);c.set_editor_property('intensity_units',unreal.LightUnits.LUMENS);c.set_intensity(practical['unreal_lumens']);c.set_editor_property('source_width',practical['width']*100);c.set_editor_property('source_height',practical['height']*100);c.set_editor_property('use_temperature',True);c.set_editor_property('temperature',6500.)
unreal.EditorAssetLibrary.save_directory(destination,only_if_is_dirty=True,recursive=True);assert levels.save_current_level()
(base/'output/unreal-review').mkdir(parents=True,exist_ok=True)
(base/'pipeline/unreal-shots.json').write_text(json.dumps({'output':str(base/'output/unreal-review'),'waitSeconds':25,'pathTracing':False,'shots':shots},indent=2))
report={'engine':unreal.SystemLibrary.get_engine_version(),'mesh_components':count,'cm_per_metre':scale,'source_sha256':hashlib.sha256((base/'source/danish-villa.glb').read_bytes()).hexdigest(),'map':map_path,'project':str(p),'lighting':rig,'rooms':rooms}
(base/'output/unreal-scene-report.json').write_text(json.dumps(report,indent=2));unreal.log('HOUSE5_UNREAL_PREPARED')
