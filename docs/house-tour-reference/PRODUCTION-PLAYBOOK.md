# Reusable property-tour production playbook

**Baseline:** Danish Villa / front-yard-attached-garage. Read the [technical report](TECHNICAL-REPORT.md) first. This playbook captures the completed pipeline; it is not a claim that arbitrary images can be converted automatically or that fresh GPU bakes are byte-identical.

## 1. Start an isolated property

Create `properties/<slug>/` with `input/photos`, `input/floor-plans`, `input/videos`, `input/documents`, `reference`, `work`, `app`, `pipeline`, `scripts` and `output`. Preserve original filenames and source files. Use the [brief](templates/property-brief.md) and [measurement sheet](templates/measurements.csv). Keep private source documents outside the public site. Retain asset licences and only distribute intended photos.

Reuse the baseline renderer, material helpers, baking pipeline, controls and validation concepts. Replace all property-specific geometry and evidence. Do not overwrite the existing #5 or #13 property, or blindly copy their scene coordinates, photos or assumptions. The existing scripts contain hard-coded house names, paths, ports, counts and cloud locations: adapting these is a required stage, not an optional cleanup.

## 2. Establish the evidence and scale before detailing

Use the actual main plan; distinguish alternative layouts. Associate photos with rooms and wall directions. Record dimensions with source, units and status: measured, plan-derived, photo-estimated, owner-confirmed or unknown. Use known plan dimensions as independent scale anchors; check both axes and several rooms rather than assuming a distorted plan has one uniform scale. State ceiling-height and site-boundary uncertainty.

Create an opening schedule before adding lighting: ID, host wall, position, width, height, sill height, door hinge endpoint, swing side, opening angle, photo/plan evidence and confidence. Verify inside/outside orientation explicitly. Check every exterior window against interior and exterior photos. Do not invent openings or incidental sockets to fill blank surfaces.

Model walls, levels, ceilings, doors, windows, cabinets, refrigerator, sink and bathroom fixtures first. Check cabinet depths, worktop heights, appliance locations and door clearances against the plan/photos. Then add faithful furniture proportions, chair orientation, restrained cushions/bedding and material scale. Add simplified exterior masses, surface colours and planting from evidence; preserve building contacts such as an attached garage. Avoid treating roof overhang outlines as surveyed wall boundaries.

**Gate:** side-by-side plan and photo review confirms the fixed-item schedule and room connectivity before expensive baking. Record unresolved estimates instead of disguising them with lighting.

## 3. Files to adapt

All paths below are relative to the property directory unless stated otherwise.

| Concern | Baseline implementation |
|---|---|
| Room bounds, openings, handing, assumptions | `app/src/property.js`, `model.js` |
| Furniture and soft forms | `furnishing-refinement.js`, `soft-shapes.js`, `upholstery.js`, `scanned-assets.js` under `app/src/` |
| Material scale and calibration | `app/src/materials.js`, `quality.js` |
| Site and street | `app/src/site.json`, `yard.js`, `front-yard.js`; `reference/site/` |
| Baked runtime and reflections | `app/src/baked-house.js`, `room-reflections.js`, `batch.js` |
| Controls, cameras, UI | `app/src/navigation.js`, `main.js`, `style.css` |
| Source/metadata export | `pipeline/browser/export-source.mjs` |
| Production lighting | `pipeline/lighting.json`, `presentation.json` |
| GPU operations | `pipeline/blender/`, `pipeline/unreal/`, shell wrappers |
| Verification and distribution | `scripts/validate-baked.mjs`, `check-door-toggle.mjs`, `check-front-yard.mjs`, `benchmark.mjs`, `package-baked.py` |

Search copied scripts for the old property slug, `house5`, `HOUSE5`, map names, source filenames, SSH endpoints, ports 5175/4175 and count assertions. Replace them within the new workspace. Determine new atlas/room/opening counts from the new property; 14 atlases, eight rooms and 16 calibrated openings belong to this baseline. Preserve lockfiles and use `npm ci`; record any deliberate tool upgrades and validate their output.

## 4. Production requirements and proven settings

Local: Node/npm compatible with the retained lockfiles, Python 3/Pillow, Chrome and Playwright, rsync/SSH, and enough free disk for inputs, editable scenes, raw maps, archives and a build. A native GPU-enabled browser is needed for representative reflection capture and laptop benchmarks. Record `node --version`, Python/Pillow and Chrome versions for each new job; their historical exact versions are not all captured in this baseline.

Cloud: authenticated RunPod access, an authorized compute budget, a persistent `/workspace` volume, adequate disk capacity, an NVIDIA CUDA GPU and compatible driver/container. The final L4 had 24 GB VRAM. Unreal requires an Epic-authorized Linux editor installation and runs as the non-root `housewalk` user. Do not place API keys or temporary download links in project documentation. Inspect the live Pod connection details; SSH ports are ephemeral. Provisioning and spending follow the current user's authorization.

| Setting | Baseline value / invariant |
|---|---|
| Source units | metres, X east / Y up / Z south; verify Unreal 100 cm per metre |
| Cycles | CUDA, 256 samples, 12 total / 8 diffuse bounces |
| Bake | direct + indirect diffuse; exclude material albedo |
| UVs | retain material UV0; weld coincident triangle vertices before separate lightmap unwrap |
| Atlases | 11 × 2048² and 3 × 1024² per pose; margin 4; count/size adapt to property |
| Denoise | OIDN 2.3.3 CUDA, RTLightmap, high quality, linear EXR input |
| Presentation | colour retention .35; shadow floor .012; structure .065; ceiling .035; wet room .10 |
| Encoding | linear RGBM, range 16; lossless WebP with exact RGBA round-trip check |
| Runtime | decode RGBM before bilinear filtering; no encoded RGBM mipmaps; lightMap intensity π; remove duplicate realtime diffuse contribution |
| Mesh optimization | Meshopt; preserve UV channels, material extras and vertex colours; no geometry simplification in this baseline |
| Reflections | precomputed per-room probes; high-detail planar mirrors |
| Controls | W/S and ↑/↓ move; A/D and ←/→ rotate; drag look |

`pipeline/presentation.json` is the effective final presentation grade. The older embedded presentation block in `lighting.json` is overridden; do not use it as the final setting. The exact sun, sky and practical-light values remain in `lighting.json`; placements and intensity need calibration for another house. Keep bathrooms and ceramics neutral and avoid excessive colour cast or shadow contrast.

Transparent surfaces must admit daylight during diffuse baking; metal/glass retain runtime shading. Garden/roof geometry can affect the bake while being excluded as lightmap targets. Preserve material assignments, UV1 and `COLOR` through batching/export; dropped foliage vertex colours produce incorrect dark trees.

## 5. Run order

The commands below are **baseline commands**, run from the workspace root unless noted. Adapt paths first for another house. Commands that bake or export mutate outputs; use a separate working copy for experiments.

1. Start the property dev app (`npm run dev` inside `app/`, port 5175). Export both poses with `node properties/danish-villa/pipeline/browser/export-source.mjs` and the same command with `--closed`. It explicitly exports the procedural source and matching metadata. Do not substitute the older `scripts/validate-export.mjs` export path. Confirm unblocked room spawns and source SHA256s.
2. Inspect or start the authorized Pod, check GPU/disk availability and mount the retained volume. Run `pipeline/bootstrap-pod.sh` after restart: container dependencies may need reinstalling, including `libegl1` for offscreen Vulkan. Stage each pose's source and pipeline under separate bases (`/workspace/housewalk/house5` and `house5-closed` in this baseline). Compare local/remote hashes.
3. Prepare Unreal using `pipeline/unreal/run-prepare.sh` and `HOUSE5_PREPARE_SCRIPT` pointing to `prepare_yard_variants.py`. The final maps are `/Game/Maps/HouseWalk_FrontOpen` and `HouseWalk_FrontClosed`. Verify the source hash and centimetre scale in both reports. The importer refuses an existing destination map; use a new revision/map for new imports. Do not run the historical `finish_scene.py` geometry patch. Unreal editing scenes are not a separately validated shipping gameplay application.
4. Run `pipeline/run-yard-variants.sh` on the Pod. It calls `blender/run-bake.sh` for both bases, six CPU threads each. Require successful process exits, completion markers, source hashes, all expected atlases and denoising. Adapt parallelism to hardware; do not assume every GPU fits both jobs. `wait-for-bake.py` can verify expected output but its 14-atlas assertion is property-specific.
5. Retrieve outputs using the adapted `scripts/collect-yard-bake.sh open` and `closed`. Its checked-in SSH endpoint is historical and must be replaced with live connection details. Prefer `rsync -rz` on the shared volume to avoid unsupported ownership changes. The collector verifies source hash and denoising, then runs `pipeline/optimize.mjs` and `optimize-lightmaps.py`. Keep GLB, manifest, maps and metadata together: a bare GLB does not contain this custom lightmap integration.
6. With final assets stable, run `scripts/bake-reflections.mjs --baked --native` and again with `--closed`. Do not edit source/public assets during capture; Vite reloads can invalidate it. Capture reflections from the baked scene, not the procedural comparison.
7. Build with `npm run build` inside `app/`; preview on 4175. Run `scripts/validate-baked.mjs` for both poses, `check-door-toggle.mjs`, and `check-front-yard.mjs` with `TOUR_URL=http://localhost:4175/?view=street&doors=closed`. Visually review every room, relevant exterior sightline and street view against the source photos. Benchmark with `scripts/benchmark.mjs --baked` on native laptop graphics.
8. Run `scripts/package-baked.py`. Archive the Unreal project and both editable bake productions using `pipeline/package-yard-production.sh`, retrieve them, and verify `archive-sha256.txt`. Generate the delivery report with `scripts/report-front-delivery.py` after adapting its evidence paths. Keep screenshots, validation, benchmark, source hashes and uncertainty notes beside the delivery.
9. When files are safely retained and no GPU work remains, stop the authorized Pod and read back its status. Record the last confirmed state. Retained storage is separate from compute. Static hosting does not require restarting a Pod.

## 6. Acceptance checklist

- [ ] Main plan selected; evidence and uncertainty recorded; independent dimension anchors checked.
- [ ] Every window and door has evidence; hinge/swing directions checked from a stated viewpoint.
- [ ] Fixed items, furniture orientation and exterior building contacts match the source evidence.
- [ ] Geometry, navigation and both door poses agree; room spawns are safe; closed doors block passage.
- [ ] Source SHA matches bake manifest, Unreal import report and browser runtime for each pose.
- [ ] Lightmaps denoised; UVs/vertex colours preserved; neutral materials and shadow strength reviewed.
- [ ] All room probes present; active-pose loading and door-toggle camera behaviour checked.
- [ ] Keyboard, photo/inventory UI, mobile layout and indoor walking pass without browser errors.
- [ ] Exterior views frame correctly; dimensions are labelled as estimates where appropriate.
- [ ] Built site works with external requests blocked; representative integrated-GPU performance recorded.
- [ ] Static archive, editable archives, notices, checksums and accuracy notes retained; Pod status recorded.

## 7. Preserve and reproduce this reference

The [baseline manifest](baseline.json) records final settings, versions and artifact identities. `source-snapshot.tar.gz` preserves this property's app source, pipeline, scripts, reference notes and dependency manifests, excluding private input originals, public asset bulk and dependencies. `source-sha256.json` lists its file hashes. The existing website and three production archives retain the larger finished artifacts. Verify these records before making a new reference release; keep this release immutable and create a new dated/versioned reference for future improvements.

For an unchanged presentation, serve the retained built website. Rebuilding from source requires the retained public assets, dependency lockfiles and production artifacts. Rebaking with the same settings is reproducible as a workflow and quality target, but driver/platform differences can affect pixels or archive bytes. Changes to walls, openings, furnishings, lights or door poses invalidate affected baked lighting and probes. UI-only changes ordinarily need only a build and focused checks.

The reusable skills are evidence review, plan calibration, architectural modelling, furniture/material authoring, GPU bake operation, web optimization, visual QA and static delivery. New-house interpretation remains required; automation already handles export, baking, conversion and many checks once a correct scene exists.
