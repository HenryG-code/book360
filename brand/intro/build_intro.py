"""Builds the Book360 intro animation in Blender, saves the working file and renders its frames.

The scene: the Book360 pin drops into place, its ring opens around it, the camera walks a full circle
around the pin (looking around the room before you book), and the shot settles on the exact angle of the
flat logo. The web page plays these frames in step with scrolling.

Run from the book360 folder (Blender must be installed; nothing else is needed):

    blender -b --factory-startup -P brand/intro/build_intro.py -- --render all
    blender -b --factory-startup -P brand/intro/build_intro.py -- --render 1,30,90,150

Outputs:
    brand/intro/book360-intro.blend    the working file: open it in Blender to change anything
    media-src/intro/frame_0001.png ... the rendered frames (git-ignored; scripts/prepare-intro.mjs
                                       turns them into the small images the website uses)

Everything is built from code, so the animation can be rebuilt exactly. Edits made by hand in the
.blend file are not read back by this script: either keep editing the .blend and render from it, or
change this script and run it again.
"""

import math
import os
import sys

import bpy

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
BLEND_PATH = os.path.join(ROOT, "brand", "intro", "book360-intro.blend")
FRAMES_DIR = os.path.join(ROOT, "media-src", "intro")

FRAME_COUNT = 150
SIZE = 1200  # square frames: they fit a wide desktop screen and a tall phone screen equally well

# Brand colours, as on the website (src/app/globals.css).
NAVY = "#0e3350"
OCEAN = "#2a72ae"
SAND = "#f1ede6"

# Key moments, in frames.
LAND = 30  # the pin touches down
RING_OPEN = (26, 46)  # the ring grows from nothing to full size
ORBIT = (46, 128)  # the camera walks a full circle
SETTLE = (128, 150)  # the camera eases back into the logo's angle


# ---------------------------------------------------------------------------------------------
# Helpers


def linear(hex_colour, alpha=1.0):
    """Blender works in linear light; brand colours are sRGB hex. This converts one to the other."""
    hex_colour = hex_colour.lstrip("#")
    out = []
    for i in (0, 2, 4):
        c = int(hex_colour[i : i + 2], 16) / 255
        out.append(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4)
    return (*out, alpha)


def key(obj, path, frame, value, index=-1, interpolation="BEZIER", easing="AUTO"):
    """Set a property and record it as a keyframe."""
    target = getattr(obj, path)
    if index >= 0:
        target[index] = value
    else:
        setattr(obj, path, value)
    obj.keyframe_insert(data_path=path, frame=frame, index=index)
    action = obj.animation_data.action
    for kp in iter_keyframes(action, path):
        if int(round(kp.co.x)) == frame:
            kp.interpolation = interpolation
            kp.easing = easing


def iter_keyframes(action, path):
    """Keyframe points for one property. Blender 4.4+ keeps them in layered actions."""
    curves = []
    if hasattr(action, "layers") and len(action.layers) > 0:
        for layer in action.layers:
            for strip in layer.strips:
                for bag in strip.channelbags:
                    curves.extend(bag.fcurves)
    elif hasattr(action, "fcurves"):
        curves = list(action.fcurves)
    for curve in curves:
        if curve.data_path == path:
            yield from curve.keyframe_points


def material(name, colour, roughness=0.3, metallic=0.0, coat=0.0, emission=0.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = linear(colour)
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    if "Coat Weight" in bsdf.inputs:
        bsdf.inputs["Coat Weight"].default_value = coat
    if emission and "Emission Strength" in bsdf.inputs:
        bsdf.inputs["Emission Color"].default_value = linear(colour)
        bsdf.inputs["Emission Strength"].default_value = emission
    return mat


# ---------------------------------------------------------------------------------------------
# The logo, turned into 3D shapes


def logo_point(x, y):
    """The logo is drawn on a 64 x 64 grid with y pointing down. In the scene the pin's tip sits at the
    origin, 10 grid units make one metre, and z points up."""
    return ((x - 32) / 10, (50 - y) / 10)


def cubic(p0, p1, p2, p3, steps):
    for i in range(1, steps + 1):
        t = i / steps
        u = 1 - t
        yield (
            u**3 * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t**3 * p3[0],
            u**3 * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t**3 * p3[1],
        )


def pin_outline():
    """The outline of the pin, traced from the logo's SVG path:
    M32 50 S17 35.5 17 24 a15 15 0 0 1 30 0 c0 11.5-15 26-15 26Z"""
    points = [(32, 50)]
    points += cubic((32, 50), (32, 50), (17, 35.5), (17, 24), 28)  # left side, tip to widest point
    for i in range(1, 49):  # the round top, left to right over the top
        angle = math.pi - math.pi * i / 48
        points.append((32 + 15 * math.cos(angle), 24 - 15 * math.sin(angle)))
    points += list(cubic((47, 24), (47, 35.5), (32, 50), (32, 50), 28))[:-1]  # right side, back to the tip
    return [logo_point(x, y) for x, y in points]


def hole_outline():
    """The round hole in the pin: a circle of radius 5.5 at (32, 24)."""
    return [logo_point(32 + 5.5 * math.cos(2 * math.pi * i / 40), 24 + 5.5 * math.sin(2 * math.pi * i / 40)) for i in range(40)]


def build_pin(mat):
    curve = bpy.data.curves.new("Pin", "CURVE")
    curve.dimensions = "2D"
    curve.fill_mode = "BOTH"
    curve.extrude = 0.3  # half the thickness: thick enough to read as solid when seen edge-on
    curve.bevel_depth = 0.09  # rounds every edge, so light catches it
    curve.bevel_resolution = 5
    for outline in (pin_outline(), hole_outline()):
        spline = curve.splines.new("POLY")
        spline.points.add(len(outline) - 1)
        for point, (x, y) in zip(spline.points, outline):
            point.co = (x, y, 0, 1)
        spline.use_cyclic_u = True
    pin = bpy.data.objects.new("Pin", curve)
    pin.rotation_euler = (math.radians(90), 0, 0)  # stand the flat shape upright
    pin.data.materials.append(mat)
    return pin


# ---------------------------------------------------------------------------------------------
# Scene


def build():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.name = "Book360 intro"
    scene.frame_start = 1
    scene.frame_end = FRAME_COUNT
    scene.render.fps = 30

    # --- Rendering: Eevee, square frames, transparent background so the page colour shows through.
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = SIZE
    scene.render.resolution_y = SIZE
    scene.render.resolution_percentage = 100
    scene.render.film_transparent = True
    scene.render.dither_intensity = 0
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    # "Standard" keeps brand colours as they are; the default view transform would fade them.
    scene.display_settings.display_device = "sRGB"
    scene.view_settings.view_transform = "Standard"
    scene.view_settings.look = "None"
    print("VIEW_TRANSFORM", scene.view_settings.view_transform, flush=True)
    eevee = scene.eevee
    for name, value in (("taa_render_samples", 64), ("use_raytracing", True), ("use_shadows", True)):
        if hasattr(eevee, name):
            setattr(eevee, name, value)

    # --- World: a soft, warm fill light the colour of the page.
    world = bpy.data.worlds.new("Sand light")
    world.use_nodes = True
    background = world.node_tree.nodes.get("Background")
    background.inputs["Color"].default_value = linear(SAND)
    background.inputs["Strength"].default_value = 0.3
    scene.world = world

    collection = scene.collection

    # --- The logo pieces.
    pin = build_pin(material("Pin navy", NAVY, roughness=0.38, coat=0.35))
    collection.objects.link(pin)

    bpy.ops.mesh.primitive_torus_add(major_radius=2.4, minor_radius=0.13, major_segments=160, minor_segments=24)
    ring = bpy.context.active_object
    ring.name = "Ring"
    ring.location = (0, 0, 0.4)  # the logo's ring sits just above the pin's tip
    ring.data.materials.append(material("Ring blue", OCEAN, roughness=0.22, metallic=0.55))
    bpy.ops.object.shade_smooth()

    # The traveller: a small bead that runs around the ring, as your eye does in a tour.
    orbit = bpy.data.objects.new("Traveller orbit", None)
    orbit.location = (0, 0, 0.4)
    collection.objects.link(orbit)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.26, segments=48, ring_count=24, location=(2.4, 0, 0))
    bead = bpy.context.active_object
    bead.name = "Traveller"
    bead.parent = orbit
    bead.data.materials.append(material("Traveller", "#ffffff", roughness=0.2, emission=2.5))
    bpy.ops.object.shade_smooth()

    # A soft contact shadow under the pin: a disc that is dark in the middle and clear at the edge.
    bpy.ops.mesh.primitive_circle_add(vertices=96, radius=3.2, fill_type="TRIFAN", location=(0, 0, -0.02))
    shadow = bpy.context.active_object
    shadow.name = "Contact shadow"
    shadow_mat = bpy.data.materials.new("Contact shadow")
    shadow_mat.use_nodes = True
    if hasattr(shadow_mat, "surface_render_method"):
        shadow_mat.surface_render_method = "BLENDED"
    nodes, links = shadow_mat.node_tree.nodes, shadow_mat.node_tree.links
    nodes.clear()
    out = nodes.new("ShaderNodeOutputMaterial")
    mix = nodes.new("ShaderNodeMixShader")
    clear = nodes.new("ShaderNodeBsdfTransparent")
    dark = nodes.new("ShaderNodeEmission")
    dark.inputs["Color"].default_value = linear(NAVY)
    dark.inputs["Strength"].default_value = 0.0
    gradient = nodes.new("ShaderNodeTexGradient")
    gradient.gradient_type = "SPHERICAL"
    coords = nodes.new("ShaderNodeTexCoord")
    mapping = nodes.new("ShaderNodeMapping")
    mapping.inputs["Scale"].default_value = (1 / 3.2, 1 / 3.2, 1)
    ramp = nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].position = 0.0
    ramp.color_ramp.elements[0].color = (0, 0, 0, 1)
    ramp.color_ramp.elements[1].position = 0.75
    ramp.color_ramp.elements[1].color = (0.32, 0.32, 0.32, 1)  # at most about a third dark
    links.new(coords.outputs["Object"], mapping.inputs["Vector"])
    links.new(mapping.outputs["Vector"], gradient.inputs["Vector"])
    links.new(gradient.outputs["Fac"], ramp.inputs["Fac"])
    links.new(ramp.outputs["Color"], mix.inputs["Fac"])
    links.new(clear.outputs["BSDF"], mix.inputs[1])
    links.new(dark.outputs["Emission"], mix.inputs[2])
    links.new(mix.outputs["Shader"], out.inputs["Surface"])
    shadow.data.materials.append(shadow_mat)

    # --- Lights: a large soft key from the front left, a cool rim from behind, a low warm bounce.
    def area(name, location, energy, size, colour="#ffffff"):
        light = bpy.data.lights.new(name, "AREA")
        light.energy = energy
        light.size = size
        light.color = linear(colour)[:3]
        obj = bpy.data.objects.new(name, light)
        obj.location = location
        collection.objects.link(obj)
        aim = obj.constraints.new("TRACK_TO")
        aim.target = pin
        return obj

    area("Key", (-6, -7, 8), 900, 3.5)
    area("Rim", (5, 7, 6), 1500, 3, "#cfe2f5")  # a cool edge light that outlines the pin against the page
    area("Bounce", (3, -6, -1.5), 160, 6, "#f6e9d6")

    # --- Camera, on a pivot so it can circle the pin.
    pivot = bpy.data.objects.new("Camera pivot", None)
    pivot.location = (0, 0, 2.0)
    pivot.rotation_mode = "XYZ"
    collection.objects.link(pivot)
    cam_data = bpy.data.cameras.new("Camera")
    cam_data.lens = 50
    cam_data.sensor_fit = "HORIZONTAL"
    camera = bpy.data.objects.new("Camera", cam_data)
    camera.parent = pivot
    camera.location = (0, -14.5, 0)
    camera.rotation_euler = (math.radians(90), 0, 0)  # look along +y, at the pivot
    collection.objects.link(camera)
    scene.camera = camera

    animate(pin, ring, orbit, bead, shadow, pivot, camera)

    os.makedirs(os.path.dirname(BLEND_PATH), exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=BLEND_PATH)
    return scene


def animate(pin, ring, orbit, bead, shadow, pivot, camera):
    # The flat logo is seen from slightly above: its ring is three times wider than tall, which is
    # what a circle looks like from about 19.5 degrees up. The shot starts and ends there.
    logo_elevation = math.degrees(math.asin(8 / 24))

    # 1. The pin drops in from above and lands with a small bounce.
    key(pin, "location", 1, 7.5, index=2, easing="EASE_IN")
    key(pin, "location", LAND, 0.0, index=2, easing="EASE_OUT")
    key(pin, "location", LAND + 6, 0.35, index=2, easing="EASE_OUT")
    key(pin, "location", LAND + 12, 0.0, index=2, easing="EASE_IN_OUT")
    # It squashes a little on landing, then springs back.
    for frame, (sx, sz) in ((LAND - 2, (1.0, 1.0)), (LAND, (1.08, 0.9)), (LAND + 5, (0.97, 1.04)), (LAND + 12, (1.0, 1.0))):
        key(pin, "scale", frame, sx, index=0)
        key(pin, "scale", frame, sz, index=1)  # the curve stands upright, so its local y is world z

    # The shadow grows as the pin comes down.
    for frame, s in ((1, 0.25), (LAND, 1.0)):
        for axis in (0, 1):
            key(shadow, "scale", frame, s, index=axis)

    # 2. The ring opens out from the tip, overshooting slightly.
    for frame, s in ((RING_OPEN[0], 0.001), (RING_OPEN[0] + 12, 1.07), (RING_OPEN[1], 1.0)):
        for axis in range(3):
            key(ring, "scale", frame, s, index=axis)
    # The traveller bead appears once the ring is open, then runs round it twice, steadily.
    for frame, s in ((RING_OPEN[1] - 4, 0.001), (RING_OPEN[1] + 4, 1.0)):
        for axis in range(3):
            key(bead, "scale", frame, s, index=axis)
    key(orbit, "rotation_euler", RING_OPEN[1] - 4, math.radians(-30), index=2, interpolation="LINEAR")
    key(orbit, "rotation_euler", FRAME_COUNT, math.radians(-30 + 720), index=2, interpolation="LINEAR")

    # 3. The camera walks a full circle around the pin, dipping low then rising high on the way.
    key(pivot, "rotation_euler", 1, math.radians(-logo_elevation), index=0)
    key(pivot, "rotation_euler", ORBIT[0], math.radians(-logo_elevation), index=0)
    key(pivot, "rotation_euler", ORBIT[0] + 25, math.radians(-6), index=0)
    key(pivot, "rotation_euler", ORBIT[0] + 58, math.radians(-38), index=0)
    key(pivot, "rotation_euler", ORBIT[1], math.radians(-logo_elevation), index=0)
    key(pivot, "rotation_euler", ORBIT[0], 0.0, index=2, easing="EASE_IN_OUT")
    key(pivot, "rotation_euler", ORBIT[1], math.radians(360), index=2, easing="EASE_IN_OUT")
    # The camera leans in during the circle and eases back out for the final, logo-like view.
    key(camera, "location", ORBIT[0], -14.5, index=1)
    key(camera, "location", ORBIT[0] + 40, -11.5, index=1)
    key(camera, "location", ORBIT[1], -13.5, index=1)
    key(camera, "location", SETTLE[1], -15.5, index=1, easing="EASE_OUT")


# ---------------------------------------------------------------------------------------------
# Rendering


def render(spec):
    scene = bpy.context.scene
    os.makedirs(FRAMES_DIR, exist_ok=True)
    frames = range(1, FRAME_COUNT + 1) if spec == "all" else [int(f) for f in spec.split(",")]
    for frame in frames:
        scene.frame_set(frame)
        scene.render.filepath = os.path.join(FRAMES_DIR, f"frame_{frame:04d}.png")
        bpy.ops.render.render(write_still=True)
        print(f"RENDERED {frame}", flush=True)


if __name__ == "__main__":
    args = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    build()
    if "--render" in args:
        render(args[args.index("--render") + 1])
