import { test, expect } from '../fixtures/emulator';

/**
 * Golden Path 1 — The Gate Test.
 * Sign up, onboard (name + sobriety date), reach the Dashboard.
 * Verifies the full auth + onboarding-redirect chain in a real browser.
 */
test('a new user can sign up, onboard, and reach the Dashboard', async ({ page, onboardedUser }) => {
  await expect(page).toHaveURL(/\/dashboard/);

  // displayName only renders in AppShell's sidebar (closed by default on
  // mobile viewports) — open it to confirm onboarding data actually saved.
  await page.getByRole('button', { name: 'Open Menu' }).click();
  await expect(page.getByText(onboardedUser.displayName)).toBeVisible();
});
