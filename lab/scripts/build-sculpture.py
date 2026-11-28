"""Trusted local worker; accepts only compiler-produced synthetic recipes.
Run in isolated process; not a public endpoint or untrusted-input boundary.
"""
import bpy, json, sys, math
from pathlib import Path
from mathutils import Vector
args=sys.argv[sys.argv.index("--")+1:]
root=Path(__file__).resolve().parents[1]
out=Path(args[0]).resolve(strict=True)
if out.parent != (root/"staging").resolve() or not out.is_dir(): raise ValueError("invalid run directory")
source=out/"recipe.json"
if source.is_symlink() or source.stat().st_size>100000: raise ValueError("invalid recipe file")
r=json.loads(source.read_text())
if r["version"]!=1 or len(r["parts"])>64 or len(r["materials"])>16 or len(r["lights"])>4: raise ValueError("invalid recipe limits")
bpy.ops.wm.read_factory_settings(use_empty=True)
scene=bpy.context.scene
scene.render.engine="CYCLES"
scene.cycles.samples=64
scene.cycles.use_denoising=True
scene.render.resolution_x=640
scene.render.resolution_y=640
scene.render.resolution_percentage=100
scene.render.image_settings.file_format="PNG"
scene.render.image_settings.color_mode="RGBA"
scene.render.film_transparent=True
scene.view_settings.view_transform="AgX"
world=bpy.data.worlds.new("Agntia soft ambient")
world.use_nodes=True
world.node_tree.nodes.get("Background").inputs["Color"].default_value=(*r["background"],1)
world.node_tree.nodes.get("Background").inputs["Strength"].default_value=.35
scene.world=world
materials={}
for m in r["materials"]:
    mat=bpy.data.materials.new(m["id"]);mat.use_nodes=True
    shader=mat.node_tree.nodes.get("Principled BSDF")
    for name,value in {"Base Color":(*m["color"],1),"Roughness":m["roughness"],"Metallic":m["metallic"],"Coat Weight":m["coat"],"Coat Roughness":m["coatRoughness"],"Transmission Weight":m["transmission"],"IOR":m["ior"]}.items(): shader.inputs[name].default_value=value
    materials[m["id"]]=mat
parts=[]
for p in r["parts"]:
    g=p["geometry"];kind=g["kind"]
    if kind=="rounded-box":
        bpy.ops.mesh.primitive_cube_add();obj=bpy.context.object;obj.dimensions=g["size"]
    elif kind=="ellipsoid":
        bpy.ops.mesh.primitive_uv_sphere_add(segments=48,ring_count=24);obj=bpy.context.object;obj.scale=g["radii"]
    elif kind=="ring":
        bpy.ops.mesh.primitive_torus_add(major_segments=64,minor_segments=16,major_radius=g["radius"],minor_radius=g["tube"]);obj=bpy.context.object
    elif kind=="disc":
        bpy.ops.mesh.primitive_cylinder_add(vertices=64,radius=g["radius"],depth=g["height"]);obj=bpy.context.object
    elif kind=="tube":
        curve=bpy.data.curves.new(p["id"],"CURVE");curve.dimensions="3D";curve.bevel_depth=g["radius"];curve.bevel_resolution=4;curve.resolution_u=12;curve.use_fill_caps=True
        spline=curve.splines.new("BEZIER");spline.bezier_points.add(len(g["points"])-1)
        for point,co in zip(spline.bezier_points,g["points"]):
            point.co=co;point.handle_left_type="AUTO";point.handle_right_type="AUTO"
        obj=bpy.data.objects.new(p["id"],curve);scene.collection.objects.link(obj)
        bpy.ops.object.select_all(action="DESELECT");obj.select_set(True);bpy.context.view_layer.objects.active=obj;bpy.ops.object.convert(target="MESH");obj=bpy.context.object
    else: raise ValueError("unsupported geometry")
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    obj.name=p["id"];obj.location=p["position"];obj.rotation_euler=p["rotation"];obj.data.materials.append(materials[p["material"]])
    if "bevel" in g:
        mod=obj.modifiers.new("Soft ceramic edges","BEVEL");mod.width=g["bevel"];mod.segments=6
        normals=obj.modifiers.new("Weighted normals","WEIGHTED_NORMAL");normals.keep_sharp=True
    for face in obj.data.polygons: face.use_smooth=True
    parts.append(obj)
def aim(obj,target): obj.rotation_euler=(Vector(target)-obj.location).to_track_quat("-Z","Y").to_euler()
bpy.ops.object.camera_add(location=r["camera"]["position"]);scene.camera=bpy.context.object;scene.camera.data.type="ORTHO";scene.camera.data.ortho_scale=r["camera"]["scale"];aim(scene.camera,r["camera"]["target"])
for l in r["lights"]:
    bpy.ops.object.light_add(type="AREA",location=l["position"]);obj=bpy.context.object;obj.name=l["id"];obj.data.energy=l["watts"];obj.data.size=l["size"];obj.data.color=l["color"];aim(obj,l["target"])
bpy.ops.object.select_all(action="DESELECT")
for p in parts:p.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(out/"sculpture.glb"),export_format="GLB",use_selection=True)
scene.render.filepath=str(out/"sculpture.png")
bpy.ops.wm.save_as_mainfile(filepath=str(out/"sculpture.blend"))
bpy.ops.render.render(write_still=True)
