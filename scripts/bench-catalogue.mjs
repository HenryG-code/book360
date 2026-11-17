// Measures how the catalogue copes as it grows: how long it takes to build, how much memory it holds
// and how long a search takes. It runs the catalogue code directly, with no web server, so the numbers
// show the data layer alone.
//
// Run with: npm run bench
//
// These are lab numbers from one machine. Use them to compare sizes with each other, not as promises.

import { performance } from "node:perf_hooks";

const SIZES = [2_400, 50_000, 200_000];

const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];

console.log("| Stays | Build | Memory | Lookup by address | Search, no filter | Search, 3 filters | Search, sorted by price |");
console.log("|---|---|---|---|---|---|---|");

for (const size of SIZES) {
  // The size is read once when the module loads, so each size gets a fresh copy of the module.
  process.env.BOOK360_CATALOGUE_SIZE = String(size);
  globalThis.gc?.();
  const before = process.memoryUsage().heapUsed;
  const start = performance.now();
  const { repository } = await import(`../src/catalogue/repository.ts?size=${size}`);
  const buildMs = performance.now() - start;
  globalThis.gc?.();
  const memoryMb = (process.memoryUsage().heapUsed - before) / 1_048_576;

  const time = async (run) => {
    const samples = [];
    for (let i = 0; i < 25; i++) {
      const t = performance.now();
      await run(i);
      samples.push(performance.now() - t);
    }
    return median(samples);
  };

  const last = (await repository.search({ page: 999_999 })).items.at(-1);
  const lookup = await time(() => repository.get(last.slug));
  const plain = await time((i) => repository.search({ page: i + 1 }));
  const filtered = await time(() => repository.search({ region: "Whale Coast", type: "House", guests: 4 }));
  const sorted = await time(() => repository.search({ sort: "price-asc" }));

  const ms = (value) => (value < 0.01 ? "under 0.01 ms" : `${value.toFixed(2)} ms`);
  console.log(
    `| ${size.toLocaleString("en-US")} | ${buildMs.toFixed(0)} ms | ${memoryMb.toFixed(0)} MB | ${ms(lookup)} | ${ms(plain)} | ${ms(filtered)} | ${ms(sorted)} |`,
  );
}
