// Times a deployed copy of the site from this computer: how long each kind of page takes, and how the
// search page holds up when several requests arrive at once.
//
// Run with: npm run bench:live -- https://book360.vercel.app
//
// Be gentle: this sends a few hundred requests in total. Only point it at a deployment you own.
// Numbers include the trip across the internet from wherever this runs, so they are lab numbers for
// one location, not what every visitor sees.

import { performance } from "node:perf_hooks";

const base = (process.argv[2] ?? "").replace(/\/$/, "");
if (!/^https?:\/\//.test(base)) {
  console.error("Usage: npm run bench:live -- https://your-deployment.example");
  process.exit(1);
}

const SAMPLES = 15;
const percentile = (values, p) => [...values].sort((a, b) => a - b)[Math.min(values.length - 1, Math.floor(values.length * p))];

/** Time to the first byte of the response and to the last, plus where Vercel served it from. */
async function timed(path, init) {
  const start = performance.now();
  const response = await fetch(base + path, { redirect: "manual", ...init });
  const firstByte = performance.now() - start;
  await response.arrayBuffer();
  return {
    status: response.status,
    firstByte,
    total: performance.now() - start,
    cache: response.headers.get("x-vercel-cache") ?? "-",
    // Looks like "cpt1::iad1::abc": the edge that answered, then the region a server function ran in.
    route: (response.headers.get("x-vercel-id") ?? "").split("::").slice(0, -1).join(" > "),
  };
}

// A real stay address from the catalogue, picked from a page far into the results.
const searchHtml = await (await fetch(`${base}/stays?page=60`)).text();
const generated = searchHtml.match(/\/stays\/[a-z-]+-\d+/)?.[0] ?? "/stays/cliffside-suite";

const checkIn = new Date(Date.now() + 400 * 86_400_000).toISOString().slice(0, 10);
const checkOut = new Date(Date.now() + 402 * 86_400_000).toISOString().slice(0, 10);

const cases = [
  ["Home (built ahead)", "/"],
  ["Featured stay (built ahead)", "/stays/cliffside-suite"],
  ["Generated stay (built on first visit)", generated],
  ["Search, no filter (server)", "/stays"],
  ["Search, 3 filters, sorted (server)", "/stays?region=Whale+Coast&type=House&guests=4&sort=price-asc"],
  ["Search, last page (server)", "/stays?page=100"],
  [
    "Booking price check (server)",
    "/api/bookings",
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug: "glass-house", checkIn, checkOut, guests: 1 }) },
  ],
];

console.log(`Target: ${base}\n`);
console.log("| Request | First byte, median | First byte, slowest of " + SAMPLES + " | Served from | Cache |");
console.log("|---|---|---|---|---|");
for (const [label, path, init] of cases) {
  const runs = [];
  for (let i = 0; i < SAMPLES; i++) runs.push(await timed(path, init));
  const firstBytes = runs.map((run) => run.firstByte);
  const last = runs.at(-1);
  const statuses = [...new Set(runs.map((run) => run.status))].join(",");
  console.log(
    `| ${label}${statuses === "200" || statuses === "201" ? "" : ` (HTTP ${statuses})`} | ${percentile(firstBytes, 0.5).toFixed(0)} ms | ${Math.max(...firstBytes).toFixed(0)} ms | ${last.route || "-"} | ${last.cache} |`,
  );
}

// Several visitors at once: 10 requests in flight at a time, 100 in total.
const CONCURRENCY = 10;
const TOTAL = 100;
const times = [];
let failures = 0;
let next = 0;
const wallStart = performance.now();
await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    while (next < TOTAL) {
      const index = next++;
      try {
        const run = await timed(`/stays?page=${(index % 100) + 1}`);
        if (run.status !== 200) failures++;
        times.push(run.firstByte);
      } catch {
        failures++;
      }
    }
  }),
);
const wall = (performance.now() - wallStart) / 1000;
console.log(`\nSearch under load: ${TOTAL} requests, ${CONCURRENCY} at a time, ${wall.toFixed(1)} s in total.`);
console.log(
  `First byte: median ${percentile(times, 0.5).toFixed(0)} ms, 95th percentile ${percentile(times, 0.95).toFixed(0)} ms, slowest ${Math.max(...times).toFixed(0)} ms. Failures: ${failures}.`,
);
