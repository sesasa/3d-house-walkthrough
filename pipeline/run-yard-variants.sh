#!/usr/bin/env bash
set -euo pipefail
pids=()
for base in /workspace/housewalk/house5 /workspace/housewalk/house5-closed; do
 HOUSE5_BASE="$base" HOUSE5_THREADS=6 bash "$base/pipeline/blender/run-bake.sh" &
 pids+=("$!")
done
status=0
for pid in "${pids[@]}"; do wait "$pid" || status=1; done
exit "$status"
