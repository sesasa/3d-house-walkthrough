# Yard, kitchen and door variants — 24 September 2026

The owner authorized estimating outdoor dimensions and confirmed the tall white
unit beside the stacked ovens is the kitchen fridge. No survey dimensions were supplied.

## Outdoor evidence and estimates

The brochure records 780 m² land, 24 m² garage and 20 m² outbuilding. Public
Matriklen/GeoDanmark geometry displayed by
public cadastre map (address withheld) provides a parcel polygon
and roof footprints. Its downloaded GeoJSON is preserved in `site/map.geojson`;
`scripts/site-layout.py` reproduces the local-coordinate layout in
`site/layout.json` and `app/src/site.json`.

The projected parcel is about 20.6 m wide and 38 m deep, with a calculated area
of 781.2 m² from rounded coordinates, consistent with the brochure's 780 m².
This is a mapped estimate, not a boundary survey. Roof coordinates are aligned
approximately to the existing house model; eaves differ from interior walls.
The approved interior plan has not been stretched to fit roof outlines.

| Element | Model dimensions | Basis |
|---|---|---|
| Garage | 3.33 × 7.21 m; 2.35 m high | Mapped roof, brochure 24 m²; height estimated |
| Yellow rear depot | 3.95 × 5.06 m; 2.22 m high | Rear part of mapped roof; brochure 20 m²; division/height estimated |
| Covered seating | 4.10 × 3.35 m; 2.38 m high | Remaining front part of same roof; aerial/interior photos |
| Small rear store | 4.20 × 2.70 m; 2.10 m high | Separate mapped roof; wall inset and height estimated |

Photos IMG_9936/9937/9938/9960/9961 guide the lawn, grey paved terraces and drive,
white garage, dark garage entrance, ochre timber depot and white canopy.
Paving edges, hedge thickness/heights, planting border and canopy details are
photo estimates, not measured dimensions. The small rear store's neutral grey
colour is provisional because it is not clearly visible in the supplied photos.
Outbuildings are deliberately simple closed masses. They provide outdoor views
and lighting occlusion; the navigation area remains the house interior.

## Kitchen

The confirmed fridge uses an estimated 60 cm module immediately south of the
oven stack; the adjacent base/upper runs are shortened to avoid overlap. The
sink and countertop cutout move together toward the west end of the window
counter (model X=1.40 m, Z=7.68 m), following IMG_9942. The counter plant and
kettle are moved clear of the sink and fridge. All six dining chairs face inward
at the table. Cabinet sizes and sink placement remain photo/plan estimates.

## Door option

Open is the default and retains the approved hinge/swing schedule in
`neutral-door-refinement.md`. The toolbar's Doors button switches to a separate
closed scene, including the shower screen, with its own precomputed lightmaps
and reflection probes. Closed leaves block walking through their openings.
Use the room list or reopen doors to move between rooms. Switching preserves
room and view where the camera position is safe; otherwise it uses a safe room
entry. No server GPU is required for viewing either variant.
