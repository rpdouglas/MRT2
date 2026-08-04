import { test as base } from '@playwright/test';
import { test } from '../fixtures/emulator';

/**
 * Narrow-viewport (iPhone SE, 320x568) screenshot capture — no assertions,
 * just guards against someone deleting this without noticing and gives a
 * quick manual-review artifact for every reader in e2e/_screens/*.png.
 * Added 2026-08-03 closing the governance remediation plan's Phase 3 320px
 * check for PROJ-90/96/98's surfaces; also still relevant to ACTIVE_CYCLE's
 * open PROJ-79 Daily Crossword 320px gap, though it doesn't cover Crossword
 * itself yet.
 */
test.use({ viewport: { width: 320, height: 568 } });
base.use({ viewport: { width: 320, height: 568 } });

// Unauthenticated (`base`, not the onboardedUser-fixture `test`, which is
// auto:true and would sign a user in before the test body even runs) —
// these two represent the logged-out first-time visitor experience.
base('welcome screen at 320px (unauthenticated)', async ({ page }) => {
  await page.goto('/');
  await page.getByText('Meet the Toolkit').waitFor({ state: 'visible', timeout: 15_000 });
  await page.screenshot({ path: 'e2e/_screens/welcome-320.png', fullPage: true });
});

base('login screen at 320px (unauthenticated)', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('button', { name: 'Sign In Securely' }).waitFor({ state: 'visible', timeout: 15_000 });
  await page.screenshot({ path: 'e2e/_screens/login-320.png', fullPage: true });
});

test('dashboard at 320px', async ({ page }) => {
  await page.goto('/dashboard');
  await page.getByText('My Dashboard').waitFor({ state: 'visible', timeout: 15_000 });
  await page.screenshot({ path: 'e2e/_screens/dashboard-320.png', fullPage: true });
});

test('tasks at 320px', async ({ page }) => {
  await page.goto('/tasks');
  await page.getByText('My Tasks').waitFor({ state: 'visible', timeout: 15_000 });
  await page.screenshot({ path: 'e2e/_screens/tasks-320.png', fullPage: true });
});

// This user has no vault PIN yet, so any vault-gated route (Journal,
// Workbooks, Vitality, Tools) renders VaultGate's PIN-setup screen instead
// of the route's real content — that's still a real screen every new user
// sees, so it's a legitimate 320px check in its own right.
test('vault PIN setup screen at 320px', async ({ page }) => {
  await page.goto('/tools/personify');
  await page.getByText('Create Recovery Vault').waitFor({ state: 'visible', timeout: 15_000 });
  await page.screenshot({ path: 'e2e/_screens/vault-setup-320.png', fullPage: true });
});
