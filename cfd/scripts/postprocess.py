"""Plot only solved OpenFOAM cell temperatures; no synthetic temperature field."""
import json,re,sys
from pathlib import Path
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.collections import LineCollection
from matplotlib.colors import Normalize

ROOT=Path(__file__).resolve().parents[1]
def latest(case):return max((p for p in case.iterdir() if p.is_dir() and re.fullmatch(r'\d+(\.\d+)?',p.name)),key=lambda p:float(p.name))
def field(path,n=None):
    s=path.read_text();m=re.search(r'internalField\s+nonuniform\s+List<\w+>\s+(\d+)\s*\((.*?)\)\s*;',s,re.S)
    if m:return np.fromstring(m[2].replace('(','').replace(')',''),sep=' ').reshape(int(m[1]),-1).squeeze()
    m=re.search(r'internalField\s+uniform\s+([^;]+);',s);v=np.fromstring(m[1].replace('(','').replace(')',''),sep=' ')
    return np.full(n,v[0]) if len(v)==1 else np.tile(v,(n,1))
def load(case):
    mesh=np.load(case/'mesh_index.npz');t=latest(case);T=field(t/'T',len(mesh['centres']))-273.15
    return mesh,t,T
if __name__=='__main__':
 case=ROOT/(sys.argv[1] if len(sys.argv)>1 else 'case-fine')
 out=ROOT/'results';out.mkdir(exist_ok=True)
 mesh,time,T=load(case);C=mesh['centres'];I=mesh['ijk'];X,Y,Z=[mesh[k] for k in ['X','Y','Z']]
 G=json.loads((ROOT/'geometry.json').read_text());S=json.loads((case/'scenario.json').read_text())
 norm=Normalize(18,22);cmap=matplotlib.colormaps['turbo']
 plt.rcParams.update({'font.family':'DejaVu Sans','font.size':10,'text.color':'#243240','axes.labelcolor':'#243240'})
 heights=[.15,.60,1.10,1.70,2.30];slices=[]
 labels={'hall':'ENTRANCE','kitchen':'KITCHEN / DINING','living':'LIVING ROOM','primary':'BEDROOM','office':'OFFICE','bathroom':'BATHROOM','wc':'WC','utility':'BRYGGERS'}
 # Draw actual CFD partition planes, leaving solved open doorways clear.
 segments=[]
 for w in G['walls']:
    axis=w['axis'];at=w['at'];start=w['start'];end=w['end']
    if w.get('outer'):continue
    doors=sorted((o['a'],o['b']) for o in w['openings'] if o['kind']=='door')
    cursor=start
    for a,b in doors+[(end,end)]:
        a=min(a,end)
        if a>cursor:segments.append([(cursor,at),(a,at)] if axis=='x' else [(at,cursor),(at,a)])
        cursor=max(cursor,b)
 outline=[(0,0),(11.16,0),(11.16,13.13),(5.12,13.13),(5.12,8.13),(0,8.13),(0,0)]
 report={'solver':'OpenFOAM 13 / fluid / Boussinesq / k-epsilon steady RANS','case':case.name,'iteration':float(time.name),'cells':len(T),'global_temperature_C':{'min':float(T.min()),'max':float(T.max())},'slices':[]}
 def room_position(r):
    a,b,c,d=r['bounds'];return ((a+c)/2,(b+d)/2)
 for h in heights:
    k=int(np.argmin(abs((Z[:-1]+Z[1:])/2-h)));mask=I[:,2]==k
    zc=(Z[:-1]+Z[1:])/2; hi=int(np.clip(np.searchsorted(zc,h),1,len(zc)-1)); lo=hi-1
    fraction=float(np.clip((h-zc[lo])/(zc[hi]-zc[lo]),0,1))
    layers=T.reshape(len(zc),-1); Tc=layers[lo]*(1-fraction)+layers[hi]*fraction
    weights=(X[I[mask,0]+1]-X[I[mask,0]])*(Y[I[mask,1]+1]-Y[I[mask,1]])
    grid=np.full((len(Y)-1,len(X)-1),np.nan);grid[I[mask,1],I[mask,0]]=Tc
    room_stats={}
    for r in G['rooms']:
        selection=mesh['rooms'][mask]==r['id']; vals=Tc[selection]
        room_stats[r['id']]={'mean_C':float(np.average(vals,weights=weights[selection])),'min_C':float(vals.min()),'max_C':float(vals.max())}
    entry={'height_m':h,'actual_cell_height_m':h,'rooms':room_stats,'min_C':float(Tc.min()),'max_C':float(Tc.max()),'mean_C':float(np.average(Tc,weights=weights))}
    report['slices'].append(entry)
    fig=plt.figure(figsize=(12.8,10.8),facecolor='#f5f7f9')
    ax=fig.add_axes([.10,.15,.64,.72]);ax.set_facecolor('#f5f7f9')
    im=ax.pcolormesh(X,Y,np.ma.masked_invalid(grid),cmap=cmap,norm=norm,shading='flat',rasterized=True)
    ax.add_collection(LineCollection(segments,colors='#243240',linewidths=2.1,zorder=3))
    ax.plot(*np.array(outline).T,color='#243240',lw=2.5)
    for r in G['rooms']:
        x,y=room_position(r);v=room_stats[r['id']]['mean_C'];name=labels[r['id']]
        if r['id']=='hall':x,y=5.73,1.4
        if r['id']=='wc':name='WC'
        size=7 if r['id'] in ['wc','bathroom','hall'] else 9
        ax.text(x,y,f'{name}\n{v:.1f}°C',ha='center',va='center',fontsize=size,fontweight='bold',linespacing=1.65,bbox={'boxstyle':'round,pad=.45','facecolor':'white','alpha':.85,'edgecolor':'none'},zorder=4)
    ax.set_aspect('equal');ax.set_xlim(-.35,11.65);ax.set_ylim(13.6,-.45);ax.axis('off')
    # Plan orientation, not a verified geographic bearing.
    ax.annotate('',xy=(.65,.65),xytext=(.65,1.45),arrowprops={'arrowstyle':'-|>','color':'#243240','lw':1.2});ax.text(.65,.42,'PLAN N',ha='center',fontsize=7)
    ax.plot([.3,2.3],[12.85,12.85],color='#243240',lw=2);ax.text(1.3,12.6,'2 m',ha='center',fontsize=8)
    cax=fig.add_axes([.80,.29,.022,.40]);cb=fig.colorbar(im,cax=cax,ticks=np.arange(18,22.1,.5));cb.set_label('Air temperature · °C',labelpad=15);cb.outline.set_visible(False)
    fig.text(.09,.935,'DANISH VILLA',fontsize=11,fontweight='bold',color='#526473')
    fig.text(.09,.89,'Winter temperature map',fontsize=25,fontweight='bold')
    fig.text(.80,.80,f'{h:.2f} m',fontsize=22,fontweight='bold');fig.text(.80,.765,'above finished floor',fontsize=9)
    fig.text(.80,.17,'−5°C OUTDOORS\n150 m³/h VENTILATION\nHEATED FLOOR\nINTERNAL DOORS OPEN',fontsize=9,linespacing=1.8,color='#526473')
    fig.text(.09,.08,'3D CFD · Assumed winter operating conditions · Room labels show slice means',fontsize=9)
    fig.text(.09,.053,'Scenario prediction, not measured data. Equivalent 2.50 m ceiling; fixed surface temperatures; no furniture or solar gain.',fontsize=8,color='#526473')
    slug=f'temperature-{h:.2f}m';fig.savefig(out/(slug+'.png'),dpi=210,facecolor=fig.get_facecolor());
    if h==1.1:fig.savefig(out/'winter-temperature-map.pdf',dpi=210,facecolor=fig.get_facecolor())
    plt.close(fig)
    rgba=cmap(norm(Tc));rects=[]
    for (i,j,k),temp,col in zip(I[mask],Tc,rgba):rects.append([float(X[i]),float(Y[j]),float(X[i+1]),float(Y[j+1]),round(float(temp),4),*[round(float(a),4) for a in col[:3]]])
    slices.append({'height':h,'actualHeight':entry['actual_cell_height_m'],'cells':rects,'rooms':room_stats,'image':slug+'.png'})
    # Clean map texture for interactive WebGL, using exact cell rectangles.
    f=plt.figure(figsize=(11.16,13.13),dpi=100);a=f.add_axes([0,0,1,1]);a.pcolormesh(X,Y,np.ma.masked_invalid(grid),cmap=cmap,norm=norm);a.set_xlim(0,11.16);a.set_ylim(13.13,0);a.axis('off');f.savefig(out/(slug+'-texture.png'),transparent=True);plt.close(f)
 np.savez_compressed(out/'solved-field.npz',centres=C,temperature_C=T,ijk=I,X=X,Y=Y,Z=Z,room_ids=mesh['rooms'])
 (out/'summary.json').write_text(json.dumps(report,indent=2))
 (out/'map-data.json').write_text(json.dumps({'slices':slices,'walls':G['walls'],'rooms':G['rooms'],'scenario':S,'summary':report},separators=(',',':')))
 np.savetxt(out/'temperature-cells.csv',np.column_stack([C,T]),delimiter=',',header='x_m,y_plan_south_m,z_height_m,air_temperature_C',comments='',fmt='%.6f')
 print(json.dumps(report,indent=2))
