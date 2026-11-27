"""Trusted offline Blender builder for the fixed synthetic ceramic mail fixture."""

import json
from math import radians
from pathlib import Path
import sys

import bpy
from mathutils import Vector

root = Path(__file__).resolve().parents[1]
output = Path(sys.argv[sys.argv.index("--") + 1]).resolve(strict=True)
if output.parent != (root / "staging").resolve() or not output.is_dir():
    raise ValueError("Output must be a pre-created run directory inside lab/staging")
with (root / "fixtures/blender/ceramic-mail.json").open(encoding="utf-8") as source:
    recipe = json.load(source)
if recipe["schemaVersion"] != 1 or recipe["recipe"] != "ceramic-mail":
    raise ValueError("Unsupported recipe")

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.fps = recipe["framesPerSecond"]
scene.render.engine = "CYCLES"
scene.cycles.samples = 48
scene.cycles.use_denoising = False
scene.render.resolution_x = 420
scene.render.resolution_y = 420
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_mode = "RGBA"
scene.render.film_transparent = True

def material(name, rgb, roughness, metallic=0):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*rgb, 1)
    mat.use_nodes = True
    shader = mat.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = (*rgb, 1)
    shader.inputs["Roughness"].default_value = roughness
    shader.inputs["Metallic"].default_value = metallic
    return mat

def finish(obj, name, mat, bevel):
    obj.name = name
    obj.data.materials.append(mat)
    edges = obj.modifiers.new("Rounded edges", "BEVEL")
    edges.width = bevel
    edges.segments = 5
    normals = obj.modifiers.new("Weighted normals", "WEIGHTED_NORMAL")
    normals.keep_sharp = True
    for face in obj.data.polygons:
        face.use_smooth = True
    return obj

ivory = material("Ivory glaze", recipe["palette"]["ivory"], 0.28)
violet = material("Violet enamel", recipe["palette"]["violet"], 0.25)
champagne = material("Champagne rim", recipe["palette"]["champagne"], 0.32, 0.65)
body = recipe["body"]
bpy.ops.mesh.primitive_cube_add()
base = bpy.context.object
base.dimensions = (body["width"], body["thickness"], body["height"])
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
finish(base, "Body", ivory, body["bevel"])

pivot = bpy.data.objects.new("FlapPivot", None)
scene.collection.objects.link(pivot)
pivot.location = (0, -body["thickness"] / 2 - 0.05, body["height"] / 2 - 0.08)
flap = recipe["flap"]
half = flap["width"] / 2
outline = [(-half, 0), (half, 0), (0.16, -flap["height"]), (-0.16, -flap["height"])]
verts = [(x, y, z) for y in (-flap["thickness"], 0) for x, z in outline]
mesh = bpy.data.meshes.new("Flap mesh")
mesh.from_pydata(verts, [], [(3, 2, 1, 0), (4, 5, 6, 7)] +
                 [(i, (i + 1) % 4, (i + 1) % 4 + 4, i + 4) for i in range(4)])
mesh.update()
lid = bpy.data.objects.new("Flap", mesh)
scene.collection.objects.link(lid)
lid.parent = pivot
finish(lid, "Flap", ivory, flap["bevel"])

def seal_part(name, radius, thickness, depth, mat):
    bpy.ops.mesh.primitive_cylinder_add(vertices=48, radius=radius, depth=thickness,
                                        rotation=(radians(90), 0, 0))
    part = bpy.context.object
    part.parent = pivot
    part.location = (0, depth, -flap["height"] + 0.12)
    finish(part, name, mat, 0.025)

seal = recipe["seal"]
seal_part("SealRim", seal["radius"], seal["thickness"], -0.13, champagne)
seal_part("Seal", seal["radius"] * 0.86, seal["thickness"] * 0.7, -0.185, violet)

cursor = 1
for name, keys in recipe["clips"].items():
    for frame, angle in keys:
        pivot.rotation_euler.x = radians(angle)
        pivot.keyframe_insert(data_path="rotation_euler", frame=frame + 1, group="Hinge")
    animation = pivot.animation_data
    action = animation.action
    action.name = name
    animation.action = None
    track = animation.nla_tracks.new()
    track.name = name
    strip = track.strips.new(name, cursor, action)
    strip.blend_type = "REPLACE"
    strip.extrapolation = "NOTHING"
    cursor += keys[-1][0] + 2

def aim(obj, target):
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat("-Z", "Y").to_euler()

bpy.ops.object.camera_add(location=(3.1, -6.5, 2.6))
scene.camera = bpy.context.object
aim(scene.camera, (0, 0, 0))
scene.camera.data.type = "ORTHO"
scene.camera.data.ortho_scale = 3.45
for name, location, energy, size in [
    ("Key", (-3, -4, 5), 570, 4.0),
    ("Fill", (4, -3, 1), 200, 3.0),
    ("Rim", (0, 3, 4), 480, 3.0),
]:
    bpy.ops.object.light_add(type="AREA", location=location)
    light = bpy.context.object
    light.name = name
    light.data.energy = energy
    light.data.size = size
    aim(light, (0, 0, 0))

scene.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=str(output / "ceramic-mail.blend"))
bpy.ops.export_scene.gltf(filepath=str(output / "ceramic-mail.glb"), export_format="GLB",
                          export_animations=True, export_animation_mode="NLA_TRACKS")
scene.render.filepath = str(output / "ceramic-mail.png")
bpy.ops.render.render(write_still=True)
