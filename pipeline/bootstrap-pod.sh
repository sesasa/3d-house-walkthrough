#!/usr/bin/env bash
# The container resets on Pod stop/start; the network volume persists.
set -euo pipefail
base=/workspace/housewalk/house5
apt-get update -qq
DEBIAN_FRONTEND=noninteractive apt-get install -y -qq blender libegl1 vulkan-tools
id housewalk >/dev/null 2>&1 || useradd -m -u 1001 -d /workspace/housewalk/home -s /bin/bash housewalk
# Vulkan needs libegl1 even when Unreal renders offscreen.
vulkaninfo --summary
# Retain the CUDA compiler cache between development sessions.
mkdir -p /root/.cache/cycles/kernels
if [ -d "$base/tools/cycles-kernels" ]; then cp -n "$base/tools/cycles-kernels/"* /root/.cache/cycles/kernels/; fi
