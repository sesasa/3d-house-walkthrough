---
name: baked-property-tour
description: Build or refine a photo-and-floor-plan-informed property walkthrough using the retained Danish Villa reference, with accurate fixed geometry, Unreal editing scenes, offline GPU lightmaps and a static Three.js browser delivery. Use for another house following this proven pipeline or rebuilding its baked tour.
---

# Baked property tour

The reference workspace is this repository's root. Locate it there first; if moved, find its `docs/house-tour-reference/baseline.json` before modifying a property.

Read `docs/house-tour-reference/TECHNICAL-REPORT.md` for the delivered architecture and `PRODUCTION-PLAYBOOK.md` in the same directory for requirements, adaptation points, stage order and acceptance checks. Use the adjacent input templates. Verify the baseline manifest and source snapshot when restoring the reference. If the workspace is unavailable, identify the missing baseline instead of claiming this exact pipeline is present.

Create each new property under its own `properties/<slug>/`. Keep source inputs immutable and separate from public assets. Reuse renderer/tooling but replace property-specific coordinates, evidence, metadata, filenames, ports and script assertions. Never overwrite another property to make a new tour.

Prioritize floor-plan calibration and the fixed-item schedule: walls, window existence, doors with explicitly verified hinge/swing direction, cabinets, appliances and fixtures. Preserve evidence and uncertainty. Review these before GPU baking. Keep materials neutral, wet rooms restrained and exterior masses scaled. Avoid invented sockets and speculative openings. Furniture proportions and orientation matter more than decorative density.

Export a common source GLB plus metadata to Unreal and Blender. Describe the actual implementation accurately: Unreal provides editable scenes; Blender/Cycles CUDA produces the browser lightmaps. It is not automatic image reconstruction or exported Lumen. Use the effective presentation.json grade, preserve UVs/vertex colours, decode RGBM before filtering, capture probes from the final baked scene, and validate both door poses.

Follow current authorization for GPU provisioning/spending. Inspect live SSH connection details rather than using the old endpoint. Preserve production archives and verify hashes before stopping unneeded authorized compute; record confirmed status. The customer website runs on its own device GPU and requires no RunPod runtime.

Complete the playbook acceptance checklist, retain visual evidence and measured device performance, and deliver static website files plus editable archives. Do not promise survey accuracy, identical fresh-bake pixels, or that a new house needs no interpretation. Use a new reference version for improvements rather than replacing the retained baseline.
