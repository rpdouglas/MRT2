import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../lib/firebase', () => ({ default: { name: 'test-app' }, db: {} }));

const mockGetToken = vi.fn();
const mockIsSupported = vi.fn();
const mockOnMessage = vi.fn();
const mockGetMessaging = vi.fn();
mockGetMessaging.mockImplementation(() => ({}));
vi.mock('firebase/messaging', () => ({
  getMessaging: (...args: unknown[]) => mockGetMessaging(...args),
  getToken: (...args: unknown[]) => mockGetToken(...args),
  isSupported: (...args: unknown[]) => mockIsSupported(...args),
  onMessage: (...args: unknown[]) => mockOnMessage(...args),
}));

const mockUpdateDoc = vi.fn();
const mockArrayUnion = vi.fn();
mockArrayUnion.mockImplementation((token: string) => [token]);
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(() => ({})),
  updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
  arrayUnion: (...args: unknown[]) => mockArrayUnion(...args),
}));

const mockToast = vi.fn();
vi.mock('sonner', () => ({ toast: (...args: unknown[]) => mockToast(...args) }));

import { requestNotificationPermission, refreshFcmTokenIfStale, listenForForegroundMessages } from '../lib/messaging';

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('VITE_FIREBASE_VAPID_KEY', 'test-vapid-key');
  mockIsSupported.mockResolvedValue(true);
  // jsdom does not implement the Notification API — stub a minimal fake.
  (globalThis as unknown as { Notification: unknown }).Notification = {
    permission: 'default',
    requestPermission: vi.fn().mockResolvedValue('default'),
  };
});

describe('requestNotificationPermission', () => {
  it('returns false when FCM is not supported in this browser', async () => {
    mockIsSupported.mockResolvedValue(false);
    const result = await requestNotificationPermission('uid-1');
    expect(result).toBe(false);
    expect(mockUpdateDoc).not.toHaveBeenCalled();
  });

  it('returns false when the user denies permission', async () => {
    globalThis.Notification.requestPermission = vi.fn().mockResolvedValue('denied');
    const result = await requestNotificationPermission('uid-1');
    expect(result).toBe(false);
    expect(mockGetToken).not.toHaveBeenCalled();
  });

  it('returns false when VITE_FIREBASE_VAPID_KEY is missing', async () => {
    vi.stubEnv('VITE_FIREBASE_VAPID_KEY', '');
    globalThis.Notification.requestPermission = vi.fn().mockResolvedValue('granted');
    const result = await requestNotificationPermission('uid-1');
    expect(result).toBe(false);
    expect(mockGetToken).not.toHaveBeenCalled();
  });

  it('registers the token and writes fcmTokens + timezone on success', async () => {
    globalThis.Notification.requestPermission = vi.fn().mockResolvedValue('granted');
    mockGetToken.mockResolvedValue('device-token-abc');

    const result = await requestNotificationPermission('uid-1');

    expect(result).toBe(true);
    expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
    const [, payload] = mockUpdateDoc.mock.calls[0];
    expect(payload.fcmTokens).toEqual(['device-token-abc']);
    expect(typeof payload.timezone).toBe('string');
  });

  it('returns false when getToken yields no token', async () => {
    globalThis.Notification.requestPermission = vi.fn().mockResolvedValue('granted');
    mockGetToken.mockResolvedValue(null);

    const result = await requestNotificationPermission('uid-1');

    expect(result).toBe(false);
    expect(mockUpdateDoc).not.toHaveBeenCalled();
  });
});

describe('refreshFcmTokenIfStale', () => {
  it('does nothing when the stored SW version already matches', async () => {
    await refreshFcmTokenIfStale('uid-1', 2);
    expect(mockUpdateDoc).not.toHaveBeenCalled();
  });

  it('wipes fcmTokens and bumps fcmSwVersion when versions mismatch', async () => {
    await refreshFcmTokenIfStale('uid-1', 1);
    expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
    const [, payload] = mockUpdateDoc.mock.calls[0];
    expect(payload).toEqual({ fcmTokens: [], fcmSwVersion: 2 });
  });

  it('re-registers immediately when permission is already granted', async () => {
    const notification = (globalThis as unknown as { Notification: { permission: string; requestPermission: () => Promise<string> } }).Notification;
    notification.permission = 'granted';
    notification.requestPermission = vi.fn().mockResolvedValue('granted');
    mockGetToken.mockResolvedValue('new-token');

    await refreshFcmTokenIfStale('uid-1', undefined);

    // One updateDoc to wipe tokens, one to re-register the new token.
    expect(mockUpdateDoc).toHaveBeenCalledTimes(2);
    expect(mockGetToken).toHaveBeenCalledTimes(1);
  });

  it('does not re-register when permission is not granted', async () => {
    await refreshFcmTokenIfStale('uid-1', undefined);

    expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
    expect(mockGetToken).not.toHaveBeenCalled();
  });
});

describe('listenForForegroundMessages', () => {
  it('returns undefined when FCM is not supported', async () => {
    mockIsSupported.mockResolvedValue(false);
    const unsubscribe = await listenForForegroundMessages();
    expect(unsubscribe).toBeUndefined();
    expect(mockOnMessage).not.toHaveBeenCalled();
  });

  it('shows a toast with the payload title/body when a foreground message arrives', async () => {
    let capturedHandler: ((payload: unknown) => void) | undefined;
    mockOnMessage.mockImplementation((_messaging, handler) => {
      capturedHandler = handler;
      return vi.fn();
    });

    await listenForForegroundMessages();
    expect(capturedHandler).toBeDefined();

    capturedHandler?.({ notification: { title: 'Milestone Reached!', body: 'Happy 30 days.' } });

    expect(mockToast).toHaveBeenCalledWith('Milestone Reached!', { description: 'Happy 30 days.' });
  });

  it('falls back to a generic title when the payload has none', async () => {
    let capturedHandler: ((payload: unknown) => void) | undefined;
    mockOnMessage.mockImplementation((_messaging, handler) => {
      capturedHandler = handler;
      return vi.fn();
    });

    await listenForForegroundMessages();
    capturedHandler?.({ notification: undefined });

    expect(mockToast).toHaveBeenCalledWith('Notification', undefined);
  });
});
