import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PremiumUpgrade from '../PremiumUpgrade';

const mockUseAuth = vi.fn();
vi.mock('../../contexts/AuthContext', () => ({ useAuth: (...args: unknown[]) => mockUseAuth(...args) }));

const mockIsAndroidTWA = vi.fn();
vi.mock('../../lib/platform', () => ({ isAndroidTWA: () => mockIsAndroidTWA() }));

const mockIsPlayBillingSupported = vi.fn();
const mockPurchasePlaySubscription = vi.fn();
vi.mock('../../lib/playBilling', () => ({
  isPlayBillingSupported: () => mockIsPlayBillingSupported(),
  purchasePlaySubscription: (...args: unknown[]) => mockPurchasePlaySubscription(...args),
}));

vi.mock('../../contexts/LayoutContext', () => ({
  useLayout: vi.fn(() => ({ toggleSidebar: vi.fn(), toggleSOS: vi.fn(), isOnline: true })),
}));

const mockAddDoc = vi.fn();
const mockSetDoc = vi.fn();
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn((...args: unknown[]) => args),
  addDoc: (...args: unknown[]) => mockAddDoc(...args),
  setDoc: (...args: unknown[]) => mockSetDoc(...args),
  onSnapshot: vi.fn(() => vi.fn()),
  Timestamp: { now: () => 'mock-timestamp' },
}));

const mockHttpsCallable = vi.fn();
vi.mock('firebase/functions', () => ({
  getFunctions: vi.fn().mockReturnValue({}),
  httpsCallable: (...args: unknown[]) => mockHttpsCallable(...args),
  connectFunctionsEmulator: vi.fn(),
}));

vi.mock('../../lib/firebase', () => ({ default: { name: 'test-app' }, db: {} }));

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
  vi.stubEnv('VITE_STRIPE_PREMIUM_PRICE_ID', 'price_test123');
  vi.stubEnv('VITE_PLAY_BILLING_PRODUCT_ID', 'premium.monthly');
  mockUseAuth.mockReturnValue({ user: { uid: 'test-uid' }, userTier: 'free', userTierSource: undefined });
  mockIsPlayBillingSupported.mockReturnValue(false);
  Object.defineProperty(window, 'location', {
    writable: true,
    value: { ...window.location, assign: vi.fn() },
  });
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

  it('replaces the purchase button with non-clickable web-upgrade text inside the TWA when Play Billing is unavailable, and never creates a Stripe session', () => {
    mockIsAndroidTWA.mockReturnValue(true);
    mockIsPlayBillingSupported.mockReturnValue(false);
    renderPage();

    expect(screen.queryByRole('button', { name: /become a supporter/i })).not.toBeInTheDocument();

    // Deliberately not a real link — Google Play's External Content Links Program now
    // formally regulates in-app links to external purchase pages (declaration, API
    // integration, enrollment, review, fees). Plain text stays outside that scope.
    expect(screen.queryByRole('link', { name: /upgrade on the web/i })).not.toBeInTheDocument();
    expect(screen.getByText(/upgrade on the web/i)).toBeInTheDocument();
    expect(screen.getByText(/visit myrecoverytoolkit\.ca to become a supporter/i)).toBeInTheDocument();

    expect(mockAddDoc).not.toHaveBeenCalled();
  });

  it('still shows Manage Subscription (not gated) for an existing subscriber inside the TWA', () => {
    mockIsAndroidTWA.mockReturnValue(true);
    mockUseAuth.mockReturnValue({ user: { uid: 'test-uid' }, userTier: 'premium', userTierSource: 'Stripe-Managed' });
    renderPage();

    expect(screen.getByRole('button', { name: /manage subscription/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /upgrade on the web/i })).not.toBeInTheDocument();
  });
});

describe('PremiumUpgrade — PROJ-105 Play Billing purchase flow', () => {
  it('launches a real Play Billing purchase (not the Stripe checkout session) when Digital Goods API is available in the TWA', async () => {
    mockIsAndroidTWA.mockReturnValue(true);
    mockIsPlayBillingSupported.mockReturnValue(true);
    mockPurchasePlaySubscription.mockResolvedValue({ purchaseToken: 'token-abc' });
    const mockVerify = vi.fn().mockResolvedValue({ data: { success: true } });
    mockHttpsCallable.mockReturnValue(mockVerify);
    renderPage();

    const button = screen.getByRole('button', { name: /become a supporter/i });
    fireEvent.click(button);

    await waitFor(() => expect(mockPurchasePlaySubscription).toHaveBeenCalledWith('premium.monthly'));
    expect(mockAddDoc).not.toHaveBeenCalled();
    await waitFor(() => expect(mockSetDoc).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(mockVerify).toHaveBeenCalledWith({ productId: 'premium.monthly', purchaseToken: 'token-abc' }));
    await waitFor(() => expect(window.location.assign).toHaveBeenCalledWith('/dashboard'));
  });

  it('shows an inline error and does not navigate when the Play purchase sheet fails or is cancelled', async () => {
    mockIsAndroidTWA.mockReturnValue(true);
    mockIsPlayBillingSupported.mockReturnValue(true);
    mockPurchasePlaySubscription.mockRejectedValue(new Error('User cancelled the payment request.'));
    renderPage();

    const button = screen.getByRole('button', { name: /become a supporter/i });
    fireEvent.click(button);

    await waitFor(() => expect(screen.getByText(/user cancelled the payment request/i)).toBeInTheDocument());
    expect(window.location.assign).not.toHaveBeenCalled();
    expect(mockSetDoc).not.toHaveBeenCalled();
  });

  it("routes an existing Play-Billing subscriber's Manage Subscription to the Play Store, not the Stripe portal", () => {
    mockIsAndroidTWA.mockReturnValue(true);
    mockIsPlayBillingSupported.mockReturnValue(true);
    mockUseAuth.mockReturnValue({ user: { uid: 'test-uid' }, userTier: 'premium', userTierSource: 'play-billing' });
    renderPage();

    const button = screen.getByRole('button', { name: /manage subscription/i });
    fireEvent.click(button);

    expect(window.location.assign).toHaveBeenCalledWith(
      expect.stringContaining('https://play.google.com/store/account/subscriptions')
    );
    expect(mockHttpsCallable).not.toHaveBeenCalled();
  });
});
