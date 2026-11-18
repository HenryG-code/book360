"use client";

// When a stay has more than one 360-degree photograph (a bedroom and a bathroom, say), this shows a
// row of tabs above the tour, one per photograph. Choosing a tab swaps the tour below it.
//
// The `key` on RoomTour matters: a new key makes React throw the old viewer away and start a fresh one,
// so the previous panorama's WebGL context is released rather than left running behind the new one.

import { useState } from "react";
import { RoomTour } from "@/components/RoomTour";
import type { Photo, Tour } from "@/data/listings";

export type TourChoice = { label: string; tour: Tour; poster: Photo; about: React.ReactNode };

export function TourSwitcher({ choices, name }: { choices: TourChoice[]; name: string }) {
  const [active, setActive] = useState(0);
  const choice = choices[active]!;

  return (
    <div>
      {choices.length > 1 ? (
        <div role="tablist" aria-label="Choose a room to look around" className="mb-4 flex flex-wrap gap-2">
          {choices.map((item, index) => (
            <button
              key={item.label}
              type="button"
              role="tab"
              aria-selected={index === active}
              onClick={() => setActive(index)}
              className={`eyebrow h-11 rounded-full border px-5 transition-colors ${
                index === active ? "border-navy bg-navy text-white" : "border-ink/20 hover:bg-sand"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
      <div role={choices.length > 1 ? "tabpanel" : undefined}>
        <RoomTour key={choice.label} tour={choice.tour} poster={choice.poster} name={`${name}, ${choice.label.toLowerCase()}`} about={choice.about} />
      </div>
    </div>
  );
}
