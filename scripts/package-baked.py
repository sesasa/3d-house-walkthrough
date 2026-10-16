from pathlib import Path
import zipfile,json,hashlib
root=Path(__file__).resolve().parents[1]
site=root/'output/browser'
assert (site/'index.html').exists()
for variant in ['baked','baked-closed']:
 manifest=json.loads((site/variant/'manifest.json').read_text())
 assert len(manifest['atlases'])==14 and manifest.get('denoising')
 for a in manifest['atlases']:assert (site/variant/a['file']).exists()
 assert (site/variant/'house-baked.glb').exists()
 assert len(list((site/variant/'reflections').glob('*.bin')))==8
files={str(p.relative_to(site)):hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(site.rglob('*')) if p.is_file()}
with zipfile.ZipFile(root/'output/danish-villa-website.zip','w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for name in files:z.write(site/name,name)
(root/'output/website-integrity.json').write_text(json.dumps(files,indent=2))
print('Website packaged:',len(files),'files,',(root/'output/danish-villa-website.zip').stat().st_size,'bytes')
