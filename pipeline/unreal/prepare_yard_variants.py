import os,runpy
for base,revision in [('/workspace/housewalk/house5','FrontOpen'),('/workspace/housewalk/house5-closed','FrontClosed')]:
 os.environ['HOUSE5_BASE']=base;os.environ['HOUSE5_REVISION']=revision
 runpy.run_path('/workspace/housewalk/house5/pipeline/unreal/prepare_scene.py',run_name='__main__')
print('HOUSE5_FRONT_VARIANTS_PREPARED',flush=True)
