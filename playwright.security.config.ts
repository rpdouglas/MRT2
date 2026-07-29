import { defineConfig, devices } from '@playwright/test';

/**
 * SEC-01 regression check (PROJ-90): proves the mockUser client-side auth
 * bypass stays gated behind import.meta.env.DEV. Deliberately separate from
 * playwright.config.ts (PROJ-23's golden-path suite) — that suite's
 * webServer runs `npm run dev`, where DEV is always true, so it can't prove
 * anything about a production build. This one builds and serves the real
 * dist/ output instead. No Firebase emulators needed: an unauthenticated
 * redirect to /login is the only expected outcome under test.
 */
export default defineConfig({
  testDir: './e2e/security',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  timeout: 60_000,
  use: {
    baseURL: 'http://127.0.0.1:5176',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run build && npm run preview -- --port 5176 --strictPort',
    url: 'http://127.0.0.1:5176',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
