import { test as base, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

export interface TestUser {
  email: string;
  password: string;
  displayName: string;
}

function uniqueUser(label: string): TestUser {
  const stamp = Date.now();
  return {
    email: `e2e-${label}-${stamp}@test.local`,
    password: 'GoldenPath123!',
    displayName: `E2E ${label}`,
  };
}

/**
 * Signs up a fresh emulator-only user, completes onboarding, and lands on
 * the Dashboard. Each golden-path test gets its own unique user (unique
 * timestamped email) so the three specs can run in parallel with zero
 * shared state or ordering dependency.
 */
async function signUpAndOnboard(page: Page, user: TestUser) {
  await page.goto('/login');
  await page.getByText('Create Account', { exact: true }).click();
  await page.getByPlaceholder('Email address').fill(user.email);
  // First password field is the account password; the "confirm" field only
  // renders in signup mode, matching Login.tsx's isLogin-gated form.
  await page.getByPlaceholder('Password', { exact: true }).fill(user.password);
  await page.getByPlaceholder('Confirm Password').fill(user.password);
  await page.getByRole('button', { name: 'Create Secure Account' }).click();

  // New user has no profile yet -> Login.tsx's redirect effect sends them
  // to /profile to complete onboarding, not /dashboard directly. Timeout is
  // generous (not just the ~14s solo baseline) because all three golden-path
  // specs run in parallel locally, sharing one dev server + emulator.
  await page.waitForURL('**/profile**', { timeout: 30_000 });
  await page.getByPlaceholder('How should we address you?').fill(user.displayName);
  await page.locator('input[type="date"]').first().fill('2026-01-01');
  await page.getByRole('button', { name: 'Complete Setup' }).click();

  await page.waitForURL('**/dashboard**', { timeout: 30_000 });
}

export const test = base.extend<{ onboardedUser: TestUser }>({
  // auto: true so every test using this fixture file gets a signed-up,
  // onboarded user without needing to remember to destructure
  // `onboardedUser` — a spec that forgets ends up unauthenticated against
  // a PrivateRoute page and times out with a confusing "element not found".
  onboardedUser: [async ({ page }, use) => {
    const user = uniqueUser(test.info().title.replace(/[^a-z0-9]+/gi, '-').toLowerCase());
    await signUpAndOnboard(page, user);
    await use(user);
  }, { auto: true }],
});

export { expect };
