"use client";

// The home page's "Look Around First, Decide After" section: a short Blender film of the Book360 pin.
// It plays once, on its own, when the section comes into view, with the headline's words arriving in
// step. Afterwards a "Play again" button replays it.
//
// Why not tie it to scrolling? It used to be: every frame matched a scroll position. But people scroll
// at very different speeds, and a fast scroll flew past the whole film in a moment. A film with its
// own clock looks the same to everyone.
//
// How it works:
//   - The frames are drawn one after another onto a <canvas>, timed with requestAnimationFrame, so the
//     film runs at the screen's own pace and pauses in a background tab.
//   - How far through the film it is becomes a number from 0 to 1, handed to CSS as --p. Each word of
//     the headline fades in when --p passes its own point.
//   - data-state on the section says which stage it is in: idle, loading, playing, done or still.
//
// What keeps it light and safe:
//   - Nothing is downloaded until the visitor starts to scroll, or the section is already on screen.
//   - Phones get half the frames at a smaller size.
//   - The film starts only once every frame has arrived, so it never stutters. If the frames take too
//     long, the visitor gets the still image and the whole headline instead of an empty space.
//   - Visitors who ask their device to reduce motion get the still image and the full headline. So does
//     any browser where the script does not run.

import { useCallback, useEffect, useRef, useState } from "react";
import frames from "@/data/intro-frames.json";

const WORDS: { text: string; at: number }[] = [
  { text: "Look", at: 0.16 },
  { text: "Around", at: 0.24 },
  { text: "First,", at: 0.5 },
  { text: "Decide", at: 0.72 },
  { text: "After", at: 0.8 },
];

/** Length of the film. 150 frames in 4.2 seconds is about 36 frames a second. */
const DURATION_MS = 4200;
/** How long to wait for the frames after the section is on screen, before showing the still instead. */
const PATIENCE_MS = 2500;
/** How many frames download at once. */
const PARALLEL = 6;

type State = "idle" | "loading" | "playing" | "done" | "still";

export function IntroFilm({ children }: { children?: React.ReactNode }) {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const frameRef = useRef(0);
  const [state, setState] = useState<State>("idle");

  /** Show how far through the film it is: draws the frame and moves the words. */
  const show = useCallback((progress: number) => {
    const canvas = canvasRef.current;
    const images = imagesRef.current;
    const context = canvas?.getContext("2d");
    const index = Math.min(images.length - 1, Math.round(progress * (images.length - 1)));
    if (context && images[index] && index !== frameRef.current) {
      context.clearRect(0, 0, canvas!.width, canvas!.height);
      context.drawImage(images[index]!, 0, 0, canvas!.width, canvas!.height);
      frameRef.current = index;
    }
    sectionRef.current?.style.setProperty("--p", progress.toFixed(4));
  }, []);

  const play = useCallback(() => {
    setState("playing");
    frameRef.current = -1;
    const started = performance.now();
    const step = (now: number) => {
      const progress = Math.min(1, (now - started) / DURATION_MS);
      show(progress);
      if (progress < 1) requestAnimationFrame(step);
      else setState("done");
    };
    requestAnimationFrame(step);
  }, [show]);

  useEffect(() => {
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    if (!section || !canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setState("still");
      return;
    }

    const set = window.matchMedia("(min-width: 768px)").matches ? frames.lg : frames.sm;
    canvas.width = set.size;
    canvas.height = set.size;
    // Words wait for the film. Before this runs, --p is 1 (see globals.css), so without the script the
    // whole headline shows.
    section.style.setProperty("--p", "0");

    let cancelled = false;
    let loaded = false;
    let onScreen = false;
    let played = false;
    let patience: ReturnType<typeof setTimeout> | undefined;

    const startIfReady = () => {
      if (played || !loaded || !onScreen || cancelled) return;
      played = true;
      clearTimeout(patience);
      play();
    };

    const load = async () => {
      setState((current) => (current === "idle" ? "loading" : current));
      const images: HTMLImageElement[] = new Array(set.count);
      let next = 0;
      const worker = async () => {
        while (next < set.count && !cancelled) {
          const index = next++;
          const image = new Image();
          image.src = `${set.path}/${String(index).padStart(3, "0")}.webp`;
          try {
            await image.decode();
          } catch {
            // A missing frame is replaced by the one before it, so the film still runs.
          }
          images[index] = image;
        }
      };
      await Promise.all(Array.from({ length: PARALLEL }, worker));
      if (cancelled) return;
      for (let i = 1; i < images.length; i++) if (!images[i]?.naturalWidth) images[i] = images[i - 1]!;
      imagesRef.current = images;
      loaded = true;
      startIfReady();
    };

    // Start downloading at the first sign the visitor is heading down the page.
    let loadingStarted = false;
    const startLoading = () => {
      if (loadingStarted) return;
      loadingStarted = true;
      window.removeEventListener("scroll", startLoading);
      void load();
    };
    window.addEventListener("scroll", startLoading, { passive: true });

    // Play when a good part of the section is on screen, so the visitor sees the start of the film.
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry || entry.intersectionRatio < 0.4 || onScreen) return;
        onScreen = true;
        startLoading();
        // If the frames are slow, show the still and the headline rather than an empty stage.
        patience = setTimeout(() => {
          if (!played) {
            played = true;
            setState("still");
            section.style.setProperty("--p", "1");
          }
        }, PATIENCE_MS);
        startIfReady();
      },
      { threshold: [0, 0.4, 0.6] },
    );
    observer.observe(section);

    return () => {
      cancelled = true;
      clearTimeout(patience);
      observer.disconnect();
      window.removeEventListener("scroll", startLoading);
    };
  }, [play]);

  return (
    <section
      ref={sectionRef}
      id="idea"
      aria-labelledby="idea-heading"
      data-state={state}
      className="intro-film relative scroll-mt-10 bg-sand"
    >
      <div className="flex min-h-[88svh] flex-col items-center justify-center gap-2 overflow-hidden px-6 pb-4 pt-16 sm:gap-0">
        {/* Real text, so it is read out, found by search and stays sharp at any size. */}
        <h2 id="idea-heading" className="display text-center text-[clamp(2.4rem,7.4vw,5.75rem)]">
          {WORDS.map((word, index) => (
            <span key={word.text}>
              <span className="intro-film-word" style={{ "--at": word.at } as React.CSSProperties}>
                {word.text}
              </span>
              {index === 1 ? <br /> : index < WORDS.length - 1 ? " " : null}
            </span>
          ))}
        </h2>
        <div className="relative aspect-square w-full max-w-[min(92vw,58svh)] sm:max-w-[min(80vw,64svh)]">
          {/* eslint-disable-next-line @next/next/no-img-element -- a fixed-size still under the canvas */}
          <img
            src={frames.poster}
            alt="The Book360 pin standing inside its ring"
            width={800}
            height={800}
            loading="lazy"
            className="intro-film-poster absolute inset-0 size-full"
          />
          <canvas ref={canvasRef} aria-hidden="true" className="intro-film-canvas absolute inset-0 size-full" />
        </div>
        <button
          type="button"
          onClick={play}
          className="intro-film-replay eyebrow mt-2 flex h-11 items-center gap-2 px-4 text-stone transition-colors hover:text-ink"
        >
          <span aria-hidden="true">↻</span> Play again
        </button>
      </div>
      {children}
    </section>
  );
}
