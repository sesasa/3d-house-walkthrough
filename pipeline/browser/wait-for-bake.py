"""Wait for a completed, denoised bake of the requested source, not an older log."""
import sys,time,json
from pathlib import Path
base=Path(sys.argv[1]);wanted=sys.argv[2]
for _ in range(240):
 try:
  m=json.loads((base/'output/baked/manifest.json').read_text())
  if m.get('source_sha256')==wanted and m.get('denoising') and len(m.get('atlases',[]))==14:
   print('Current bake ready:',wanted,flush=True);break
 except (OSError,ValueError):pass
 time.sleep(10)
else:raise RuntimeError('Bake did not finish within 40 minutes')
