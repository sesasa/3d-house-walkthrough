#!/usr/bin/env bash
set -euo pipefail
variant=${1:-open}
root=properties/danish-villa
remote=/workspace/housewalk/house5
public="$root/app/public/baked"
source="$root/output/models/danish-villa.glb"
if [ "$variant" = closed ]; then
 remote=/workspace/housewalk/house5-closed
 public="$root/app/public/baked-closed"
 source="$root/output/models/danish-villa-closed.glb"
fi
raw="$root/work/front-yard/raw-$variant"
mkdir -p "$raw" "$public"
rsync -rz --include='*.glb' --include='*.png' --include='*.json' --exclude='*' -e "ssh -i ${POD_SSH_KEY:?} -p ${POD_SSH_PORT:?}" "root@${POD_HOST:?}:$remote/output/baked/" "$raw/"
python3 - "$raw" "$source" <<'PY'
import sys,json,hashlib
from pathlib import Path
raw,source=map(Path,sys.argv[1:]);m=json.loads((raw/'manifest.json').read_text())
assert m['source_sha256']==hashlib.sha256(source.read_bytes()).hexdigest(),'Stale source bake'
assert m.get('denoising') and len(m['atlases'])==14,'Incomplete bake'
print('Verified current source and 14 denoised lightmaps')
PY
node "$root/pipeline/optimize.mjs" "$raw/house-baked.glb" "$public/house-baked.glb"
python3 "$root/pipeline/optimize-lightmaps.py" "$raw" "$public"
