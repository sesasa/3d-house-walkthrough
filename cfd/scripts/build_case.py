"""Generate an orthogonal, partition-conforming OpenFOAM HVAC case.

Geometry is exported from the existing calibrated property.js. Internal walls
are zero-thickness baffles with open doorways, not a painted room mask.
"""
import json, math, shutil, sys
from pathlib import Path
import numpy as np

ROOT=Path(__file__).resolve().parents[1]
G=json.loads((ROOT/'geometry.json').read_text())
spacing=float(sys.argv[1]) if len(sys.argv)>1 else .24
case=ROOT/('case' if len(sys.argv)<3 else sys.argv[2])
for d in ['0','constant/polyMesh','system']: (case/d).mkdir(parents=True,exist_ok=True)
def header(obj,cls='dictionary'):
    return f'FoamFile {{ version 2.0; format ascii; class {cls}; object {obj}; }}\n'
def write(path,text,cls='dictionary'):
    (case/path).write_text(header(Path(path).name,cls)+text)
def grid(keys):
    keys=sorted(set(round(v,5) for v in keys)); out=[keys[0]]
    for a,b in zip(keys,keys[1:]):
        out.extend(np.linspace(a,b,math.ceil((b-a)/spacing)+1)[1:])
    return np.array(out)
# CFD axes x=east, y=plan-south, z=height; flat equivalent ceiling.
requested_spacing=spacing
spacing=.24
X=grid([0,2.46,3.62,4.65,4.86,5.12,6.64,7.63,11.16])
Y=grid([0,2.56,3.63,4.14,8.07,8.13,13.13]); Z=grid([0,2.1,2.5])
baseX,baseY=X.copy(),Y.copy()
spacing=requested_spacing
X=grid(X);Y=grid(Y);Z=grid(Z)
centres={}; cells={}; roomids=[]
def room_at(x,y):
    for r in G['rooms']:
        for a,b,c,d in [r['bounds']]+r.get('extra',[]):
            if a<=x<=c and b<=y<=d:return r['id']
    return min(G['rooms'],key=lambda r:((r['bounds'][0]+r['bounds'][2])/2-x)**2+((r['bounds'][1]+r['bounds'][3])/2-y)**2)['id']
for k in range(len(Z)-1):
 for j in range(len(Y)-1):
  for i in range(len(X)-1):
   x,y,z=(X[i]+X[i+1])/2,(Y[j]+Y[j+1])/2,(Z[k]+Z[k+1])/2
   if y>8.13 and x<5.12:continue
   cells[i,j,k]=len(cells); centres[i,j,k]=(x,y,z);roomids.append(room_at(x,y))
vents={'supply_living_a':(7.,10.,35),'supply_living_b':(9.6,11.8,35),
       'supply_primary':(9.,2.1,40),'supply_office':(9.1,6.1,40),
       'extract_kitchen':(2.,6.2,50),'extract_utility':(1.2,2.5,35),
       'extract_bathroom':(3.6,1.2,45),'extract_wc':(4.15,3.25,20)}
# Each terminal uses a resolved ceiling face; velocity adjusted to its exact area.
ventcells={}; vent_rectangles={}
for name,(x,y,q) in vents.items():
    i=np.argmin(abs((baseX[:-1]+baseX[1:])/2-x));j=np.argmin(abs((baseY[:-1]+baseY[1:])/2-y))
    rect=[float(baseX[i]),float(baseY[j]),float(baseX[i+1]),float(baseY[j+1])]
    vent_rectangles[name]=rect
    for c in cells:
        if c[2]==len(Z)-2 and rect[0]<centres[c][0]<rect[2] and rect[1]<centres[c][1]<rect[3]:ventcells[c]=name
points=[]; pids={}
def pid(v):
    if v not in pids:pids[v]=len(points);points.append((X[v[0]],Y[v[1]],Z[v[2]]))
    return pids[v]
directions=[((-1,0,0),[(0,0,0),(0,0,1),(0,1,1),(0,1,0)]),
 ((1,0,0),[(1,0,0),(1,1,0),(1,1,1),(1,0,1)]),
 ((0,-1,0),[(0,0,0),(1,0,0),(1,0,1),(0,0,1)]),
 ((0,1,0),[(0,1,0),(0,1,1),(1,1,1),(1,1,0)]),
 ((0,0,-1),[(0,0,0),(0,1,0),(1,1,0),(1,0,0)]),
 ((0,0,1),[(0,0,1),(1,0,1),(1,1,1),(0,1,1)])]
internal=[]; patches={}; areas={}
def wall_on_face(x,y,z,axis):
    for w in G['walls']:
        if w.get('outer'):continue
        if (axis==0 and w['axis']!='z') or (axis==1 and w['axis']!='x'):continue
        at=x if axis==0 else y; along=y if axis==0 else x
        if abs(at-w['at'])<1e-5 and w['start']<=along<=w['end']:
            if any(o['kind']=='door' and o['a']<=along<=o['b'] and z<o['head'] for o in w['openings']):return False
            return True
    return False
for c,owner in cells.items():
 for dr,offsets in directions:
    nb=tuple(c[t]+dr[t] for t in range(3)); axis=next(t for t in range(3) if dr[t])
    xyz=list(centres[c]); edges=[X,Y,Z];xyz[axis]=edges[axis][c[axis]+(dr[axis]>0)]
    blocked=axis<2 and wall_on_face(*xyz,axis)
    if nb in cells and not blocked:
        if cells[nb]<owner:continue
        internal.append(([pid(tuple(c[t]+v[t] for t in range(3))) for v in offsets],owner,cells[nb]));continue
    name='partitions'
    if not blocked:
        if axis==2 and dr[2]<0:name='floor_wet' if roomids[owner] in ['bathroom','wc'] else 'floor'
        elif axis==2:name=ventcells.get(c,'ceiling')
        else:
            name='opaque'
            # Match exterior glazing against source wall position and opening height.
            for w in G['walls']:
                if not w.get('outer'):continue
                if (axis==0 and w['axis']!='z') or (axis==1 and w['axis']!='x'):continue
                at=xyz[axis]; along=xyz[1-axis]
                if abs(at-w['at'])<.16 and w['start']<=along<=w['end']:
                    for o in w['openings']:
                        if o['a']<=along<=o['b'] and o['sill']<=xyz[2]<=o['head']:
                            if o['kind']=='window' or o.get('glazed'):name='glazing'
                            else:name='externalDoors'
    face=[pid(tuple(c[t]+v[t] for t in range(3))) for v in offsets]
    patches.setdefault(name,[]).append((face,owner))
    a=(edges[(axis+1)%3][c[(axis+1)%3]+1]-edges[(axis+1)%3][c[(axis+1)%3]])*(edges[(axis+2)%3][c[(axis+2)%3]+1]-edges[(axis+2)%3][c[(axis+2)%3]])
    areas[name]=areas.get(name,0)+a
faces=[f for f,o,n in internal]; owners=[o for f,o,n in internal]; neighbours=[n for f,o,n in internal]
boundary=[]
for name,items in patches.items():
    typ='patch' if name in vents else 'wall'
    boundary.append(f'{name} {{ type {typ}; nFaces {len(items)}; startFace {len(faces)}; }}')
    faces.extend(f for f,o in items);owners.extend(o for f,o in items)
write('constant/polyMesh/points',f'{len(points)}\n(\n'+'\n'.join('('+ ' '.join(f'{a:.8g}' for a in p)+')' for p in points)+'\n)\n','vectorField')
write('constant/polyMesh/faces',f'{len(faces)}\n(\n'+'\n'.join('4('+' '.join(map(str,f))+')' for f in faces)+'\n)\n','faceList')
for name,vals in [('owner',owners),('neighbour',neighbours)]:write('constant/polyMesh/'+name,f'{len(vals)}\n(\n'+'\n'.join(map(str,vals))+'\n)\n','labelList')
write('constant/polyMesh/boundary',f'{len(boundary)}\n(\n'+'\n'.join(boundary)+'\n)\n','polyBoundaryMesh')
template=Path('/opt/openfoam13/tutorials/fluid/hotRoomBoussinesqSteady')
for name in ['fvSchemes','fvSolution','controlDict']:shutil.copy(template/'system'/name,case/'system'/name)
ctrl=(case/'system/controlDict').read_text().replace('endTime         2000','endTime         6000').replace('writeInterval   100','writeInterval   500')
(case/'system/controlDict').write_text(ctrl)
sol=(case/'system/fvSolution').read_text().replace('p_rgh           1e-2','p_rgh           1e-5').replace('U               1e-3','U               1e-5').replace('h               1e-3','h               1e-5').replace('1e-3;','1e-5;')
(case/'system/fvSolution').write_text(sol)
for name in ['physicalProperties','momentumTransport']:shutil.copy(template/'constant'/name,case/'constant'/name)
p=(case/'constant/physicalProperties').read_text().replace('rho0            1;','rho0            1.2;').replace('T0              300;','T0              294.15;').replace('beta            3e-03;','beta            0.0034;').replace('Cp              1000;','Cp              1005;').replace('mu              1e-05;','mu              1.81e-05;')
(case/'constant/physicalProperties').write_text(p)
write('constant/g','dimensions [0 1 -2 0 0 0 0]; value (0 0 -9.81);','uniformDimensionedVectorField')
write('constant/pRef','dimensions [1 -1 -2 0 0 0 0]; value 0;','uniformDimensionedScalarField')
# Fixed surface temperatures are an explicitly assumed heated winter state.
temps={'floor':23.5,'floor_wet':25.,'ceiling':20.35,'opaque':19.86,'glazing':15.8,'externalDoors':17.1}
fields={'U':('[0 1 -1 0 0 0 0]','(0 0 0)','volVectorField'), 'T':('[0 0 0 1 0 0 0]','294.15','volScalarField'),
 'p_rgh':('[1 -1 -2 0 0 0 0]','0','volScalarField'),'p':('[1 -1 -2 0 0 0 0]','0','volScalarField'),
 'k':('[0 2 -2 0 0 0 0]','0.001','volScalarField'),'epsilon':('[0 2 -3 0 0 0 0]','0.0001','volScalarField'),
 'nut':('[0 2 -1 0 0 0 0]','0','volScalarField'),'alphat':('[1 -1 -1 0 0 0 0]','0','volScalarField')}
for field,(dim,initial,cls) in fields.items():
    bf=[]
    for name in patches:
        supply=name.startswith('supply'); extract=name.startswith('extract'); vent=supply or extract
        if field=='U':
            if name=='extract_kitchen':
                bc='type pressureInletOutletVelocity; value uniform (0 0 0);'
            elif vent:
                speed=vents[name][2]/3600/areas[name]*(1 if extract else -1)
                bc=f'type fixedValue; value uniform (0 0 {speed});'
            else:bc='type noSlip;'
        elif field=='T':
            if supply:bc='type fixedValue; value uniform 290.55;'
            elif extract or name=='partitions':bc='type zeroGradient;'
            else:bc=f'type fixedValue; value uniform {temps[name]+273.15};'
        elif field=='p_rgh':
            bc='type prghPressure; p uniform 0; value uniform 0;' if name=='extract_kitchen' else 'type fixedFluxPressure; value uniform 0;'
        elif field=='p':bc='type calculated; value uniform 0;'
        elif field=='k':bc=f'type {"fixedValue" if supply else "zeroGradient" if extract else "kqRWallFunction"}; value uniform 0.001;'
        elif field=='epsilon':bc=f'type {"fixedValue" if supply else "zeroGradient" if extract else "epsilonWallFunction"}; value uniform 0.0001;'
        elif field=='nut':bc=f'type {"calculated" if vent else "nutkWallFunction"}; value uniform 0;'
        else:bc='type calculated; value uniform 0;' if vent else 'type compressible::alphatJayatillekeWallFunction; Prt 0.85; value uniform 0;'
        bf.append(name+' { '+bc+' }')
    write('0/'+field,f'dimensions {dim};\ninternalField uniform {initial};\nboundaryField {{\n'+'\n'.join(bf)+'\n}\n',cls)
np.savez(case/'mesh_index.npz',centres=np.array(list(centres.values())),ijk=np.array(list(cells)),X=X,Y=Y,Z=Z,rooms=np.array(roomids))
(case/'scenario.json').write_text(json.dumps({'cell_count':len(cells),'spacing_max_m':spacing,'ceiling_m':2.5,'outdoor_C':-5,'supply_C':17.4,'reference_extract_C':21,'effective_recovery':.90,'duct_loss_K':1,'flow_m3_h':150,'vents':vents,'vent_rectangles':vent_rectangles,'patch_areas_m2':areas,'surface_C':temps,'door_state':'internal open, external closed'},indent=2))
(case/'house.foam').touch()
print(case, len(cells),'cells',len(points),'points', 'patches:', {n:len(v) for n,v in patches.items()})
