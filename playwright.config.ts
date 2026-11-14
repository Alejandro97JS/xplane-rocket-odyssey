import { defineConfig, devices } from '@playwright/test';

/** A port of its own, so the tests never collide with a server left running in development. */
const PORT = 3100;

/**
 * End-to-end and accessibility tests. They run against the production build,
 * served by the same server Railway runs, in the Chrome installed on the
 * machine.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  timeout: 60_000,
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chrome', use: { ...devices['Desktop Chrome'], channel: 'chrome' } }],
  webServer: {
    command: 'npm run build && npm start',
    url: `http://localhost:${PORT}/health`,
    env: { PORT: String(PORT) },
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
  },
});
