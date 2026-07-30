import { defineConfig, devices } from "@playwright/test";

const port = 3100;
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  // Local runs share one next-start process; more workers than this saturate
  // it and asset-heavy pages (creative PNGs) start timing out on load.
  workers: process.env.CI ? undefined : 4,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "desktop-chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-chromium",
      use: {
        ...devices["Desktop Chrome"],
        deviceScaleFactor: 1,
        hasTouch: true,
        isMobile: true,
        viewport: { width: 375, height: 812 },
      },
    },
  ],
  webServer: {
    command: `sh -c "npm run build && npm run start -- --hostname 127.0.0.1 --port ${port}"`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
  },
});
