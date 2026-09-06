import { test as authenticatedTest, expect } from '../fixtures/emulator';
import { test as publicTest } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * PROJ-91: automated WCAG 2.2 AA regression gate. Split into two route
 * groups (PROJ-117):
 *
 * - AUTHENTICATED_ROUTES uses the onboarded-user fixture (`../fixtures/emulator`,
 *   `auto: true` — every test signs up and lands on /dashboard before the
 *   test body runs) so routes wrapped in PrivateRoute render their real
 *   content rather than redirecting to /login. Vault-gated routes (Journal,
 *   Workbooks, Vitality) intentionally scan whatever renders — the
 *   VaultGate PIN-entry screen itself is a real page every user sees and
 *   needs to be accessible too, so this doesn't unlock the vault first.
 *
 * - PUBLIC_ROUTES uses a plain, unauthenticated Playwright test instead.
 *   `/` and `/login` both redirect an already-authenticated visitor away
 *   (Welcome.tsx and Login.tsx each have a `useEffect` that navigates to
 *   /dashboard or /profile once `user` is set) — scanning them with the
 *   onboarded-user fixture would silently axe-scan whatever they redirect
 *   to instead of the actual public page, a false pass found and fixed
 *   during PROJ-117's planning pass (docs/projects/117_TESTING_CI_GAP_REMEDIATION.md
 *   §6 Decision 1) before it could ship as the same bug PROJ-104 Phase 3's
 *   original route list would have introduced for /login.
 *
 * /admin is deliberately NOT included in AUTHENTICATED_ROUTES: AdminDashboard.tsx
 * redirects a non-admin user to /dashboard (`if (!isAdmin) return <Navigate
 * to="/dashboard" />`), and the onboarded-user fixture only ever creates a
 * plain, non-admin user — the same false-pass class as above. Covering it
 * for real needs a fixture that grants the Auth emulator's admin custom
 * claim before the route loads, which doesn't exist yet; tracked as a
 * follow-up rather than shipped with a silent false pass.
 */
const AUTHENTICATED_ROUTES = [
  '/dashboard',
  '/vitality',
  '/tools',
  '/games',
  '/games/craving-buster',
  '/workbooks',
  '/journal',
  '/tools/urge-surfer',
  '/profile',
  '/delete-account',
];

const PUBLIC_ROUTES = ['/', '/login'];

async function scanRoute(page: import('@playwright/test').Page, route: string) {
  await page.goto(route);
  // networkidle never fires here — Firestore's realtime listeners keep a
  // persistent connection open, so idle-network is the wrong signal for an
  // SPA like this one. Every route (including VaultGate's locked/setup
  // screens) renders at least one heading once ready, so wait for that
  // instead of a network-quiet window that will never come.
  await page.locator('h1, h2, h3').first().waitFor({ state: 'visible', timeout: 15_000 });

  // Guards against the exact false-pass class this file's header comment
  // describes: if a route silently redirected (stale session state, a
  // regression reintroducing an authenticated-visitor redirect on a public
  // route, etc.), fail loudly here instead of quietly scanning the wrong page.
  const actualPath = new URL(page.url()).pathname;
  expect(actualPath, `expected to still be on ${route} before scanning it, but was redirected to ${actualPath}`).toBe(route);

  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag22aa']).analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
}

for (const route of AUTHENTICATED_ROUTES) {
  authenticatedTest(`${route} has no WCAG 2.2 AA violations (authenticated)`, async ({ page }) => {
    await scanRoute(page, route);
  });
}

for (const route of PUBLIC_ROUTES) {
  publicTest(`${route} has no WCAG 2.2 AA violations (public, unauthenticated)`, async ({ page }) => {
    await scanRoute(page, route);
  });
}
