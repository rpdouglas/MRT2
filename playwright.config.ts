import { defineConfig, devices } from '@playwright/test';

/**
 * E2E golden-path config (PROJ-23). Distinct from the ad-hoc Playwright
 * usage in scripts/generate_screenshots.js (PROJ-63), which drives mock-auth
 * screenshot capture, not real auth/Firestore flows against emulators.
 *
 * Run via `npm run test:e2e`, which wraps this with
 * `firebase emulators:exec` so Auth/Firestore/Functions emulators are
 * started fresh, torn down automatically, and never touch a real project.
 */
export default defineConfig({
  testDir: './e2e/golden-paths',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'list',
  // 60s (not the default 30s): the signup+onboarding fixture that runs before
  // every test takes ~10-15s on its own, and needs headroom for a slower
  // Firestore emulator round trip under parallel local runs.
  timeout: 60_000,
  use: {
    baseURL: 'http://127.0.0.1:5175',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://127.0.0.1:5175',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    env: {
      VITE_USE_EMULATORS: 'true',
    },
  },
});
