# 0004: Scroll-driven intro animation

- **Status:** Accepted
- **Date:** 2026-11-17

## Problem

The home page's "Look Around First, Decide After" section was a heading and two paragraphs. The owner
wants it to be a 3D animation of the Book360 logo, made in Blender, that plays as the visitor scrolls
down, with the words animating in. Most visitors are on phones, so it must stay smooth and must never
make the page fragile.

## Options

1. **A video that plays on its own.** Small and simple, but it ignores the scroll, so it does not feel
   tied to the page, and autoplaying video is often blocked or paused on phones.
2. **A video whose position follows the scroll.** One file, little memory. But jumping to an exact
   moment in a video is slow unless every frame is a keyframe (which makes the file large), it is uneven
   across browsers, and a transparent background needs different formats for Safari and for the rest.
3. **Real-time 3D in the browser (WebGL, for example three.js).** Fully interactive, but it adds a large
   library, needs a capable GPU, and duplicates in code what Blender already does well.
4. **A sequence of pre-rendered frames drawn onto a canvas, one per scroll position.** The approach
   used by many product pages. Any frame can be shown instantly, transparency works everywhere through
   WebP, and the browser does no 3D work at all.

## Decision

Option 4.

- **Blender renders the frames from a script.** `brand/intro/build_intro.py` builds the scene from the
  logo's own SVG path, animates it, saves `brand/intro/book360-intro.blend` as the working file, and
  renders 150 square frames. The animation is source code: it can be rebuilt exactly.
- **Two frame sets.** `scripts/prepare-intro.mjs` makes 150 frames at 800 px for large screens
  (2.7 MB) and 76 frames at 520 px for phones (0.8 MB), as transparent WebP.
- **The page scrolls normally.** A section several screens tall holds a sticky stage. How far the
  visitor is through the section picks the frame. Nothing captures or smooths the scroll.
- **The headline is real text.** Each word fades in at its own point through CSS, driven by one number
  (`--p`) that the script updates. Screen readers and search engines read the full heading.
- **Loading is lazy and coarse-to-fine.** Nothing loads until the section is within a screen of view.
  Every eighth frame arrives first, then the gaps fill, so scrubbing works early and sharpens.
- **Fallbacks are the default.** Without the script, or with reduced motion requested, the section is
  an ordinary block with the full heading and a still of the final frame, and no frames are downloaded.

## Consequences

**Easier:** the look is as good as Blender can render, and the browser only draws flat images, so older
phones cope. The animation can be changed by editing a script and re-rendering in about 8 minutes.

**Harder:** about 2.7 MB for desktop visitors and 0.8 MB for phones, on a page that was much lighter.
Decoded frames take memory: up to roughly 100 MB on a phone if every frame is held at once. Every
change to the animation means re-rendering and re-committing the frames.

**What would change this:** if the scene needed to react to the visitor (dragging the pin, for
example), real-time 3D would be worth its cost. If phones struggle in real testing, the phone set can
drop to every third frame or a smaller size without touching the page code.
