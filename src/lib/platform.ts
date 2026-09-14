/**
 * True only when running inside the Google Play–installed Trusted Web
 * Activity — not true for desktop/iOS PWA installs or a regular browser
 * tab, both of which are outside Play's Payments policy entirely.
 *
 * `document.referrer` only carries `android-app://...` on the document load
 * that Android's launch intent itself produced — Chrome never re-sets it on
 * a later same-origin navigation. Every full-page redirect this app makes
 * from inside the TWA (e.g. PremiumUpgrade.tsx's post-purchase
 * `window.location.assign('/dashboard')`) is exactly such a navigation, and
 * Android/Chrome keeps reusing the same tab across foreground/background —
 * so without caching, a real purchase's own success redirect silently
 * un-detects the TWA for the rest of that session, and every later visit to
 * the upgrade screen falls through to the Stripe flow instead (found via a
 * real Play Store build: the first purchase used Play Billing correctly,
 * but the next "Become a Supporter" click after the post-purchase redirect
 * showed Stripe). Caching the first true reading in `sessionStorage` fixes
 * this: it's per-tab and cleared when the tab/app fully closes, so it can't
 * leak into a plain browser session that never had the real referrer.
 *
 * That cache only helps if *something* calls this function during the
 * pristine referrer window, before any reload happens. Found a session
 * where it didn't: an already-authenticated user launches straight onto
 * `/dashboard` (this function has no caller there), accepts an in-app
 * update via `PWAUpdateBeacon.tsx` (which lives in `AppShell`, mounted only
 * on authenticated routes) — that update's own reload wipes the referrer
 * before anything ever cached it, so a later visit to `/premium` sees no
 * live referrer and no cached one either. Fixed by also calling this
 * eagerly in `main.tsx`, before React mounts and long before
 * `PWAUpdateBeacon` can exist to trigger that reload — see the comment
 * there. `Welcome.tsx`/`PremiumUpgrade.tsx`'s own calls stay in place too;
 * this function is idempotent so the extra calls are harmless.
 */
const SESSION_KEY = 'mrt_is_android_twa';

export function isAndroidTWA(): boolean {
  if (typeof document === 'undefined') return false;

  if (document.referrer.startsWith('android-app://')) {
    try { window.sessionStorage.setItem(SESSION_KEY, '1'); } catch { /* private mode / storage disabled */ }
    return true;
  }

  try {
    return window.sessionStorage.getItem(SESSION_KEY) === '1';
  } catch {
    return false;
  }
}
