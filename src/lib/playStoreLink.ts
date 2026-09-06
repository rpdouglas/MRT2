// PROJ-116: outbound-only Google Play install-referrer tagging.
//
// Scope note: this only tags the *outbound* Play Store URL so a persona
// label rides along in the standard `referrer` query param Play passes to
// the Install Referrer API on first launch. Reading that referrer at first
// app launch (to personalize the in-app first-run experience) is a native
// Android/TWA-side concern with no existing code in this repo — that belongs
// with the in-progress docs/projects/105_PLAY_BILLING_TWA.md work, not here.
import type { RecoveryPersona } from './welcomeQuizScoring';

// Canonical definition — src/pages/PremiumUpgrade.tsx imports this rather
// than the reverse, so an eagerly-loaded consumer of this file (Welcome.tsx,
// the `/` route) never pulls that lazy-loaded route's code into its bundle.
export const PLAY_PACKAGE_NAME = 'ca.myrecoverytoolkit.app';

export function buildPlayStoreLink(persona: RecoveryPersona): string {
  const referrer = encodeURIComponent(`persona=${persona}`);
  return `https://play.google.com/store/apps/details?id=${PLAY_PACKAGE_NAME}&referrer=${referrer}`;
}
