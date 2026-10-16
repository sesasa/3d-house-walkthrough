#!/usr/bin/env bash
set -euo pipefail
base=${HOUSE5_BASE:-/workspace/housewalk/house5}
blender -b -t "${HOUSE5_THREADS:-12}" --python "$base/pipeline/blender/bake.py" > "$base/logs/bake.log" 2>&1
grep -q HOUSE5_BAKE_COMPLETE "$base/logs/bake.log"
blender -b -t 8 --python "$base/pipeline/blender/denoise.py" > "$base/logs/denoise.log" 2>&1
grep -q HOUSE5_DENOISE_COMPLETE "$base/logs/denoise.log"
