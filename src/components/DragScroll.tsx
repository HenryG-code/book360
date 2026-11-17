"use client";

// A strip that scrolls sideways.
//
// On a phone, sideways scrolling by finger is built into the browser, so this component does nothing
// there: the less custom code runs on a phone, the fewer ways it can break. It only adds what a mouse
// lacks, which is dragging the strip by holding the button down, and arrow keys for the keyboard.

import { useRef } from "react";

export function DragScroll({ label, children }: { label: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{ startX: number; startScroll: number } | null>(null);

  return (
    <div
      ref={ref}
      role="group"
      aria-label={label}
      tabIndex={0}
      className="cursor-grab overflow-x-auto overscroll-x-contain [scrollbar-width:none] active:cursor-grabbing"
      onPointerDown={(event) => {
        if (event.pointerType !== "mouse" || !ref.current) return;
        drag.current = { startX: event.clientX, startScroll: ref.current.scrollLeft };
        ref.current.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        if (drag.current && ref.current) ref.current.scrollLeft = drag.current.startScroll - (event.clientX - drag.current.startX);
      }}
      onPointerUp={() => (drag.current = null)}
      onPointerCancel={() => (drag.current = null)}
      onKeyDown={(event) => {
        if (!ref.current || (event.key !== "ArrowLeft" && event.key !== "ArrowRight")) return;
        event.preventDefault();
        ref.current.scrollBy({ left: event.key === "ArrowRight" ? 160 : -160, behavior: "smooth" });
      }}
    >
      {children}
    </div>
  );
}
