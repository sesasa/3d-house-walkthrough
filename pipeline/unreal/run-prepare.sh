#!/usr/bin/env bash
set -euo pipefail
base=/workspace/housewalk/house5
engine=/workspace/housewalk/engines/UnrealEngine-5.8.3
project=$base/unreal/HouseWalk
mkdir -p "$project/Config" "$project/Content" "$project/Saved"
if [ ! -f "$project/HouseWalk.uproject" ]; then
 cp /workspace/housewalk/project/unreal/HouseWalk/HouseWalk.uproject "$project/HouseWalk.uproject"
 cp /workspace/housewalk/project/unreal/HouseWalk/Config/DefaultEngine.ini "$project/Config/DefaultEngine.ini"
 cp -a "$base/old-binaries-copy" "$project/Binaries"
fi
chmod -R a+rwX "$base"
runuser -u housewalk -- "$engine/Engine/Binaries/Linux/UnrealEditor-Cmd" "$project/HouseWalk.uproject" -RenderOffscreen -corelimit=12 -unattended -nosplash -vulkan -nosound -stdout -FullStdOutLogOutput "-ExecutePythonScript=$base/pipeline/unreal/${HOUSE5_PREPARE_SCRIPT:-prepare_scene.py}" > "$base/logs/unreal-prepare.log" 2>&1
rg HOUSE5_UNREAL_PREPARED "$base/logs/unreal-prepare.log" || grep HOUSE5_UNREAL_PREPARED "$base/logs/unreal-prepare.log"
