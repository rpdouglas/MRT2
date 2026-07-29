import { test, expect } from '../fixtures/emulator';
import AxeBuilder from '@axe-core/playwright';

/**
 * PROJ-91: automated WCAG 2.2 AA regression gate. Reuses the same
 * onboarded-user fixture as the other golden-path specs so routes wrapped in
 * PrivateRoute render their real content rather than redirecting to /login.
 * Vault-gated routes (Journal, Workbooks, Vitality) intentionally scan
 * whatever renders — the VaultGate PIN-entry screen itself is a real page
 * every user sees and needs to be accessible too, so this doesn't unlock
 * the vault first.
 */
const ROUTES = ['/dashboard', '/vitality', '/tools', '/games', '/games/craving-buster', '/workbooks', '/journal'];

for (const route of ROUTES) {
  test(`${route} has no WCAG 2.2 AA violations`, async ({ page }) => {
    await page.goto(route);
    // networkidle never fires here — Firestore's realtime listeners keep a
    // persistent connection open, so idle-network is the wrong signal for an
    // SPA like this one. Every route (including VaultGate's locked/setup
    // screens) renders at least one heading once ready, so wait for that
    // instead of a network-quiet window that will never come.
    await page.locator('h1, h2, h3').first().waitFor({ state: 'visible', timeout: 15_000 });

    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag22aa']).analyze();

    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });
}
