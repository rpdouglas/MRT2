import { describe, it, expect, afterEach } from 'vitest';
import { isAndroidTWA } from '../platform';

function setReferrer(value: string) {
  Object.defineProperty(document, 'referrer', {
    value,
    configurable: true,
  });
}

describe('isAndroidTWA', () => {
  afterEach(() => {
    setReferrer('');
    window.sessionStorage.clear();
  });

  it('returns true when the referrer is an android-app:// URI', () => {
    setReferrer('android-app://ca.myrecoverytoolkit.app');
    expect(isAndroidTWA()).toBe(true);
  });

  it('returns false for a normal https referrer', () => {
    setReferrer('https://www.google.com/');
    expect(isAndroidTWA()).toBe(false);
  });

  it('returns false for an empty referrer (direct navigation, desktop/iOS PWA)', () => {
    setReferrer('');
    expect(isAndroidTWA()).toBe(false);
  });

  // Regression guard: a real Play Store build showed the first in-session
  // purchase correctly using Play Billing, but the *next* visit to the
  // upgrade screen fell back to Stripe — caused by PremiumUpgrade.tsx's own
  // post-purchase `window.location.assign('/dashboard')` overwriting
  // document.referrer for the rest of that TWA session.
  it('stays true after a later same-origin navigation clears the referrer', () => {
    setReferrer('android-app://ca.myrecoverytoolkit.app');
    expect(isAndroidTWA()).toBe(true);

    // Simulate the full-page redirect: a fresh document load whose referrer
    // is now the app's own previous page, not the android-app:// intent.
    setReferrer('https://mrt2-app-prod.web.app/premium');
    expect(isAndroidTWA()).toBe(true);
  });

  it('does not cache a false reading as true for a plain browser session', () => {
    setReferrer('https://www.google.com/');
    expect(isAndroidTWA()).toBe(false);
    expect(isAndroidTWA()).toBe(false);
  });
});
