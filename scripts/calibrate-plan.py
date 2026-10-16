"""Reproducible local wall calibration from manually read IMG_9962 pixels.
Pixel endpoints refer to clear opening edges, not the outer frame. Uncertainty
is an explicit engineering estimate, not a statistical confidence interval.
"""
from pathlib import Path
import json,csv
r=Path(__file__).resolve().parents[1]
# id, clear wall endpoints in the image, labelled length, model origin,
# opening endpoints, conservative horizontal uncertainty (metres)
rows=[
 ('utility-entry',144,275,2.40,0,194,237,.08),
 ('utility-strip-window',116,330,4.07,0,164,244,.08),
 ('bath-high-window',283,406,2.28,2.52,338,364,.07),
 ('front-door',411,493,1.66,4.92,419,462,.10),
 ('bedroom-north-window',500,749,4.46,6.70,505,558,.05),
 ('bedroom-east-a',116,330,4.08,0,139,197,.07),
 ('bedroom-east-b',116,330,4.08,0,259,316,.07),
 ('living-east-high-a',558,833,5.00,8.13,624,680,.06),
 ('living-east-high-b',558,833,5.00,8.13,712,768,.06),
 ('living-south-a',420,749,5.92,5.24,424,553,.05),
 ('living-south-b',420,749,5.92,5.24,615,741,.05),
 ('living-garden-door',558,833,5.00,8.13,670,711,.07),
 ('living-west-window',558,833,5.00,8.13,722,786,.07),
 ('bedroom-door',116,330,4.08,0,229,271,.07),
 ('office-door',338,550,3.81,4.20,409,451,.06),
 ('utility-kitchen-door',144,275,2.40,0,194,237,.08),
]
records=[]
for id,p0,p1,length,origin,a,b,err in rows:
 scale=length/(p1-p0)
 records.append(dict(id=id,source='IMG_9962.JPG',method='Local clear-wall ratio × '+('inferred upper hall width' if id=='front-door' else 'labelled room length'),wall_pixels=[p0,p1],label_m=length,opening_pixels=[a,b],a=round(origin+(a-p0)*scale,2),b=round(origin+(b-p0)*scale,2),width_m=round((b-a)*scale,2),uncertainty_m=err))
(r/'app/src/calibration.json').write_text(json.dumps(records,indent=2)+'\n')
(r/'reference/plan-measurements.json').write_text(json.dumps(records,indent=2)+'\n')
with (r/'reference/plan-measurements.csv').open('w') as f:
 w=csv.writer(f);w.writerow(['opening','width_m','approx_uncertainty_m','world_start_m','world_end_m','wall_pixels','opening_pixels','label_m','source'])
 for d in records:w.writerow([d['id'],d['width_m'],d['uncertainty_m'],d['a'],d['b'],str(d['wall_pixels']),str(d['opening_pixels']),d['label_m'],d['source']])
print('Locally calibrated',len(records),'openings')
