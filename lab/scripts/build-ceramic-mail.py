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
scene.cycles.samples = 128
scene.cycles.adaptive_threshold = 0.014
scene.cycles.use_denoising = False
scene.render.resolution_x = 420
scene.render.resolution_y = 420
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_mode = "RGBA"
scene.render.film_transparent = True
scene.view_settings.view_transform = "AgX"
scene.view_settings.look = "AgX - Medium High Contrast"
studio_world = bpy.data.worlds.new("Soft studio ambient")
studio_world.use_nodes = True
ambient = studio_world.node_tree.nodes.get("Background")
ambient.inputs["Color"].default_value = (0.68, 0.56, 0.83, 1.0)
ambient.inputs["Strength"].default_value = 0.52
scene.world = studio_world

def material(name, rgb, roughness, metallic=0):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*rgb, 1)
    mat.use_nodes = True
    shader = mat.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = (*rgb, 1)
    shader.inputs["Roughness"].default_value = roughness
    shader.inputs["Metallic"].default_value = metallic
    shader.inputs["Coat Weight"].default_value = 0.28
    shader.inputs["Coat Roughness"].default_value = 0.26
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
champagne = material("Champagne rim", recipe["palette"]["champagne"], 0.24, 0.76)
body = recipe["body"]
bpy.ops.mesh.primitive_cube_add()
base = bpy.context.object
base.dimensions = (body["width"], body["thickness"], body["height"])
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
finish(base, "Body", ivory, body["bevel"])
shell = bpy.data.objects.new("Envelope", None)
scene.collection.objects.link(shell)
shell.location.z = 0.96
shell.rotation_euler.y = radians(-3)
base.parent = shell

def fold_panel(name, points, thickness, material_ref):
    front = -body["thickness"] / 2 - 0.012
    vertices = [(x, y, z) for y in (front - thickness, front) for x, z in points]
    n = len(points)
    mesh = bpy.data.meshes.new(name + " mesh")
    mesh.from_pydata(vertices, [], [tuple(reversed(range(n))), tuple(range(n, 2 * n))] +
                     [(i, (i + 1) % n, (i + 1) % n + n, i + n) for i in range(n)])
    mesh.update()
    panel = bpy.data.objects.new(name, mesh)
    scene.collection.objects.link(panel)
    panel.parent = shell
    return finish(panel, name, material_ref, 0.026)

edge = body["width"] / 2 - 0.058
depth = body["height"] / 2 - 0.053
fold_panel("LeftFold", [(-edge, -depth), (-edge, depth), (0.07, -0.08)], 0.049, ivory)
fold_panel("RightFold", [(edge, -depth), (-0.07, -0.08), (edge, depth)], 0.049, ivory)
fold_panel("LowerFold", [(-edge, -depth), (edge, -depth), (0.08, 0.09), (-0.08, 0.09)], 0.067, ivory)

pivot = bpy.data.objects.new("FlapPivot", None)
scene.collection.objects.link(pivot)
pivot.parent = shell
pivot.location = (0, -body["thickness"] / 2 - 0.085, body["height"] / 2 - 0.066)
flap = recipe["flap"]
half = flap["width"] / 2
outline = [(-half, 0), (half, 0), (half - 0.06, -0.115),
           (0.15, -flap["height"]), (-0.15, -flap["height"]), (-half + 0.06, -0.115)]
verts = [(x, y, z) for y in (-flap["thickness"], 0) for x, z in outline]
mesh = bpy.data.meshes.new("Flap mesh")
count = len(outline)
mesh.from_pydata(verts, [], [tuple(reversed(range(count))), tuple(range(count, 2 * count))] +
                 [(i, (i + 1) % count, (i + 1) % count + count, i + count) for i in range(count)])
mesh.update()
lid = bpy.data.objects.new("Flap", mesh)
scene.collection.objects.link(lid)
lid.parent = pivot
finish(lid, "Flap", ivory, flap["bevel"])

seal = recipe["seal"]
seal_z = -flap["height"] + 0.17
seal_y = -flap["thickness"] - 0.035
bpy.ops.mesh.primitive_torus_add(major_segments=72, minor_segments=16,
                                major_radius=seal["radius"] * 0.91, minor_radius=0.024,
                                rotation=(radians(90), 0, 0))
rim = bpy.context.object
rim.name = "SealRim"
rim.parent = pivot
rim.location = (0, seal_y - 0.015, seal_z)
rim.data.materials.append(champagne)
for face in rim.data.polygons:
    face.use_smooth = True

bpy.ops.mesh.primitive_uv_sphere_add(segments=64, ring_count=32)
medallion = bpy.context.object
medallion.name = "Seal"
medallion.parent = pivot
medallion.location = (0, seal_y - 0.01, seal_z)
medallion.scale = (seal["radius"] * 0.875, seal["thickness"] * 0.52, seal["radius"] * 0.875)
medallion.data.materials.append(violet)
for face in medallion.data.polygons:
    face.use_smooth = True

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

bpy.ops.object.camera_add(location=(-0.95, -7.2, 2.36))
scene.camera = bpy.context.object
aim(scene.camera, (0, 0, 1.25))
scene.camera.data.type = "ORTHO"
scene.camera.data.ortho_scale = 4.18
for name, location, energy, size in [
    ("Large warm key", (-3.2, -4.2, 5.5), 470, 4.0),
    ("Soft frontal fill", (3, -4, 2.5), 95, 3.5),
    ("Edge softbox", (2.2, 1.8, 3.8), 435, 3.0),
]:
    bpy.ops.object.light_add(type="AREA", location=location)
    light = bpy.context.object
    light.name = name
    light.data.energy = energy
    light.data.size = size
    aim(light, (0, 0, 1.05))

scene.frame_set(1)
parts = [shell, base, pivot, lid, rim, medallion] + [
    obj for obj in shell.children if obj.name.endswith("Fold")
]
bpy.ops.object.select_all(action="DESELECT")
for part in parts:
    part.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(output / "ceramic-mail.glb"), export_format="GLB",
                          use_selection=True, export_animations=True, export_animation_mode="NLA_TRACKS")
scene.render.filepath = str(output / "ceramic-mail.png")
bpy.ops.render.render(write_still=True)

bpy.ops.mesh.primitive_plane_add(size=200)
floor = bpy.context.object
floor.name = "Lavender cyclorama"
floor.data.materials.append(material("Matte lavender stage", (0.43, 0.32, 0.51), 0.8))
scene.render.film_transparent = False
scene.render.resolution_x = 640
scene.render.resolution_y = 640
scene.render.filepath = str(output / "ceramic-mail-studio.png")
bpy.ops.wm.save_as_mainfile(filepath=str(output / "ceramic-mail.blend"))
bpy.ops.render.render(write_still=True)
