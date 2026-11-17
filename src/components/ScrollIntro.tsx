"use client";

// The home page's "Look Around First, Decide After" section: a Blender animation of the Book360 pin
// that plays forwards as the visitor scrolls down, and backwards as they scroll up.
//
// How it works:
//   - The section is several screens tall. Inside it, a stage the height of one screen is "sticky",
//     so it stays in view while the page scrolls past behind it.
//   - How far the visitor has scrolled through the section becomes a number from 0 to 1. That picks a
//     frame, which is drawn onto a <canvas>. Scrolling is never taken over: the page scrolls normally
//     and the animation follows it.
//   - The same number is handed to CSS as --p, and each word of the headline fades in at its own point.
//
// What keeps it light and safe:
//   - Nothing is downloaded until the section is about to come into view.
//   - Phones get half the frames at a smaller size.
//   - Frames load roughly first (every eighth), then fill in, so scrubbing works early and sharpens.
//   - Visitors who ask their device to reduce motion get a still image and the full headline. So does
//     any browser where the script does not run.

import { useEffect, useRef, useState } from "react";
import frames from "@/data/intro-frames.json";

const WORDS: { text: string; at: number }[] = [
  { text: "Look", at: 0.16 },
  { text: "Around", at: 0.24 },
  { text: "First,", at: 0.5 },
  { text: "Decide", at: 0.72 },
  { text: "After", at: 0.8 },
];

/** Load order: every eighth frame first, then every fourth, then the rest. */
function loadOrder(count: number): number[] {
  const order: number[] = [];
  const seen = new Set<number>();
  for (const step of [8, 4, 2, 1]) {
    for (let i = 0; i < count; i += step) {
      if (!seen.has(i)) {
        seen.add(i);
        order.push(i);
      }
    }
  }
  if (!seen.has(count - 1)) order.splice(1, 0, count - 1);
  return order;
}

export function ScrollIntro({ children }: { children?: React.ReactNode }) {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    if (!section || !canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const set = window.matchMedia("(min-width: 768px)").matches ? frames.lg : frames.sm;
    canvas.width = set.size;
    canvas.height = set.size;
    const images: (HTMLImageElement | undefined)[] = new Array(set.count);
    let wanted = 0;
    let drawn = -1;
    let ticking = false;
    let started = false;
    let cancelled = false;

    /** The closest frame that has arrived, looking backwards first so motion never jumps ahead. */
    const nearestLoaded = (index: number) => {
      for (let distance = 0; distance < set.count; distance++) {
        const before = images[index - distance];
        if (before) return index - distance;
        const after = images[index + distance];
        if (after) return index + distance;
      }
      return -1;
    };

    const draw = () => {
      ticking = false;
      const index = nearestLoaded(wanted);
      if (index < 0 || index === drawn) return;
      context.clearRect(0, 0, set.size, set.size);
      context.drawImage(images[index]!, 0, 0, set.size, set.size);
      drawn = index;
    };

    const update = () => {
      const box = section.getBoundingClientRect();
      const travel = box.height - window.innerHeight;
      const progress = travel > 0 ? Math.min(1, Math.max(0, -box.top / travel)) : 1;
      section.style.setProperty("--p", progress.toFixed(4));
      wanted = Math.round(progress * (set.count - 1));
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(draw);
      }
    };

    const load = async () => {
      for (const index of loadOrder(set.count)) {
        if (cancelled) return;
        const image = new Image();
        image.src = `${set.path}/${String(index).padStart(3, "0")}.webp`;
        try {
          await image.decode();
        } catch {
          continue; // one missing frame is skipped; its neighbours stand in for it
        }
        images[index] = image;
        if (!started) {
          started = true;
          setAnimated(true); // swap the still image for the canvas once there is something to draw
        }
        drawn = -1;
        update();
      }
    };

    // Start loading when the section is within one screen of being visible.
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect();
          void load();
        }
      },
      { rootMargin: "100% 0px" },
    );
    observer.observe(section);

    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
    return () => {
      cancelled = true;
      observer.disconnect();
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="idea"
      aria-labelledby="idea-heading"
      data-animated={animated ? "true" : "false"}
      className="scroll-intro relative scroll-mt-10 bg-sand"
    >
      <div className="scroll-intro-stage flex flex-col items-center justify-center gap-2 overflow-hidden px-6 pt-16 pb-4 sm:gap-0">
        {/* Real text, so it is read out, found by search and stays sharp at any size. */}
        <h2 id="idea-heading" className="display text-center text-[clamp(2.4rem,7.4vw,5.75rem)]">
          {WORDS.map((word, index) => (
            <span key={word.text}>
              <span className="scroll-intro-word" style={{ "--at": word.at } as React.CSSProperties}>
                {word.text}
              </span>
              {index === 1 ? <br /> : index < WORDS.length - 1 ? " " : null}
            </span>
          ))}
        </h2>
        <div className="relative aspect-square w-full max-w-[min(92vw,58svh)] sm:max-w-[min(80vw,74svh)]">
          {/* eslint-disable-next-line @next/next/no-img-element -- a fixed-size still under the canvas */}
          <img
            src={frames.poster}
            alt="The Book360 pin standing inside its ring"
            width={800}
            height={800}
            className="scroll-intro-poster absolute inset-0 size-full"
          />
          <canvas ref={canvasRef} aria-hidden="true" className="scroll-intro-canvas absolute inset-0 size-full" />
        </div>
      </div>
      {children}
    </section>
  );
}
