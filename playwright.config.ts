import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

// Same env as the app (.env.local), so helpers share PRODUCTS_IMPORT_TOKEN with the server
if (existsSync(".env.local")) process.loadEnvFile(".env.local");

// E2E tests always run against their own production build on port 3100, never
// the dev server on 3000. A production server has no on-demand compiling, so
// timings match a real deploy. The OpenAI key is blanked so tests never call
// the real model (no cost, deterministic "unavailable" summary state); Next.js
// does not override variables that are already set, even to an empty string.
const PORT = 3100;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  // Shared fixture products are imported once (global-setup.ts) and removed
  // with the test accounts afterwards (global-teardown.ts)
  globalSetup: "./e2e/global-setup.ts",
  globalTeardown: "./e2e/global-teardown.ts",
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // Playwright's API requests share one keep-alive socket pool per worker.
    // With Node's default 5 s keep-alive the server drops sockets idle between
    // tests, and a busy worker can reuse one just as it closes (ECONNRESET).
    // A run is shorter than this timeout, so idle sockets stay open.
    command: `pnpm build && pnpm start --port ${PORT} --keepAliveTimeout 120000`,
    url: BASE_URL,
    reuseExistingServer: false,
    timeout: 300_000,
    env: { OPENAI_API_KEY: "" },
  },
});
