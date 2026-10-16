import unreal,json,hashlib
from pathlib import Path
base=Path('/workspace/housewalk/house5');rig=json.loads((base/'pipeline/lighting.json').read_text())
levels=unreal.get_editor_subsystem(unreal.LevelEditorSubsystem);actors=unreal.get_editor_subsystem(unreal.EditorActorSubsystem)
assert levels.load_level('/Game/Maps/HouseWalk_Final')
def world(v):return unreal.Vector(v[0]*100,v[2]*100,v[1]*100)
for p in rig.get('practicals',[]):
 if any(a.get_actor_label()==p['name'] for a in actors.get_all_level_actors()):continue
 pos=world(p['position']);target=world(p['target']);actor=actors.spawn_actor_from_class(unreal.RectLight,pos,unreal.MathLibrary.find_look_at_rotation(pos,target));actor.set_actor_label(p['name']);c=actor.light_component;c.set_mobility(unreal.ComponentMobility.MOVABLE);c.set_editor_property('intensity_units',unreal.LightUnits.LUMENS);c.set_intensity(p['unreal_lumens']);c.set_editor_property('source_width',p['width']*100);c.set_editor_property('source_height',p['height']*100);c.set_editor_property('use_temperature',True);c.set_editor_property('temperature',4200.)
trim_count=0
for a in actors.get_all_level_actors():
 if not a.get_actor_label().startswith('Cabinet_rail'):continue
 if unreal.Name('House5_TrimJoined') in a.tags:continue
 for c in a.get_components_by_class(unreal.StaticMeshComponent):
  if not c.static_mesh:continue
  bounds=c.static_mesh.get_bounding_box();width=bounds.max.x-bounds.min.x
  if width<=9.2:continue
  scale=c.get_editor_property('relative_scale3d');c.set_relative_scale3d(unreal.Vector(scale.x*(width-9.2)/width,scale.y,scale.z));trim_count+=1
 a.set_editor_property('tags',list(a.tags)+[unreal.Name('House5_TrimJoined')])
assert levels.save_current_level()
report=json.loads((base/'output/unreal-scene-report.json').read_text());report['lighting']=rig;report['joined_cabinet_rails']=trim_count;report['source_sha256']=hashlib.sha256((base/'source/danish-villa.glb').read_bytes()).hexdigest();(base/'output/unreal-scene-report.json').write_text(json.dumps(report,indent=2));unreal.log('HOUSE5_UNREAL_FINAL_LIGHTING')
