import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Runs a cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup();
});

// jsdom has no ResizeObserver — HeadlessUI's Menu uses one internally for
// anchor positioning as soon as it's opened, throwing "ResizeObserver is not
// defined" the first time any test actually clicks a MenuButton (found via
// DynamicAnchorWidget.test.tsx's dropdown coverage; every prior Menu-using
// test only ever exercised the non-dropdown click path).
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}