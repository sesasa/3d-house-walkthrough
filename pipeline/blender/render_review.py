import bpy,json,math,os
from pathlib import Path
from mathutils import Vector
base=Path(os.environ.get('HOUSE5_BASE','/workspace/housewalk/house5'))
bpy.ops.wm.open_mainfile(filepath=str(base/'output/baked/production.blend'))
s=bpy.context.scene;s.render.engine='CYCLES';s.cycles.device='GPU';s.cycles.samples=128;s.cycles.use_denoising=False
p=bpy.context.preferences.addons['cycles'].preferences;p.compute_device_type='CUDA';p.get_devices()
for d in p.devices:d.use=d.type=='CUDA'
s.render.resolution_x=1200;s.render.resolution_y=800;s.render.resolution_percentage=100;s.render.image_settings.file_format='PNG'
s.view_settings.view_transform='AgX';s.view_settings.exposure=1.5
camera=bpy.data.cameras.new('Review camera');camera.lens=24;o=bpy.data.objects.new('Review camera',camera);s.collection.objects.link(o);s.camera=o
out=base/'output/cycles-review';out.mkdir(exist_ok=True)
for r in json.loads((base/'source/navigation.json').read_text())['rooms']:
 if r['id'] not in ['living','kitchen','primary','bathroom']:continue
 o.location=(r['spawn'][0],-r['spawn'][1],1.62);target=Vector((r['look'][0],-r['look'][1],1.35));o.rotation_euler=(target-o.location).to_track_quat('-Z','Y').to_euler()
 s.render.filepath=str(out/(r['id']+'.png'));bpy.ops.render.render(write_still=True)
print('HOUSE5_CYCLES_REVIEW_COMPLETE',flush=True)
