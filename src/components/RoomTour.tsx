"use client";

// The 360 tour. This is the only client component in the prototype, and the only place the Marzipano
// library is referenced. It is fetched with a dynamic import after the visitor clicks, so a page that
// nobody opens the tour on never downloads the viewer or the panorama.

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { RectilinearView, Viewer } from "marzipano";
import type { Photo, Tour } from "@/data/listings";

// poster      nothing loaded yet, only a normal image and a button
// loading     visitor clicked; viewer code and panorama are downloading
// ready       the tour is interactive
// unsupported this browser has no WebGL, so the tour cannot run here
// failed      WebGL exists but the download or the viewer broke
type Status = "poster" | "loading" | "ready" | "unsupported" | "failed";

type Measurement = { loadMs: number; panoramaKb: number | null };

const STEP = Math.PI / 12; // 15 degrees per key press or button press

/** True when the browser can create a WebGL context. `?webgl=off` forces false, to test the fallback. */
function hasWebGL(): boolean {
  if (new URLSearchParams(window.location.search).get("webgl") === "off") return false;
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl") ?? canvas.getContext("experimental-webgl"));
  } catch {
    return false;
  }
}

/** Download the panorama first, so a missing or broken file is a clean error rather than a black box. */
function preload(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve();
    image.onerror = () => reject(new Error(`Could not load ${url}`));
    image.src = url;
  });
}

type Props = {
  tour: Tour;
  poster: Photo;
  name: string;
  /** Where the photograph came from. Written by the page, so this file holds no listing data. */
  about: React.ReactNode;
};

export function RoomTour({ tour, poster, name, about }: Props) {
  const [status, setStatus] = useState<Status>("poster");
  const [measurement, setMeasurement] = useState<Measurement | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const viewRef = useRef<RectilinearView | null>(null);
  const openButtonRef = useRef<HTMLButtonElement>(null);

  const open = () => setStatus(hasWebGL() ? "loading" : "unsupported");

  const close = useCallback(() => {
    viewerRef.current?.destroy();
    viewerRef.current = null;
    viewRef.current = null;
    setStatus("poster");
    // Return focus to where the visitor came from, so keyboard users are not dropped at the page top.
    requestAnimationFrame(() => openButtonRef.current?.focus());
  }, []);

  // Runs once the stage element exists on the page (status "loading" renders it).
  useEffect(() => {
    if (status !== "loading") return;
    let cancelled = false;
    const started = performance.now();

    (async () => {
      try {
        const [{ default: Marzipano }] = await Promise.all([import("marzipano"), preload(tour.panorama)]);
        if (cancelled || !stageRef.current) return;

        const viewer = new Marzipano.Viewer(stageRef.current, { controls: { mouseViewMode: "drag" } });
        // Stop the visitor zooming in past the real pixels, and cap the field of view at 100 degrees.
        const limiter = Marzipano.RectilinearView.limit.traditional(tour.width, (100 * Math.PI) / 180);
        const view = new Marzipano.RectilinearView({ yaw: (tour.startYaw * Math.PI) / 180, pitch: 0, fov: Math.PI / 2 }, limiter);
        const scene = viewer.createScene({
          source: Marzipano.ImageUrlSource.fromString(tour.panorama),
          geometry: new Marzipano.EquirectGeometry([{ width: tour.width }]),
          view,
        });
        scene.switchTo({ transitionDuration: 0 });

        viewerRef.current = viewer;
        viewRef.current = view;

        // The browser records how many bytes each download really used. Zero means it came from cache.
        const entry = performance
          .getEntriesByType("resource")
          .filter((item): item is PerformanceResourceTiming => item.name.endsWith(tour.panorama))
          .at(-1);
        setMeasurement({
          loadMs: Math.round(performance.now() - started),
          panoramaKb: entry && entry.transferSize > 0 ? Math.round(entry.transferSize / 1024) : null,
        });
        setStatus("ready");
      } catch (error) {
        console.error("Room tour failed to start", error);
        if (!cancelled) setStatus("failed");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [status, tour]);

  // Free the WebGL context if the visitor leaves the page with the tour open.
  useEffect(() => () => viewerRef.current?.destroy(), []);

  const turn = (yaw: number, pitch: number) => {
    const view = viewRef.current;
    if (!view) return;
    view.setYaw(view.yaw() + yaw);
    view.setPitch(Math.max(-Math.PI / 2, Math.min(Math.PI / 2, view.pitch() + pitch)));
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-STEP, 0],
      ArrowRight: [STEP, 0],
      ArrowUp: [0, -STEP],
      ArrowDown: [0, STEP],
    };
    const move = moves[event.key];
    if (move) {
      event.preventDefault();
      turn(...move);
    } else if (event.key === "Escape") {
      close();
    }
  };

  if (status === "unsupported" || status === "failed") {
    return (
      <div role="status" className="border-l border-navy bg-sand p-8 text-sm leading-relaxed">
        <p className="font-medium">
          {status === "unsupported"
            ? "The 360° tour cannot run in this browser."
            : "The 360° tour did not load."}
        </p>
        <p className="mt-1 text-stone">
          The <a href="#photos" className="underline">photos below</a> show the same room, and you can still reserve.
        </p>
        {status === "failed" ? (
          <button type="button" onClick={open} className="mt-4 border-b border-ink pb-0.5 text-xs font-medium uppercase tracking-[0.2em]">
            Try again
          </button>
        ) : null}
      </div>
    );
  }

  if (status === "poster") {
    return (
      <div className="relative aspect-[4/3] overflow-hidden bg-navy sm:aspect-[16/9]">
        <Image src={poster.src} alt={poster.alt} fill priority sizes="(min-width: 1280px) 1200px, 100vw" className="object-cover" />
        <div className="on-dark absolute inset-0 flex flex-col items-center justify-center gap-5 bg-navy-deep/30">
          <span aria-hidden="true" className="flex size-20 items-center justify-center rounded-full border border-white/70 text-sm tracking-[0.15em] text-white">
            360°
          </span>
          <button
            ref={openButtonRef}
            type="button"
            onClick={open}
            className="eyebrow bg-white px-9 py-4 text-ink transition-opacity hover:opacity-85"
          >
            Open 360° tour<span className="sr-only"> of {name}</span>
          </button>
        </div>
      </div>
    );
  }

  const control = "flex h-11 w-11 items-center justify-center bg-white/90 text-lg text-ink";

  return (
    <div>
      <div
        role="application"
        aria-label={`360° tour of ${name}. Use the arrow keys to look around and Escape to close.`}
        tabIndex={0}
        onKeyDown={onKeyDown}
        className="on-dark relative aspect-[4/3] overflow-hidden bg-navy sm:aspect-[16/9]"
      >
        <div ref={stageRef} className="absolute inset-0" />
        {status === "loading" ? (
          <p role="status" className="absolute inset-0 flex items-center justify-center text-sm text-white">
            Loading the tour…
          </p>
        ) : (
          <>
            <div className="absolute bottom-3 left-3 flex gap-1">
              <button type="button" className={control} onClick={() => turn(-STEP, 0)} aria-label="Look left">←</button>
              <button type="button" className={control} onClick={() => turn(0, -STEP)} aria-label="Look up">↑</button>
              <button type="button" className={control} onClick={() => turn(0, STEP)} aria-label="Look down">↓</button>
              <button type="button" className={control} onClick={() => turn(STEP, 0)} aria-label="Look right">→</button>
            </div>
            <button
              type="button"
              onClick={close}
              className="absolute right-3 top-3 bg-white/90 px-4 py-3 text-xs font-medium uppercase tracking-[0.2em] text-ink"
            >
              Close tour
            </button>
          </>
        )}
      </div>
      <p className="mt-5 max-w-3xl border-l border-navy pl-5 text-sm leading-relaxed text-stone">
        <strong className="font-medium text-ink">About this tour.</strong> {about}
      </p>
      {measurement ? (
        <p className="mt-2 text-xs text-stone">
          Prototype measurement: tour ready in {measurement.loadMs} ms
          {measurement.panoramaKb === null ? ", panorama served from cache" : `, panorama ${measurement.panoramaKb} KB transferred`}.
        </p>
      ) : null}
    </div>
  );
}
