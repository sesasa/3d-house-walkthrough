#!/usr/bin/env bash
set -euo pipefail
base=/workspace/housewalk/house5
chmod -R a+rwX "$base/pipeline" "$base/output"
runuser -u housewalk -- /workspace/housewalk/engines/UnrealEngine-5.8.3/Engine/Binaries/Linux/UnrealEditor-Cmd "$base/unreal/HouseWalk/HouseWalk.uproject" -RenderOffscreen -vulkan -corelimit=12 -unattended -nosplash -nosound -stdout -FullStdOutLogOutput "-ExecutePythonScript=$base/pipeline/unreal/finish_scene.py" > "$base/logs/unreal-finish.log" 2>&1
grep -q HOUSE5_UNREAL_FINAL_LIGHTING "$base/logs/unreal-finish.log"
bash "$base/pipeline/unreal/run-review.sh"
