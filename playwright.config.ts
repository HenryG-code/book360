import { defineConfig, devices } from "@playwright/test";

// Playwright drives a real browser through the site, the way a visitor would.
//
// The tests run against the production build, not the dev server, because the two behave differently:
// the dev server fetches the tour's code early, and the production build is what visitors really get.
const PORT = 3220;

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  // `test.only` is handy while writing a test and a disaster if it reaches CI, where it would skip the rest.
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    // Keeps a step-by-step recording of any test that fails, to open with `npx playwright show-trace`.
    trace: "retain-on-failure",
  },
  // Every test runs three times: at a desktop size, as a phone with a touch screen, and as a narrow phone.
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "phone", use: { ...devices["Pixel 7"] } },
    // The narrowest phones still in common use. Most visitors are on a phone, so the layout is held to this.
    { name: "small-phone", use: { ...devices["Pixel 7"], viewport: { width: 360, height: 740 } } },
  ],
  // Playwright builds and starts the site itself, then stops it when the tests finish.
  webServer: {
    command: `npm run build && npm run start -- --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
