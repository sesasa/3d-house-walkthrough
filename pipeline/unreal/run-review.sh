#!/usr/bin/env bash
set -euo pipefail
base=/workspace/housewalk/house5
chmod -R a+rwX "$base/output" "$base/pipeline"
runuser -u housewalk -- /workspace/housewalk/engines/UnrealEngine-5.8.3/Engine/Binaries/Linux/UnrealEditor "$base/unreal/HouseWalk/HouseWalk.uproject" /Game/Maps/HouseWalk_Final -game -RenderOffscreen -vulkan -corelimit=12 -unattended -nosplash -nosound -ResX1600 -ResY900 -ForceRes -stdout -FullStdOutLogOutput "-HouseWalkPhotoTour=$base/pipeline/unreal-shots.json" > "$base/logs/unreal-review.log" 2>&1
