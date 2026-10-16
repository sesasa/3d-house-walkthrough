"""Numerical audit: temperature stability, mesh sensitivity and field bounds."""
import json,re
from pathlib import Path
import numpy as np
from postprocess import ROOT,load,field

def volumes(m):
    I=m['ijk'];return np.prod([m[c][I[:,i]+1]-m[c][I[:,i]] for i,c in enumerate('XYZ')],axis=0)
def room_means(m,T):
    v=volumes(m);return {r:float(np.average(T[m['rooms']==r],weights=v[m['rooms']==r])) for r in np.unique(m['rooms'])}
def section_means(m,T,h=1.1):
    zc=(m['Z'][:-1]+m['Z'][1:])/2;hi=np.clip(np.searchsorted(zc,h),1,len(zc)-1);lo=hi-1;f=(h-zc[lo])/(zc[hi]-zc[lo]);Tc=T.reshape(len(zc),-1)[lo]*(1-f)+T.reshape(len(zc),-1)[hi]*f
    mask=m['ijk'][:,2]==0;I=m['ijk'][mask];area=(m['X'][I[:,0]+1]-m['X'][I[:,0]])*(m['Y'][I[:,1]+1]-m['Y'][I[:,1]])
    return {r:float(np.average(Tc[m['rooms'][mask]==r],weights=area[m['rooms'][mask]==r])) for r in np.unique(m['rooms'])}
if __name__=='__main__':
 coarse=ROOT/'case';fine=ROOT/'case-fine';mc,tc,Tc=load(coarse);mf,tf,Tf=load(fine)
 previous=max((p for p in fine.iterdir() if p.is_dir() and re.fullmatch(r'\d+',p.name) and float(p.name)<float(tf.name) and (p/'T').exists()),key=lambda p:float(p.name))
 Tp=field(previous/'T')-273.15;V=volumes(mf);D=Tf-Tp
 cm=section_means(mc,Tc);fm=section_means(mf,Tf);pm=section_means(mf,Tp)
 difference={r:fm[r]-cm[r] for r in cm};stability={r:fm[r]-pm[r] for r in fm}
 s=json.loads((fine/'scenario.json').read_text());q=s['vents'];sup=sum(v[2] for k,v in q.items() if k.startswith('supply'));ext=sum(v[2] for k,v in q.items() if k.startswith('extract'))
 log=(fine/'log.balanced').read_text();last=next(b for b in reversed(log.split('Time = ')) if 'Solving for k,' in b);residuals={k:float(v) for k,v in re.findall(r'Solving for (\w+), Initial residual = ([\d.eE+-]+)',last)}
 cont=re.findall(r'continuity errors : sum local = ([\d.eE+-]+), global = ([\d.eE+-]+)',log)
 room_change=max(abs(v) for v in stability.values());grid_difference=max(abs(v) for v in difference.values())
 note=f'Two orthogonal meshes passed checkMesh ({len(Tc):,} and {len(Tf):,} cells). At 1.10 m, the largest change in a room mean between meshes is {grid_difference:.3f}°C; the largest change over the final {float(tf.name)-float(previous.name):g} iterations is {room_change:.3f}°C. This is a screening result: strict residual convergence and grid independence are not established, and no measured temperatures were used for validation.'
 phi=(tf/'phi').read_text();rho=(tf/'rho').read_text();actual_flow={};mass_flow={};advected_heat_W={}
 def patch_scalar(text,name):
     block=re.search(r'\b'+name+r'\s*\{(.*?)\n\s*\}',text,re.S)[1]
     values=re.search(r'value\s+nonuniform List<scalar>\s+\d+\s*\((.*?)\)\s*;',block,re.S)
     if values:return np.fromstring(values[1],sep=' ')
     return np.array([float(re.search(r'value\s+uniform\s+([^;]+);',block)[1])])
 boundary=(fine/'constant/polyMesh/boundary').read_text()
 for name in q:
     count=int(re.search(r'\b'+name+r'\s*\{.*?nFaces\s+(\d+)',boundary,re.S)[1])
     flux=np.broadcast_to(patch_scalar(phi,name),(count,));density=np.broadcast_to(patch_scalar(rho,name),(count,))
     actual_flow[name]=float(np.sum(flux/density)*3600);mass_flow[name]=float(flux.sum())
     temp=21+(1-density/1.2)/.0034
     advected_heat_W[name]=float(np.sum(flux*temp)*1005)
 result={'coarse_cells':len(Tc),'fine_cells':len(Tf),'coarse_iteration':float(tc.name),'fine_iteration':float(tf.name),'previous_fine_iteration':float(previous.name),'volume_m3':float(V.sum()),'temperature_field_bounds_C':[float(Tf.min()),float(Tf.max())],'volume_weighted_change_K':float(np.average(abs(D),weights=V)),'max_cell_change_K':float(abs(D).max()),'room_section_change_K':stability,'room_section_mesh_difference_K':difference,'max_room_section_mesh_difference_K':grid_difference,'initial_residuals_final_iteration':residuals,'continuity_error_final':{'sum_local':float(cont[-1][0]),'global':float(cont[-1][1])},'solved_terminal_volume_flow_m3_h_positive_extract':actual_flow,'actual_extract_total_m3_h':sum(v for k,v in actual_flow.items() if k.startswith('extract')),'prescribed_supply_m3_h':sup,'prescribed_extract_m3_h':ext,'both_mesh_checks_pass':all('Mesh OK.' in (p/'log.checkMesh').read_text() for p in [coarse,fine]),'strict_residual_target':1e-5,'strict_convergence_met':bool(residuals and max(residuals.values())<1e-5),'measured_validation':False,'display_note':note}
 assert np.all(np.isfinite(Tf)) and Tf.min()>=min(s['surface_C'].values())-.1 and Tf.max()<=max(s['surface_C'].values())+.1
 assert sup==ext and result['both_mesh_checks_pass']
 net_mass=sum(mass_flow.values());total_in=-sum(v for v in mass_flow.values() if v<0)
 result.update({'mass_flow_kg_s':mass_flow,'net_boundary_mass_kg_s':net_mass,'relative_mass_imbalance':abs(net_mass)/total_in,'net_advective_heat_out_W':sum(advected_heat_W.values())})
 assert result['relative_mass_imbalance']<.01
 (ROOT/'results/verification.json').write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2))
