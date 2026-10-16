# Danish Villa — winter HVAC temperature mapping

This project runs a three-dimensional buoyant airflow and heat-transfer simulation in OpenFOAM 13 and presents **air temperature only**. Open the locally served [interactive map](http://localhost:4185), or use the PNG and PDF files in `results/`. This is an assumed winter scenario, not a calibrated prediction of the actual house or a measured temperature survey.

## Geometry and evidence

`geometry.json` is exported from the existing house project's `app/src/property.js`, including its final dimension corrections and locally calibrated openings from `app/src/calibration.json`. The retained main floor plan is IMG_9962; the alternative plan is excluded. Source input photos and the existing walkthrough remain unchanged. The existing model describes one main bedroom and one office/bedroom, plus living room, kitchen/dining, bryggers, entrance, main bathroom and guest WC.

The CFD domain preserves the L-shaped footprint, stepped hall/WC partition, room connections, exterior glazing positions and interior door opening widths. It uses thin internal partition baffles, open doorways to 2.10 m and an equivalent flat 2.50 m ceiling. This simplifies the photo-estimated vaulted ceilings. Furniture, cabinetry and door leaves are omitted. The CFD floor footprint is about 120.93 m² and volume about 302.33 m³; these are simulation-domain dimensions, not a reconciliation of the listing's 140 m². Garage and other outbuildings are excluded. Original dimensions remain estimates rather than a survey.

## Winter scenario

| Input | Assumption |
|---|---|
| Outside air | −5°C, steady winter night, no solar gains |
| Ventilation | 150 m³/h nominal balanced flow, about 0.50 air changes/hour |
| Supply distribution | Living 70 (two terminals × 35), bedroom 40, office 40 m³/h |
| Extract distribution | Kitchen approximately 50, bryggers 35, bathroom 45, WC 20 m³/h |
| HRV supply | 17.4°C at the ceiling terminals |
| Heat recovery | Assumed effective 90%, bypass off, no explicit defrost cycle |
| Duct cooling | Assumed 1 K |
| Reference extract air for HRV calculation | 21°C, prescribed rather than dynamically coupled |
| Heating | Assumed floor heating; 23.5°C surface, 25°C in bathroom/WC |
| External wall inside surface | 19.86°C |
| Ceiling inside surface | 20.35°C |
| Glazing inside surface | 15.8°C |
| External door inside surface | 17.1°C |
| Internal partitions | Adiabatic, no slip |
| Doors/windows | Internal doorways open; external doors/windows closed |
| Internal gains, leakage, radiation | Omitted |

The terminal coordinates and effective diffuser footprints are assumptions, recorded in each case's `scenario.json`. The footprints are held identical on both meshes; they represent diffused ceiling supply rather than resolved valve vanes or circular neck jets. The kitchen outlet is a pressure outlet and accommodates the small density-related balancing adjustment; its exact solved flow is recorded in `results/verification.json`. The other extraction terminals have prescribed velocities.

Supply calculation: `−5 + 0.90 × (21 − (−5)) − 1 = 17.4°C`. This assumes a specific operating point and duct loss. It does not derive air delivery from the unit's maximum capacity or use the advertised peak recovery as an in-service guarantee. The supplied [retailer link](https://billigventilation.dk/vare/genvex-eco-400/) now describes ECO 400 XL. [Genvex's ECO 400 description](https://www.genvex.com/en/news/eco-400-new-efficient-ventilation-system---perfect-for-bigger-houses) describes counterflow recovery up to 96%; the simulation assumes 90% and does not require the XL maximum flow rating. Model variant and installed settings have not been confirmed.

The assumed cold surface temperatures use `T_si = 21 − U × (21 − (−5)) / 8`, with illustrative U-values of 0.35 W/m²K for walls, 0.20 for ceiling, 1.60 for glazing and 1.20 for opaque doors. Both the U-values and 8 W/m²K inside-film coefficient are unmeasured assumptions. These prescribed surfaces represent a heated winter state; this is not conjugate wall conduction, a thermostat simulation, or a heat-load/heater-sizing calculation. Radiation is excluded from the air-energy calculation, so air temperature cannot be used as operative comfort temperature.

## Solver, verification and confidence

The case uses OpenFOAM 13's `foamRun` / `fluid` module with the Boussinesq equation of state, steady RANS k–epsilon turbulence, gravity and sensible enthalpy transport. Air inputs are ρ₀ = 1.2 kg/m³, T₀ = 294.15 K, β = 0.0034 K⁻¹, Cp = 1005 J/kgK, μ = 1.81×10⁻⁵ Pa·s and Pr = 0.7. Orthogonal finite-volume cells conform to partition planes; wall functions supply the turbulence and thermal wall treatment. Convective terms use bounded first-order upwind: numerical diffusion can soften local gradients. The reduced relaxation used in the refined run is retained in that case.

The two meshes have 26,994 and 203,896 cells. Both pass `checkMesh`. The finer mesh halves most cell dimensions while keeping the same terminal patches and door/wall locations. `results/verification.json` records final initial residuals, continuity errors, temperature bounds, changes between the last written fields and differences between mesh room means. A small room-mean difference does not establish grid-independent terminal jets or local extremes. The final 1.10 m room means differ by at most 0.189°C between meshes and 0.012°C over the last 100 fine iterations. Boundary mass imbalance is 0.0061%. The strict 10⁻⁵ initial-residual target was not reached; final pressure residual is about 1.38×10⁻³ and enthalpy residual about 2.06×10⁻⁴. The result is therefore a numerical screening map, not a fully converged or grid-independent design calculation. The retained wall-convection versus Cp-based advective heat diagnostic differs by about 13.3 W (about 7%); no heat-load accuracy is claimed. Strict convergence is reported honestly; no field measurements were available to validate the house model. Do not interpret narrow numerical temperature differences as a measured accuracy claim.

The map samples solved temperatures at 0.15, 0.60, 1.10, 1.70 and 2.30 m by linear interpolation between vertical cell centres. It plots the horizontal cell rectangles without adding artificial heat patterns. Room labels are area-weighted slice averages. The common 18–22°C colour scale is retained across heights. CSV and NPZ files preserve the underlying full three-dimensional cell field.

The temperature presentation is inspired by [Aerotak's temperature-mapping case](https://aerotak.com/cases/temperature-mapping), which explicitly describes validation against physical measurements. That level of validation has not been performed here.

## Reproduce and inspect

Python dependencies are listed in `requirements.txt`. The OpenFOAM cases and final fields can be opened in ParaView using `house.foam`. The browser presentation uses locally vendored Three.js and requires no cloud compute or external CDN.

```bash
source /opt/openfoam13/etc/bashrc
python scripts/build_case.py .24 case-new
checkMesh -case case-new
foamRun -case case-new
python scripts/postprocess.py case-new
python -m http.server 4185 --directory results
```

For the delivered fine-case audit, run `python scripts/verify.py` after both cases finish. It compares retained coarse and fine results. `build_case.py` creates fresh cases; the delivered cases also retain restart settings and reduced fine-mesh relaxation. For a restart, use `startFrom latestTime` and increase `endTime`; steady iteration labels are iteration indices, not simulated seconds of winter weather.

`results/index.html` is the standalone presentation, `temperature-1.10m.png` and `winter-temperature-map.pdf` are the default professional figures, `temperature-cells.csv` and `solved-field.npz` contain the numerical field, and `verification.json` contains the numerical audit. The source inputs and browser walkthrough are not modified.
