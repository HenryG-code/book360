import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { assetPage, heroCredit, rooms, type Credit } from "@/data/listings";

export const metadata: Metadata = { title: "Photo credits" };

// CC0 does not require credit. The page exists anyway, because a booking site that shows a room
// should always be able to say where the picture came from.
export default function CreditsPage() {
  const rows: { used: string; credit: Credit }[] = [
    { used: "Home page", credit: heroCredit },
    ...rooms.map((room) => ({ used: `${room.type} photograph`, credit: room.credit })),
  ];

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 pb-28 pt-20 lg:pt-28">
        <p className="eyebrow text-stone">Sources</p>
        <h1 className="display mt-6 text-6xl sm:text-7xl">Photo Credits</h1>
        <p className="mt-10 max-w-2xl text-[0.9375rem] leading-relaxed text-stone">
          Every picture on this site is a real photograph published by Poly Haven under the CC0 1.0 public
          domain dedication. Each was resized, and the gallery pictures were cut from the 360° photographs.
          The stays, their names and their prices are invented, and no photographer or place shown here is
          connected to this demo.
        </p>
        <ul className="mt-14 border-b border-ink/15">
          {rows.map(({ used, credit }) => (
            <li key={credit.asset} className="border-t border-ink/15 py-7">
              <p className="eyebrow text-stone">{used}</p>
              <p className="mt-3 text-[0.9375rem]">
                <a href={assetPage(credit)} className="underline" rel="noreferrer">
                  {credit.title}
                </a>{" "}
                by {credit.author}. {credit.licence}.
              </p>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
