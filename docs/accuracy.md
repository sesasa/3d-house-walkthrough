# Reconstruction accuracy — Danish Villa

The owner confirmed use of the supplied main plan and matching photographs, with no known changes. IMG_9962 is the main plan; IMG_9964 is an alternative arrangement and is not used. The brochure is dated September 2020. The result is a manually reconstructed, photo-informed model, not a surveyed digital twin or photogrammetric scan.

## Fixed geometry

Clear room dimensions follow the main plan where legible: primary bedroom 4.46 × 4.08 m, office 3.47 × 3.81 m, living room 5.92 × 5.00 m, utility width 2.40 m and bathroom main bay 2.28 × 2.50 m. Partitions remain estimated at 0.12 m and external walls at 0.24 m.

Revision 2 corrects the rectangular entrance assumption. The plan shows a stepped boundary beside the guest WC; the 1.87 m label is assigned to its wider end. Kitchen 7.57 + partition 0.12 + office 3.47 gives an overall clear span of 11.16 m. The northern utility/bathroom/bedroom labels then imply 1.66 m at the narrower upper hall and a 0.21 m step at its wider end. This is a plausible, constrained reconciliation of the former 21 cm mismatch, not proof of the exact step depth. The guest WC floor and walls now follow the return. Site measurements should verify the step and wall thicknesses.

Sixteen openings are locally calibrated from IMG_9962 pixel endpoints, using labelled clear room dimensions instead of one whole-image scale. The front door uses the inferred upper-hall width. The complete inputs and calculations are in `plan-measurements.json` and `plan-measurements.csv`; regenerate with `../scripts/calibrate-plan.py`. The living west window changes from 1.81 m to approximately 1.16 m; its horizontal division follows IMG_9939. The opening uncertainty estimates of ±5–10 cm are working estimates, not statistical intervals. Endpoint rounding can differ from the independently rounded width by 1 cm.

The living-room H:267 annotation is interpreted as the highest ceiling point (2.67 m); that interpretation needs confirmation. Other ceiling/eave heights and roof pitches are estimated from photographs. The exterior roof, terrace and planting provide context only.

Opening locations are reconciled against plan and interior/exterior photos. Opening widths, offsets, sill heights, door hinges/swings and cabinet module sizes are estimates. Doors are shown open for navigation. Electrical outlets and switches are omitted.

Kitchen: L-shaped west hob/south sink runs, glazed north display cupboards, west oven tower and south terrace door. Utility: west sink run and high strip window, opposing raised laundry units, refrigerator near kitchen. Bathroom: west double vanity, mirrored cabinet divisions, northeast WC, north towel radiator, southwest twin shower bay and south linen cupboard. Bedroom: east bed between two windows, separate north window and opposing wardrobes. Office: east window and desk. Living: garden glazing and high east clerestory windows.

See `../output/models/fixed-items.csv` or `.json` for individual source images and dimensions. Position and size arrays are world X/Y/Z in metres; X is plan-right, Y up, Z plan-down. Dimensions are bounding extents, not manufacturer specifications. In the browser, “Fixed items” highlights each group. Some secondary geometry (mirrors, taps, appliances) is included within a parent group rather than separately counted.

## Furnishings and rendering

Furniture forms, finishes and placement are approximations of the supplied photos. Upholstery and bedding are authored geometry; material maps are illustrative, not captured from the house. The new version reuses the previous tour’s CC0 scanned upholstery and PBR material maps, adds photo-backed furniture detail, and bakes eight room-specific reflection probes. Mirror reflections and soft lighting are browser rendering effects. The main bedroom now has rectangular stone tile rather than the incorrect timber floor. Loose furniture positions are estimated from the photographs. The GLB exports meshes and PBR materials; it does not embed browser controls, procedural light fills, postprocessing or live mirror effects. It requires lighting and collision setup in Unreal.

## Review

Automated checks cover all eight room spawn positions, connected paths through the furnished floor plan, keyboard turning and walking, fixed-item inspection, reference-photo controls, mobile width, and GLB reload. Visual screenshots are in `../work/review/`. These checks establish application behavior, not surveyed dimensional accuracy.
