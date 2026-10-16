"""Losslessly reduce lightmap transfer size; decoded RGBA must be identical."""
from pathlib import Path
from PIL import Image
import json,sys
source=Path(sys.argv[1]);target=Path(sys.argv[2]);target.mkdir(parents=True,exist_ok=True)
manifest=json.loads((source/'manifest.json').read_text());before=after=0
for a in manifest['atlases']:
 src=source/a['file'];im=Image.open(src).convert('RGBA');dest=target/(a['id']+'.webp')
 im.save(dest,'WEBP',lossless=True,method=6,exact=True)
 assert Image.open(dest).convert('RGBA').tobytes()==im.tobytes(), 'Lightmap pixel regression'
 before+=src.stat().st_size;after+=dest.stat().st_size;a['original_file']=a['file'];a['file']=dest.name
manifest['lightmap_container']={'format':'lossless WebP','rgba_verification':'Every decoded pixel matches the original RGBM PNG','source_bytes':before,'web_bytes':after}
(target/'manifest.json').write_text(json.dumps(manifest,indent=2))
print(manifest['lightmap_container'])
