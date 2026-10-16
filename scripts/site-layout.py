"""Register public roof/parcel outlines to the existing, plan-scaled interior."""
import json,math
from pathlib import Path
b=Path('properties/danish-villa');geo=json.loads((b/'reference/site/map.geojson').read_text())
sx=111320*math.cos(math.radians(55.7));sy=111132
# Site reference corners are relative offsets; the real coordinates are withheld.
ne=[0.0,0.0];nw=[-0.000204,-0.000011];e=[(ne[0]-nw[0])*sx,(ne[1]-nw[1])*sy];length=math.hypot(*e);e=[v/length for v in e];south=[e[1],-e[0]]
def project(v):
 d=[(v[0]-ne[0])*sx,(v[1]-ne[1])*sy]
 return [round(11.56+sum(a*b for a,b in zip(d,e)),3),round(-.45+sum(a*b for a,b in zip(d,south)),3)]
parcel=[project(v) for v in geo['features'][0]['geometry']['coordinates'][0][0]]
roofs=[[project(v) for v in p[0]] for p in geo['features'][1]['geometry']['coordinates']]
area=abs(sum(a[0]*c[1]-c[0]*a[1] for a,c in zip(parcel,parcel[1:])))/2
site={'parcel':parcel,'roofOutlines':roofs,'mappedArea':area,'brochureArea':780,'edgeLengths':[round(math.dist(a,c),2) for a,c in zip(parcel,parcel[1:])],'source':'public cadastre map (address withheld)','dataSource':'Matriklen and GeoDanmark outlines served by Grundviden public map','registration':'Roof northeast corner mapped to scene [11.56,-0.45]; roof orientation defines plan axes. Roof overhangs differ from walls; local alignment is approximate.','uncertainty':'Ground footprint follows mapped outlines (~20.6 m × 38 m), not a boundary survey. Garden surface edges and heights are photo estimates.','garage':{'bounds':[-3.57,4.42,-.24,11.63],'height':2.35,'area':24.0},'depot':{'bounds':[6.99,26.57,10.94,31.63],'height':2.22,'area':20.0},'coveredTerrace':{'bounds':[6.90,23.22,11.0,26.57],'height':2.38},'rearStore':{'bounds':[-4.62,28.45,-.42,31.15],'height':2.1,'note':'Additional rear roof outline; wall colour/height not visible in supplied photographs, neutral grey approximation.'}}
site['garage']['note']='Owner confirms garage touches house. Translate mapped estimate east 0.65 m, keeping its 3.33 × 7.21 m footprint; its east wall meets the house exterior at X=-0.24 m.'
site['front']={'gate':[11.32,13.58],'pavingModule':[.21,.14],'streetWidth':5.5,'sidewalkWidth':1.26,'treeHeights':[2.05,1.95,.64],'refs':['IMG_9937.JPG','IMG_9961.JPG'],'uncertainty':'Photo-estimated paving modules, landscaping, gate and street width; aligned to the plan-scaled facade and parcel frontage. Road is simplified immediate context, not a surveyed street model.'}
(b/'app/src/site.json').write_text(json.dumps(site,indent=2)+'\n');(b/'reference/site/layout.json').write_text(json.dumps(site,indent=2)+'\n')
print('Mapped plot',round(area,1),'m², edges',site['edgeLengths'])
