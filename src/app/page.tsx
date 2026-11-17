import Image from "next/image";
import Link from "next/link";
import { Mark } from "@/components/Mark";
import { DragScroll } from "@/components/DragScroll";
import { SiteHeader } from "@/components/SiteHeader";
import { repository } from "@/catalogue/repository";
import { formatMoney, rooms } from "@/data/listings";

// A server component: this page is rendered to HTML on the server and ships no viewer code at all.
// The 360 tour lives on the stay page and is only downloaded after a click there.
//
// The page is a sequence of bands that alternate between text on a plain background and a large
// photograph. That alternation is what gives a long page a rhythm instead of one endless list.

const steps = [
  { title: "Browse", text: "Pick a stay. Its photos and its price are on the page straight away." },
  { title: "Look Around", text: "Open the 360° tour and turn in any direction, by mouse, touch or keyboard." },
  { title: "Reserve", text: "Go to booking whenever you like. In this demo nothing is charged or held." },
];

const questions = [
  {
    q: "Are these real places to stay?",
    a: "No. The stays, their names and their prices are invented for this demo. The photographs are of real rooms, released into the public domain, and those rooms are not connected to this site.",
  },
  {
    q: "Can I actually book a room?",
    a: "No. The booking page is a placeholder. Nothing is reserved and no payment is ever taken.",
  },
  {
    q: "What if the 360° tour does not open?",
    a: "The tour needs a browser feature called WebGL. Without it you see a short message, the photos stay on the page and the Reserve button still works.",
  },
  {
    q: "Why does the tour take a moment to open?",
    a: "The viewer and the panorama are downloaded only when you ask for them. Everyone who never opens a tour gets a lighter, faster page.",
  },
  {
    q: "Where do the photographs come from?",
    a: "From Poly Haven, under the CC0 public domain dedication. Each one is listed on the photo credits page.",
  },
];

/** A key as it looks on a keyboard. Real controls are more convincing than a drawing of a keyboard. */
function Key({ children, wide = false }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <kbd
      className={`flex h-11 items-center justify-center rounded-md border border-ink/20 bg-white font-sans text-sm shadow-[0_2px_0_0_rgb(11_16_20/0.15)] ${
        wide ? "px-3.5" : "w-11"
      }`}
    >
      {children}
    </kbd>
  );
}

export default async function HomePage() {
  const [listings, total] = await Promise.all([repository.featured(), repository.count()]);
  const featured = listings[0]!;
  const count = new Intl.NumberFormat("en-ZA").format(total);
  const pictures = rooms.length + 1; // every room photograph, plus the home page one

  return (
    <main>
      {/* 1. Hero: one photograph, one sentence. */}
      <section className="relative flex min-h-[calc(100svh-2rem)] items-center justify-center overflow-hidden bg-navy-deep">
        <SiteHeader overlay />
        <Image src="/media/home-hero.jpg" alt="" fill priority sizes="100vw" className="parallax object-cover" />
        {/* A blue wash deepens the pale sky so white text stays readable on it. */}
        <div className="absolute inset-0 bg-gradient-to-b from-navy-deep/70 via-navy/35 to-navy-deep/55" />
        <div className="on-dark relative px-6 pb-10 text-center text-white">
          <h1 className="display rise text-[clamp(2.2rem,10.2vw,7.25rem)]">
            Know the Room
            <br />
            Before You Book
          </h1>
          <a href="#idea" className="eyebrow rise mt-8 inline-block p-4 [animation-delay:150ms]">
            Scroll to explore
          </a>
        </div>
        <span aria-hidden="true" className="absolute bottom-0 left-1/2 h-20 w-px bg-white/70" />
      </section>

      {/* 2. The idea, fading into a wide photograph with one stay picked out. */}
      <section id="idea" className="scroll-mt-10 bg-sand">
        <div className="reveal mx-auto max-w-2xl px-6 pb-16 pt-28 text-center lg:pt-36">
          <h2 className="display text-5xl sm:text-6xl lg:text-7xl">Look Around First, Decide After</h2>
          <Mark className="mx-auto mt-10 size-7 text-navy" />
          <p className="mx-auto mt-10 max-w-md text-[0.9375rem] leading-relaxed text-stone">
            A handful of photos shows a room at its best angle. A 360° tour shows the rest: the corner behind
            the door, the view from the bed, how far the desk is from the window.
          </p>
          <p className="mx-auto mt-5 max-w-md text-[0.9375rem] leading-relaxed text-stone">
            Every stay here has both, taken from one photograph, so what you see in the gallery is exactly what
            you find in the tour.
          </p>
        </div>
        <div className="relative">
          <div className="relative aspect-[4/5] sm:aspect-[16/9]">
            <Image src="/media/home-coast.jpg" alt="" fill sizes="100vw" className="object-cover" />
            {/* The sand colour dissolves into the sky, so the text band and the photograph read as one. */}
            <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-sand to-transparent" />
          </div>
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            <article className="reveal relative -mt-56 ml-auto w-full max-w-xs bg-paper p-5 shadow-2xl shadow-navy-deep/25 sm:-mt-72 lg:-mt-80 lg:mr-16">
              <h3 className="display text-center text-2xl">{featured.name}</h3>
              <div className="relative mt-4 aspect-[4/3]">
                <Image src={featured.photos[0].src} alt={featured.photos[0].alt} fill sizes="320px" className="object-cover" />
              </div>
              <p className="mt-4 text-center text-[0.8125rem] leading-relaxed text-stone">{featured.summary}</p>
              <p className="mt-5 text-center">
                <Link href={`/stays/${featured.slug}`} aria-label={`Take the tour: ${featured.name}`} className="text-link">
                  Take the tour
                </Link>
              </p>
            </article>
          </div>
          <div className="h-16 bg-sand sm:h-24" />
        </div>
      </section>

      {/* 3. Three photographs edge to edge, one from each stay. */}
      <div className="grid grid-cols-3 bg-sand">
        {listings.map((listing) => (
          <div key={listing.slug} className="relative aspect-[3/4] sm:aspect-[4/3]">
            <Image src={listing.photos[1].src} alt={listing.photos[1].alt} fill sizes="34vw" className="object-cover" />
          </div>
        ))}
      </div>

      {/*
        4. What a visitor gets. A grid of unequal cards, each showing the real thing rather than a
        symbol of it: the photograph itself, the actual numbers, the actual keys.
      */}
      <section className="bg-sand px-6 pb-24 pt-20 lg:px-10 lg:pb-36 lg:pt-32">
        <div className="reveal mx-auto max-w-3xl text-center">
          <p className="eyebrow text-stone">What you get</p>
          <h2 className="display mt-6 text-4xl sm:text-6xl">More Than a Handful of Photos</h2>
        </div>

        <ul className="mx-auto mt-14 grid max-w-7xl gap-4 sm:grid-cols-2 lg:mt-20 lg:grid-cols-12 lg:gap-5">
          {/* The tour: the unwrapped panorama, so the visitor sees what one 360 photograph really is. */}
          <li className="reveal on-dark flex flex-col bg-navy text-white sm:col-span-2 lg:col-span-8">
            <div className="p-7 sm:p-10">
              <p className="eyebrow text-white/60">01 · The tour</p>
              <h3 className="display mt-4 text-3xl sm:text-5xl">One Photograph, the Whole Room</h3>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-white/75">
                This strip is a single 360° photograph laid flat. In the tour it wraps around you, and you
                turn to look at any part of it.
              </p>
            </div>
            {/*
              The strip is wider than its frame, so there is always more to one side. Drag it, swipe it or
              use the arrow keys: a small taste of turning around in the tour.
            */}
            <div className="relative mt-auto">
              <DragScroll label="A 360° photograph laid flat. Drag or use the arrow keys to look along it.">
                <div className="relative aspect-[25/7] w-[260%] sm:w-[170%]">
                  <Image
                    src="/media/glass-house-strip.jpg"
                    alt="A 360° photograph of the Glass House laid flat: bed, windows, dining table and fireplace side by side in one wide strip"
                    fill
                    sizes="(min-width: 1024px) 110vw, 260vw"
                    className="pointer-events-none select-none object-cover"
                  />
                </div>
              </DragScroll>
              <span className="pointer-events-none absolute left-4 top-4 bg-white/90 px-3 py-1.5 text-[0.6875rem] font-medium tracking-[0.18em] text-ink">
                ← Drag to look along →
              </span>
            </div>
          </li>

          {/* Matching photos: a gallery picture, which is a piece cut from that same strip. */}
          <li className="reveal relative min-h-80 overflow-hidden sm:col-span-2 lg:col-span-4">
            <Image
              src={listings[1]!.photos[0].src}
              alt={listings[1]!.photos[0].alt}
              fill
              sizes="(min-width: 1024px) 34vw, 100vw"
              className="object-cover"
            />
            <div className="on-dark absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy-deep/90 via-navy-deep/60 to-transparent p-7 pt-24 text-white sm:p-8 sm:pt-28">
              <p className="eyebrow text-white/70">02 · The photos</p>
              <h3 className="display mt-3 text-3xl">Cut From the Same Shot</h3>
              <p className="mt-3 text-sm leading-relaxed text-white/80">
                Gallery pictures are pieces of the tour, so the two always agree.
              </p>
            </div>
          </li>

          {/* Loads on request: the real figure. */}
          <li className="reveal flex flex-col bg-paper p-7 sm:p-8 lg:col-span-3">
            <p className="eyebrow text-stone">03 · Speed</p>
            <p className="display mt-6 text-6xl text-navy">
              0 <span className="text-3xl">KB</span>
            </p>
            <h3 className="display mt-6 text-2xl lg:mt-auto lg:pt-6">Loads on Request</h3>
            <p className="mt-2 text-sm leading-relaxed text-stone">
              Nothing for the tour is downloaded until you open it.
            </p>
          </li>

          {/* Keyboard: the actual keys. */}
          <li className="reveal flex flex-col bg-paper p-7 sm:p-8 lg:col-span-3">
            <p className="eyebrow text-stone">04 · Controls</p>
            <div aria-hidden="true" className="mt-6 flex items-end gap-1.5">
              <Key>←</Key>
              <div className="flex flex-col gap-1.5">
                <Key>↑</Key>
                <Key>↓</Key>
              </div>
              <Key>→</Key>
              <span className="ml-3">
                <Key wide>Esc</Key>
              </span>
            </div>
            <h3 className="display mt-6 text-2xl lg:mt-auto lg:pt-6">Touch, Mouse or Keys</h3>
            <p className="mt-2 text-sm leading-relaxed text-stone">
              Drag to look around, or use the arrow keys. Escape closes the tour.
            </p>
          </li>

          {/* Fallback: what still works, as a checklist. */}
          <li className="reveal flex flex-col bg-paper p-7 sm:p-8 lg:col-span-3">
            <p className="eyebrow text-stone">05 · Fallback</p>
            <ul className="mt-6 space-y-2.5 text-sm">
              <li className="flex items-center justify-between border-b border-ink/10 pb-2.5 text-stone line-through">
                360° tour <span aria-hidden="true" className="no-underline">—</span>
              </li>
              <li className="flex items-center justify-between border-b border-ink/10 pb-2.5">
                Photos <span aria-hidden="true" className="text-ocean">✓</span>
              </li>
              <li className="flex items-center justify-between">
                Booking <span aria-hidden="true" className="text-ocean">✓</span>
              </li>
            </ul>
            <h3 className="display mt-6 text-2xl lg:mt-auto lg:pt-6">Always a Way Through</h3>
            <p className="mt-2 text-sm leading-relaxed text-stone">
              If your device cannot run the tour, everything else still works.
            </p>
          </li>

          {/* Sources. */}
          <li className="reveal on-dark flex flex-col bg-ocean p-7 text-white sm:p-8 lg:col-span-3">
            <p className="eyebrow text-white">06 · Sources</p>
            <p className="display mt-6 text-6xl">
              {pictures} <span className="text-3xl">of {pictures}</span>
            </p>
            <h3 className="display mt-6 text-2xl lg:mt-auto lg:pt-6">Every Picture Credited</h3>
            <p className="mt-2 text-sm leading-relaxed text-white">
              Every photograph on the site has a named source.
            </p>
            <Link href="/credits" className="text-link self-start">
              See the credits
            </Link>
          </li>
        </ul>
      </section>

      {/* 5. The stays. A large photograph with a dark panel laid over its edge, sides alternating. */}
      <section id="stays" aria-labelledby="stays-heading" className="scroll-mt-10 bg-paper px-6 py-28 lg:px-10 lg:py-36">
        <div className="reveal mx-auto max-w-3xl text-center">
          <p className="eyebrow text-stone">The stays</p>
          <h2 id="stays-heading" className="display mt-6 text-5xl sm:text-6xl">
            Three to Start With
          </h2>
        </div>
        <div className="mx-auto mt-20 max-w-7xl space-y-20 lg:mt-28 lg:space-y-32">
          {listings.map((listing, index) => {
            const flipped = index % 2 === 1;
            return (
              <article key={listing.slug} className="reveal group grid lg:grid-cols-12 lg:items-center">
                <div
                  className={`relative lg:col-span-8 lg:row-start-1 ${flipped ? "lg:col-start-5" : "lg:col-start-1"}`}
                >
                  <div className="relative aspect-[4/3] overflow-hidden lg:aspect-[5/4]">
                    <Image
                      src={listing.photos[0].src}
                      alt={listing.photos[0].alt}
                      fill
                      sizes="(min-width: 1024px) 66vw, 100vw"
                      className="object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-[1.04]"
                    />
                  </div>
                  <div
                    aria-hidden="true"
                    className={`absolute top-0 flex size-16 items-center justify-center bg-ocean text-white sm:size-24 ${
                      flipped ? "right-0" : "left-0"
                    }`}
                  >
                    <Mark className="size-7 sm:size-9" />
                  </div>
                </div>
                <div
                  className={`on-dark relative z-10 flex flex-col bg-navy p-8 text-white sm:p-12 lg:col-span-5 lg:row-start-1 lg:min-h-[34rem] ${
                    flipped ? "lg:col-start-1" : "lg:col-start-8"
                  }`}
                >
                  <p className="eyebrow text-white/60">
                    {listing.name} · {listing.location}
                  </p>
                  <h3 className="display mt-6 text-4xl sm:text-5xl">{listing.tagline}</h3>
                  <div className="mt-10 lg:mt-auto">
                    <p className="max-w-sm text-sm leading-relaxed text-white/75">{listing.summary}</p>
                    <p className="mt-5 text-sm text-white/90">
                      From {formatMoney(listing.nightlyRateMinor, listing.currency)} a night · 360° tour
                    </p>
                    {/* The label names the stay, so a screen reader does not hear three identical "View stay" links. */}
                    <Link href={`/stays/${listing.slug}`} aria-label={`View stay: ${listing.name}`} className="text-link mt-8">
                      View stay
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
        <div className="reveal mx-auto mt-20 max-w-xl text-center lg:mt-28">
          <p className="display text-3xl sm:text-4xl">And {count} More to Look Around</p>
          <Link href="/stays" className="eyebrow mt-8 inline-block bg-navy px-10 py-4 text-white transition-colors hover:bg-navy-deep">
            Browse all stays
          </Link>
        </div>
      </section>

      {/* 6. A full-width photograph with one line over it. */}
      <section className="relative flex min-h-[70svh] items-center justify-center overflow-hidden bg-navy-deep px-6">
        <Image src="/media/glass-house-valley.jpg" alt="" fill sizes="100vw" className="parallax object-cover" />
        <div className="absolute inset-0 bg-navy-deep/45" />
        <p className="display reveal on-dark relative max-w-3xl text-center text-4xl text-white sm:text-6xl lg:text-7xl">
          See Every Corner Before You Arrive
        </p>
      </section>

      {/* 7. How it works, as three cards. */}
      <section id="how" className="scroll-mt-10 bg-sand px-6 py-28 lg:px-10 lg:py-36">
        <div className="reveal mx-auto max-w-3xl text-center">
          <p className="eyebrow text-stone">How it works</p>
          <h2 className="display mt-6 text-5xl sm:text-6xl">Three Steps, No Surprises</h2>
        </div>
        <ol className="reveal mx-auto mt-16 grid max-w-6xl gap-6 md:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.title} className="bg-paper p-10 text-center">
              <p aria-hidden="true" className="display text-5xl text-sand-deep">
                0{index + 1}
              </p>
              <h3 className="display mt-6 text-2xl">{step.title}</h3>
              <p className="mx-auto mt-4 max-w-xs text-sm leading-relaxed text-stone">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* 8. Questions. <details> opens and closes without any JavaScript. */}
      <section id="questions" className="on-dark scroll-mt-10 bg-navy-deep px-6 py-28 text-white lg:py-36">
        <div className="reveal mx-auto max-w-3xl text-center">
          <p className="eyebrow text-white/55">Your questions</p>
          <h2 className="display mt-6 text-5xl sm:text-6xl">Asked Often, Answered Plainly</h2>
        </div>
        <div className="mx-auto mt-16 max-w-2xl border-t border-white/20">
          {questions.map((item, index) => (
            <details key={item.q} open={index === 0} className="group border-b border-white/20">
              <summary className="flex cursor-pointer items-center justify-between gap-6 py-6 text-[0.9375rem] font-medium">
                {item.q}
                <span aria-hidden="true" className="text-xl font-light transition-transform duration-300 group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="max-w-xl pb-7 text-sm leading-relaxed text-white/70">{item.a}</p>
            </details>
          ))}
          <p className="mt-10 text-center">
            <Link href="/credits" className="text-link">
              Photo credits
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
