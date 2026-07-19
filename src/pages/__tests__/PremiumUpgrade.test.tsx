import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PremiumUpgrade from '../PremiumUpgrade';

const mockUseAuth = vi.fn();
vi.mock('../../contexts/AuthContext', () => ({ useAuth: (...args: unknown[]) => mockUseAuth(...args) }));

const mockIsAndroidTWA = vi.fn();
vi.mock('../../lib/platform', () => ({ isAndroidTWA: () => mockIsAndroidTWA() }));

vi.mock('../../contexts/LayoutContext', () => ({
  useLayout: vi.fn(() => ({ toggleSidebar: vi.fn(), toggleSOS: vi.fn(), isOnline: true })),
}));

const mockAddDoc = vi.fn();
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  addDoc: (...args: unknown[]) => mockAddDoc(...args),
  onSnapshot: vi.fn(() => vi.fn()),
}));

vi.mock('firebase/functions', () => ({
  getFunctions: vi.fn(),
  httpsCallable: vi.fn(),
}));

vi.mock('../../lib/firebase', () => ({ db: {} }));

vi.mock('posthog-js', () => ({ default: { capture: vi.fn() } }));

function renderPage() {
  return render(
    <MemoryRouter>
      <PremiumUpgrade />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUseAuth.mockReturnValue({ user: { uid: 'test-uid' }, userTier: 'free' });
});

describe('PremiumUpgrade — Android TWA gating', () => {
  it('shows the normal purchase button and can create a Stripe session outside the TWA', () => {
    mockIsAndroidTWA.mockReturnValue(false);
    renderPage();

    const button = screen.getByRole('button', { name: /become a supporter/i });
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(mockAddDoc).toHaveBeenCalled();
  });

  it('replaces the purchase button with a web-upgrade link inside the TWA, and never creates a Stripe session', () => {
    mockIsAndroidTWA.mockReturnValue(true);
    renderPage();

    expect(screen.queryByRole('button', { name: /become a supporter/i })).not.toBeInTheDocument();

    const link = screen.getByRole('link', { name: /upgrade on the web/i });
    expect(link).toHaveAttribute('href', 'https://www.myrecoverytoolkit.ca/premium');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');

    expect(mockAddDoc).not.toHaveBeenCalled();
  });

  it('still shows Manage Subscription (not gated) for an existing subscriber inside the TWA', () => {
    mockIsAndroidTWA.mockReturnValue(true);
    mockUseAuth.mockReturnValue({ user: { uid: 'test-uid' }, userTier: 'premium' });
    renderPage();

    expect(screen.getByRole('button', { name: /manage subscription/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /upgrade on the web/i })).not.toBeInTheDocument();
  });
});
