/**
 * True only when running inside the Google Play–installed Trusted Web
 * Activity — not true for desktop/iOS PWA installs or a regular browser
 * tab, both of which are outside Play's Payments policy entirely.
 */
export function isAndroidTWA(): boolean {
  return document.referrer.startsWith('android-app://');
}
