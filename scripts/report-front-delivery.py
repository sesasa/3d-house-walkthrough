from pathlib import Path
import json,hashlib
root=Path(__file__).resolve().parents[1]
read=lambda p:json.loads(p.read_text())
report={'revision':'front-yard-attached-garage','default_doors':'open','dimensions':'Estimated from supplied plan/photos and approximately aligned public parcel/roof geometry; not surveyed','site':read(root/'reference/site/layout.json'),'variants':{}}
for suffix,variant in [('', 'open'),('-closed','closed')]:
 source=root/f'output/models/danish-villa{suffix}.glb';sha=hashlib.sha256(source.read_bytes()).hexdigest()
 manifest=read(root/f'app/public/baked{suffix}/manifest.json')
 unreal=read(root/f'output/production/unreal-scene-report{suffix}.json')
 validation=read(root/f'work/front-yard/{variant}/validation.json')
 assert manifest['source_sha256']==unreal['source_sha256']==validation['sourceHash']==sha
 assert not validation['errors'] and not validation['externalRequests']
 report['variants'][variant]={'source_sha256':sha,'baker':manifest['engine'],'devices':manifest['devices'],'denoising':manifest['denoising'],'presentation':manifest['presentation'],'lightmaps':len(manifest['atlases']),'lightmap_bytes':manifest['lightmap_container']['web_bytes'],'model_bytes':(root/f'app/public/baked{suffix}/house-baked.glb').stat().st_size,'unreal_map':unreal['map'],'unreal_cm_per_metre':unreal['cm_per_metre'],'validation':validation}
report['front_view']=read(root/'work/front-yard/audit-baked.json')
report['interaction']=read(root/'work/front-yard/door-toggle.json')
report['laptop_benchmark']=read(root/'work/front-yard/open/benchmark.json')
report['website_zip_bytes']=(root/'output/danish-villa-website.zip').stat().st_size
report['viewing']='Static local web assets; WebGL2 on viewer device; no cloud GPU dependency'
(root/'output/production/delivery-report.json').write_text(json.dumps(report,indent=2))
print('Delivery report verified both source/bake/Unreal/runtime hashes')
