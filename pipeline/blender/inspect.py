import bpy,json
from pathlib import Path
base=Path('/workspace/housewalk/house5')
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(base/'source/danish-villa.glb'))
rooms=[]
for o in bpy.data.objects:
 if o.type=='MESH' and '_floor' in o.name:rooms.append({'name':o.name,'location':list(o.matrix_world.translation),'dimensions':list(o.dimensions),'parent':o.parent.name if o.parent else None})
p=bpy.context.preferences.addons['cycles'].preferences;p.compute_device_type='CUDA';p.get_devices()
print('HOUSE5_IMPORT',json.dumps({'meshes':sum(o.type=='MESH' for o in bpy.data.objects),'floors':rooms,'devices':[(d.name,d.type) for d in p.devices]}))
