import { defineConfig, devices } from "@playwright/test";

const baseURL = "http://127.0.0.1:3011";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  reporter: "line",
  use: {
    baseURL,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "desktop-chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-chromium",
      use: { ...devices["Pixel 7"] },
    },
  ],
  webServer: {
    command: "npx next dev --hostname 127.0.0.1 --port 3011",
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
