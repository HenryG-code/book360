import Link from "next/link";
import { Mark } from "@/components/Mark";

// A round "surprise me" button: the pin inside a ring that turns slowly, the 360 idea in motion. It
// opens a random stay, for visitors who would rather wander than search.
//
// The turning is pure CSS (.surprise-ring in globals.css) and stops for anyone who asks their device to
// reduce motion. The link goes to /stays/surprise, which picks the stay on the server, so a fresh
// pick happens on every click without any JavaScript here.

export function SurpriseButton({ overlay }: { overlay: boolean }) {
  const tone = overlay
    ? "border-white/30 bg-white/10 text-white hover:bg-white/20"
    : "border-ink/12 bg-white text-navy hover:bg-sand";
  return (
    <Link
      href="/stays/surprise"
      prefetch={false}
      aria-label="Surprise me: open a random room"
      title="Surprise me"
      className={`group relative flex size-11 items-center justify-center rounded-full border shadow-lg backdrop-blur-md transition-colors ${tone}`}
    >
      {/* A dashed ring that turns around the pin, speeding up on hover. */}
      <svg viewBox="0 0 44 44" fill="none" aria-hidden="true" className="surprise-ring absolute inset-0 size-full">
        <circle cx="22" cy="22" r="18.5" stroke="currentColor" strokeWidth="1.2" strokeDasharray="2 4.6" opacity="0.7" />
        <circle cx="22" cy="3.5" r="2.2" className="fill-ocean" />
      </svg>
      <Mark className="relative size-5" />
    </Link>
  );
}
