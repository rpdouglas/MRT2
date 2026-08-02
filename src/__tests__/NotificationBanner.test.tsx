import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import NotificationBanner from '../components/NotificationBanner';

const mockUseAuth = vi.fn();
vi.mock('../contexts/AuthContext', () => ({ useAuth: (...args: unknown[]) => mockUseAuth(...args) }));

const mockRequestNotificationPermission = vi.fn();
vi.mock('../lib/messaging', () => ({
  requestNotificationPermission: (...args: unknown[]) => mockRequestNotificationPermission(...args),
}));

const ORIGINAL_USER_AGENT = navigator.userAgent;

function setPermission(value: NotificationPermission) {
  (window as unknown as { Notification: { permission: string } }).Notification.permission = value;
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  mockUseAuth.mockReturnValue({ user: { uid: 'test-uid' } });
  // jsdom does not implement the Notification API — stub a minimal fake.
  (window as unknown as { Notification: unknown }).Notification = { permission: 'default' };
  setPermission('default');
  Object.defineProperty(navigator, 'userAgent', { value: 'Mozilla/5.0 (X11; Linux x86_64)', configurable: true });
  Object.defineProperty(window.navigator, 'standalone', { value: undefined, configurable: true });
  // jsdom does not implement matchMedia either.
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia;
});

afterEach(() => {
  Object.defineProperty(navigator, 'userAgent', { value: ORIGINAL_USER_AGENT, configurable: true });
});

describe('NotificationBanner', () => {
  it('renders the opt-in prompt when permission is undecided and not dismissed', async () => {
    render(<NotificationBanner />);
    await waitFor(() => expect(screen.getByText('Enable Daily Reminders')).toBeInTheDocument());
  });

  it('does not render when the user already dismissed it', async () => {
    localStorage.setItem('mrt_notif_dismissed_test-uid', 'true');
    render(<NotificationBanner />);
    await new Promise((r) => setTimeout(r, 10));
    expect(screen.queryByText('Enable Daily Reminders')).not.toBeInTheDocument();
  });

  it('does not render when permission is already granted', async () => {
    setPermission('granted');
    render(<NotificationBanner />);
    await new Promise((r) => setTimeout(r, 10));
    expect(screen.queryByText('Enable Daily Reminders')).not.toBeInTheDocument();
  });

  it('does not render when permission was already denied', async () => {
    setPermission('denied');
    render(<NotificationBanner />);
    await new Promise((r) => setTimeout(r, 10));
    expect(screen.queryByText('Enable Daily Reminders')).not.toBeInTheDocument();
  });

  it('does not render on iOS Safari (not installed to home screen)', async () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
      configurable: true,
    });
    Object.defineProperty(window.navigator, 'standalone', { value: false, configurable: true });
    render(<NotificationBanner />);
    await new Promise((r) => setTimeout(r, 10));
    expect(screen.queryByText('Enable Daily Reminders')).not.toBeInTheDocument();
  });

  it('renders on iOS when running as an installed standalone PWA', async () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
      configurable: true,
    });
    Object.defineProperty(window.navigator, 'standalone', { value: true, configurable: true });
    render(<NotificationBanner />);
    await waitFor(() => expect(screen.getByText('Enable Daily Reminders')).toBeInTheDocument());
  });

  it('sets the dismiss flag and hides the banner when dismissed', async () => {
    render(<NotificationBanner />);
    await waitFor(() => expect(screen.getByText('Enable Daily Reminders')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss notification' }));

    await waitFor(() => expect(screen.queryByText('Enable Daily Reminders')).not.toBeInTheDocument());
    expect(localStorage.getItem('mrt_notif_dismissed_test-uid')).toBe('true');
  });

  it('requests permission and hides the banner on successful enable', async () => {
    mockRequestNotificationPermission.mockResolvedValue(true);
    render(<NotificationBanner />);
    await waitFor(() => expect(screen.getByText('Enable Daily Reminders')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Turn On Notifications'));

    await waitFor(() => expect(mockRequestNotificationPermission).toHaveBeenCalledWith('test-uid'));
    await waitFor(() => expect(screen.queryByText('Enable Daily Reminders')).not.toBeInTheDocument());
  });

  it('dismisses (rather than re-prompting) when enable fails', async () => {
    mockRequestNotificationPermission.mockResolvedValue(false);
    render(<NotificationBanner />);
    await waitFor(() => expect(screen.getByText('Enable Daily Reminders')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Turn On Notifications'));

    await waitFor(() => expect(screen.queryByText('Enable Daily Reminders')).not.toBeInTheDocument());
    expect(localStorage.getItem('mrt_notif_dismissed_test-uid')).toBe('true');
  });
});
