#!/usr/bin/env bash
set -euo pipefail
base=/workspace/housewalk/house5
project=$base/unreal/HouseWalk
cp -r /workspace/housewalk/project/unreal/HouseWalk/Source "$project/"
cp /workspace/housewalk/project/unreal/HouseWalk/Config/DefaultInput.ini "$project/Config/"
python3 - <<'PY'
from pathlib import Path
import json
p=Path('/workspace/housewalk/house5/unreal/HouseWalk')
f=p/'HouseWalk.uproject';j=json.loads(f.read_text());j['Description']='Danish Villa: Unreal scene editing and offline production review; separate baked browser delivery.'
for plug in j['Plugins']:
 if plug['Name']=='PixelStreaming2':plug['Enabled']=False
f.write_text(json.dumps(j,indent=2)+'\n')
f=p/'Config/DefaultEngine.ini';s=f.read_text().replace('=/Game/Maps/HouseWalk\n','=/Game/Maps/HouseWalk_Neutral\n');s=s.replace('=/Game/Maps/HouseWalk_Final\n','=/Game/Maps/HouseWalk_Neutral\n');f.write_text(s)
PY
tar -czf "$base/output/house5-unreal-project.tar.gz" --exclude='HouseWalk/Intermediate' --exclude='HouseWalk/Saved' --exclude='HouseWalk/DerivedDataCache' --exclude='HouseWalk/Binaries/Linux/HouseWalk*' -C "$base/unreal" HouseWalk
tar -czf "$base/output/house5-bake-production.tar.gz" --exclude='*.blend1' --exclude='pipeline/bake.py' --exclude='node_modules' -C "$base" output/baked source pipeline output/unreal-scene-report.json logs/bake.log logs/denoise.log logs/unreal-prepare.log logs/unreal-finish.log logs/unreal-review.log
cd "$base/output"
sha256sum house5-unreal-project.tar.gz house5-bake-production.tar.gz > archive-sha256.txt
ls -lh house5-*.tar.gz
