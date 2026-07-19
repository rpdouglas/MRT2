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
});
