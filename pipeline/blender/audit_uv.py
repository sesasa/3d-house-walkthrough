import bpy,json,numpy as np
bpy.ops.wm.open_mainfile(filepath='/workspace/housewalk/house5/output/baked/production.blend')
o=bpy.data.objects['Baked_kitchen_structure'];o.data.calc_loop_triangles()
for uv in o.data.uv_layers:
 a=np.array([v.uv[:] for v in uv.data]);areas=[]
 for t in o.data.loop_triangles:
  x,y,z=a[list(t.loops)];areas.append(abs(np.cross(y-x,z-x))/2)
 print('UV',uv.name,'bounds',a.min(0),a.max(0),'area',sum(areas),'area_max',max(areas),'positive',sum(v>1e-8 for v in areas),'triangles',len(areas),'render',uv.active_render,flush=True)
for m in list(o.data.materials)[:3]:
 print('MAT',m.name,[(n.name,n.uv_map) for n in m.node_tree.nodes if n.type=='UVMAP'],flush=True)
