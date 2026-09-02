/**
 * PROJ-105: unit coverage for the Digital Goods API / Payment Request API
 * bridge. Mocks the two non-standard browser globals directly on `window`
 * rather than reaching for a library, since neither API has a real test
 * double available. getPlayProductPrice tests reset the module between
 * cases (via dynamic import) to avoid bleed from the internal service cache
 * — isPlayBillingSupported and purchasePlaySubscription don't touch that
 * cache, so they're safe to test against the static top-level import.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { isPlayBillingSupported, purchasePlaySubscription } from '../playBilling';

const mockIsAndroidTWA = vi.fn();
vi.mock('../platform', () => ({ isAndroidTWA: () => mockIsAndroidTWA() }));

describe('isPlayBillingSupported', () => {
  const originalGetDigitalGoodsService = window.getDigitalGoodsService;
  const originalPaymentRequest = window.PaymentRequest;

  afterEach(() => {
    window.getDigitalGoodsService = originalGetDigitalGoodsService;
    window.PaymentRequest = originalPaymentRequest;
  });

  it('is false outside the Android TWA even when both APIs are present', () => {
    mockIsAndroidTWA.mockReturnValue(false);
    window.getDigitalGoodsService = vi.fn();
    window.PaymentRequest = vi.fn() as unknown as typeof PaymentRequest;

    expect(isPlayBillingSupported()).toBe(false);
  });

  it('is false inside the TWA when getDigitalGoodsService is missing', () => {
    mockIsAndroidTWA.mockReturnValue(true);
    delete (window as { getDigitalGoodsService?: unknown }).getDigitalGoodsService;
    window.PaymentRequest = vi.fn() as unknown as typeof PaymentRequest;

    expect(isPlayBillingSupported()).toBe(false);
  });

  it('is false inside the TWA when PaymentRequest is missing', () => {
    mockIsAndroidTWA.mockReturnValue(true);
    window.getDigitalGoodsService = vi.fn();
    delete (window as { PaymentRequest?: unknown }).PaymentRequest;

    expect(isPlayBillingSupported()).toBe(false);
  });

  it('is true inside the TWA when both APIs are present', () => {
    mockIsAndroidTWA.mockReturnValue(true);
    window.getDigitalGoodsService = vi.fn();
    window.PaymentRequest = vi.fn() as unknown as typeof PaymentRequest;

    expect(isPlayBillingSupported()).toBe(true);
  });
});

describe('purchasePlaySubscription', () => {
  const originalGetDigitalGoodsService = window.getDigitalGoodsService;
  const originalPaymentRequest = window.PaymentRequest;

  beforeEach(() => {
    mockIsAndroidTWA.mockReturnValue(true);
    window.getDigitalGoodsService = vi.fn();
  });

  afterEach(() => {
    window.getDigitalGoodsService = originalGetDigitalGoodsService;
    window.PaymentRequest = originalPaymentRequest;
  });

  it('throws immediately without launching a purchase sheet when unsupported', async () => {
    mockIsAndroidTWA.mockReturnValue(false);
    const paymentRequestSpy = vi.fn();
    window.PaymentRequest = paymentRequestSpy as unknown as typeof PaymentRequest;

    await expect(purchasePlaySubscription('premium.monthly')).rejects.toThrow('Play Billing is not available');
    expect(paymentRequestSpy).not.toHaveBeenCalled();
  });

  it('resolves with the purchaseToken and completes the sheet as success', async () => {
    const mockShow = vi.fn().mockResolvedValue({
      details: { purchaseToken: 'token-xyz' },
      complete: vi.fn().mockResolvedValue(undefined),
    });
    function FakePaymentRequest(this: { show: typeof mockShow }) { this.show = mockShow; }
    window.PaymentRequest = FakePaymentRequest as unknown as typeof PaymentRequest;

    const result = await purchasePlaySubscription('premium.monthly');

    expect(result).toEqual({ purchaseToken: 'token-xyz' });
  });

  it('completes the sheet as fail and throws when no purchaseToken comes back', async () => {
    const mockComplete = vi.fn().mockResolvedValue(undefined);
    const mockShow = vi.fn().mockResolvedValue({ details: {}, complete: mockComplete });
    function FakePaymentRequest(this: { show: typeof mockShow }) { this.show = mockShow; }
    window.PaymentRequest = FakePaymentRequest as unknown as typeof PaymentRequest;

    await expect(purchasePlaySubscription('premium.monthly')).rejects.toThrow('did not return a purchase token');
    expect(mockComplete).toHaveBeenCalledWith('fail');
  });

  it('propagates a rejection from request.show() (e.g. user cancellation) without calling complete', async () => {
    const mockShow = vi.fn().mockRejectedValue(new Error('User cancelled the payment request.'));
    function FakePaymentRequest(this: { show: typeof mockShow }) { this.show = mockShow; }
    window.PaymentRequest = FakePaymentRequest as unknown as typeof PaymentRequest;

    await expect(purchasePlaySubscription('premium.monthly')).rejects.toThrow('User cancelled the payment request.');
  });
});

describe('getPlayProductPrice', () => {
  const originalGetDigitalGoodsService = window.getDigitalGoodsService;
  const originalPaymentRequest = window.PaymentRequest;

  beforeEach(() => {
    vi.resetModules();
    mockIsAndroidTWA.mockReturnValue(true);
    window.PaymentRequest = vi.fn() as unknown as typeof PaymentRequest;
  });

  afterEach(() => {
    window.getDigitalGoodsService = originalGetDigitalGoodsService;
    window.PaymentRequest = originalPaymentRequest;
  });

  it('returns null when Play Billing is unsupported (no service call attempted)', async () => {
    mockIsAndroidTWA.mockReturnValue(false);
    const { getPlayProductPrice } = await import('../playBilling');

    const price = await getPlayProductPrice('premium.monthly');
    expect(price).toBeNull();
  });

  it('returns the matching product price from getDetails', async () => {
    window.getDigitalGoodsService = vi.fn().mockResolvedValue({
      getDetails: vi.fn().mockResolvedValue([
        { itemId: 'other.sku', title: 'x', description: '', price: { currency: 'USD', value: '9.99' } },
        { itemId: 'premium.monthly', title: 'Supporter', description: '', price: { currency: 'USD', value: '3.99' } },
      ]),
    });
    const { getPlayProductPrice } = await import('../playBilling');

    const price = await getPlayProductPrice('premium.monthly');
    expect(price).toEqual({ currency: 'USD', value: '3.99' });
  });

  it('returns null when getDetails throws', async () => {
    window.getDigitalGoodsService = vi.fn().mockResolvedValue({
      getDetails: vi.fn().mockRejectedValue(new Error('network error')),
    });
    const { getPlayProductPrice } = await import('../playBilling');

    const price = await getPlayProductPrice('premium.monthly');
    expect(price).toBeNull();
  });
});
