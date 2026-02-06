import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  use: {
    baseURL: "http://localhost:9000",
    headless: true,
  },
  webServer: {
    command: "quasar dev -p 9000",
    port: 9000,
    reuseExistingServer: !process.env.CI,
  },
});
