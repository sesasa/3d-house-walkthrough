#!/usr/bin/env bash
set -euo pipefail
base=/workspace/housewalk/house5
project=$base/unreal/HouseWalk
python3 - <<'PY'
from pathlib import Path
import re
p=Path('/workspace/housewalk/house5/unreal/HouseWalk/Config/DefaultEngine.ini')
s=p.read_text();s=re.sub(r'((?:EditorStartupMap|GameDefaultMap)=)/Game/Maps/HouseWalk[^\n]*',r'\1/Game/Maps/HouseWalk_FrontOpen',s);p.write_text(s)
PY
tar -czf "$base/output/house5-unreal-project.tar.gz" --exclude='HouseWalk/Intermediate' --exclude='HouseWalk/Saved' --exclude='HouseWalk/DerivedDataCache' --exclude='HouseWalk/Binaries/Linux/HouseWalk*' -C "$base/unreal" HouseWalk
tar -czf "$base/output/house5-bake-production.tar.gz" --exclude='*.blend1' --exclude='node_modules' --exclude='__pycache__' -C "$base" output/baked source pipeline output/unreal-scene-report.json logs/bake.log logs/denoise.log logs/unreal-prepare.log
tar -czf "$base/output/house5-closed-bake-production.tar.gz" --exclude='*.blend1' --exclude='node_modules' --exclude='__pycache__' -C /workspace/housewalk/house5-closed output/baked source pipeline output/unreal-scene-report.json logs/bake.log logs/denoise.log
cd "$base/output"
sha256sum house5-unreal-project.tar.gz house5-bake-production.tar.gz house5-closed-bake-production.tar.gz > archive-sha256.txt
ls -lh house5-*.tar.gz
