import { test, expect } from '@playwright/test';

// PROJ-90 / Production Readiness Audit Action #10: regression coverage for
// SEC-01 (PROJ-89), which gated the mockUser bypass behind
// import.meta.env.DEV. Runs against a real production build+preview via
// playwright.security.config.ts — the golden-path suite's dev-server-backed
// config would pass even if the fix were reverted.
test('mockUser URL param does not authenticate against a production build', async ({ page }) => {
  await page.goto('/admin?mockUser=admin');

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByText('Admin Tools', { exact: false })).toHaveCount(0);
});
