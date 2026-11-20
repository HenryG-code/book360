# 0005: The intro plays on its own instead of following the scroll

- **Status:** Accepted. Replaces the "page scrolls normally" and "headline" parts of [ADR 0004](0004-scroll-driven-intro-animation.md)
- **Date:** 2026-11-20

## Problem

ADR 0004 tied each frame of the intro film to the scroll position: scroll a little, the film moves a
little. In use, people scroll at very different speeds. A fast scroll, or a flick on a phone, carried
the visitor past the whole film in a fraction of a second, so most of it was never seen, and frames
that had not loaded yet made it jump. It also made the section three screens tall, which felt like the
page had stalled.

## Options

1. **Keep scrubbing, smooth it out.** Ease the film towards the scroll position instead of jumping.
   Still too fast for a flick, and still three screens tall.
2. **Pin the section and take over the scroll until the film ends.** Every visitor sees it, but taking
   control of the scroll is one of the most disliked things a site can do, and it breaks easily on
   phones.
3. **Play the film on its own clock when the section comes into view.** The same film for everyone,
   at the speed it was made for, and the page scrolls like any other.

## Decision

Option 3. `src/components/IntroFilm.tsx` replaces `ScrollIntro.tsx`.

- The section is about one screen tall. When 40% of it is on screen, the film plays once, over 4.2
  seconds, timed with `requestAnimationFrame`.
- The film starts only when every frame has downloaded, so it never stutters. Downloads still begin at
  the visitor's first scroll, which leaves the time it takes to scroll past the hero for loading.
- If the frames have not arrived 2.5 seconds after the section is on screen, the visitor gets the still
  image and the full headline instead. They never face an empty space.
- The headline's words still arrive one by one, driven by the film's progress instead of the scroll.
- It plays once per visit. Scrolling away and back does not restart it; a "Play again" button does.
- Reduced motion and no-script visitors are unchanged: the still image and the full headline.

What did not change from ADR 0004: the frames themselves, the two frame sets for desktop and phone,
and the Blender source.

## Consequences

**Better:** everyone sees the whole film at its proper pace. The home page is about two screens
shorter. Fast scrolling no longer causes jumps.

**Worse:** a visitor who scrolls past the section before it plays misses it; they can scroll back or
press "Play again". The film needs every frame before it starts, so on a very slow connection the
still image shows instead.

**What would change this:** if analytics showed most visitors never see the film, it could start a
little earlier (at 20% visible) or the section could move higher up the page.
