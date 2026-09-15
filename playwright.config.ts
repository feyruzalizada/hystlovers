import { defineConfig } from "@playwright/test";

const port = Number(process.env.E2E_PORT ?? 3210);

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  use: { baseURL: `http://localhost:${port}`, locale: "az-AZ" },
  webServer: {
    command: `cross-env NODE_OPTIONS=--no-deprecation next dev -p ${port}`,
    url: `http://localhost:${port}/az`,
    // SERVER_URL is Payload's CSRF origin: it has to match where the tests run.
    env: { SERVER_URL: `http://localhost:${port}` },
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
