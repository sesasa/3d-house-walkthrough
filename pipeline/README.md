# Offline lighting → static browser tour

The canonical instructions for the final project are the [production playbook](../../../docs/house-tour-reference/PRODUCTION-PLAYBOOK.md). The [technical report](../../../docs/house-tour-reference/TECHNICAL-REPORT.md) explains the architecture and tool responsibilities; the [baseline manifest](../../../docs/house-tour-reference/baseline.json) records settings and artifact hashes.

The common photo-informed source GLB is imported into Unreal for editing and into Blender/Cycles for portable diffuse lightmap baking. OIDN denoises the maps; the browser uses optimized GLB, RGBM WebP lightmaps and precomputed reflections. Visitors require no RunPod server.

Use `browser/export-source.mjs` for source export, and `presentation.json` for the effective final neutral grade. Process both open and closed door poses. Final Unreal maps are HouseWalk_FrontOpen and HouseWalk_FrontClosed, retained in `../output/production/house5-unreal-project.tar.gz`. Existing scripts contain property-specific paths and historical SSH endpoints: adapt them before another property or Pod connection. Do not apply historical geometry patches to the final scene.
