/**
 * PROJ-105: Client-side Google Play Billing bridge for the Android TWA.
 *
 * This is the Digital Goods API + Payment Request API — the TWA-specific
 * bridge, not the native Android Billing Library (a TWA has no native
 * Android code to run it in). Both APIs are feature-detected and only
 * resolve to real functionality when the page is actually running inside
 * the Play-installed TWA (see isAndroidTWA in ./platform).
 *
 * This module never touches Firestore or `tier` state directly — it only
 * talks to the browser-native billing APIs and hands the caller a raw
 * purchaseToken. The caller (PremiumUpgrade.tsx) is responsible for
 * persisting a users/{uid}/playPurchases/{token} record and invoking the
 * verifyPlayPurchase Cloud Function, which is the only thing that ever
 * grants `tier: 'premium'`.
 */
import { isAndroidTWA } from './platform';

const PLAY_BILLING_PAYMENT_METHOD = 'https://play.google.com/billing';

interface DigitalGoodsPurchaseDetails {
  itemId: string;
  purchaseToken: string;
}

interface DigitalGoodsProductDetails {
  itemId: string;
  title: string;
  description: string;
  price: { currency: string; value: string };
}

interface DigitalGoodsService {
  getDetails(itemIds: string[]): Promise<DigitalGoodsProductDetails[]>;
  listPurchases(): Promise<DigitalGoodsPurchaseDetails[]>;
}

// Non-standard browser API — not in lib.dom.d.ts. Declared here rather than
// a shared global .d.ts since this is the only module that touches it.
declare global {
  interface Window {
    getDigitalGoodsService?(paymentMethod: string): Promise<DigitalGoodsService>;
  }
}

/**
 * True only when both the Digital Goods API and Payment Request API are
 * present AND we're inside the Play-installed TWA. All three conditions
 * matter: the APIs alone don't guarantee a real Play Billing backend (e.g.
 * desktop Chrome exposes PaymentRequest but not a working Play connection).
 */
export function isPlayBillingSupported(): boolean {
  return (
    isAndroidTWA() &&
    typeof window !== 'undefined' &&
    typeof window.getDigitalGoodsService === 'function' &&
    typeof window.PaymentRequest === 'function'
  );
}

let cachedService: DigitalGoodsService | null | undefined;

async function getService(): Promise<DigitalGoodsService | null> {
  if (cachedService !== undefined) return cachedService;
  if (!isPlayBillingSupported()) {
    cachedService = null;
    return null;
  }
  try {
    cachedService = await window.getDigitalGoodsService!(PLAY_BILLING_PAYMENT_METHOD);
  } catch (err) {
    console.error('Play Billing: getDigitalGoodsService failed', err);
    cachedService = null;
  }
  return cachedService;
}

export interface PlayProductPrice {
  currency: string;
  value: string;
}

/** Returns the live Play Console price for productId, or null if unavailable. */
export async function getPlayProductPrice(productId: string): Promise<PlayProductPrice | null> {
  const service = await getService();
  if (!service) return null;
  try {
    const details = await service.getDetails([productId]);
    const match = details.find((d) => d.itemId === productId);
    return match ? match.price : null;
  } catch (err) {
    console.error('Play Billing: getDetails failed', err);
    return null;
  }
}

export interface PlayPurchaseResult {
  purchaseToken: string;
}

/**
 * Launches the native Play Billing purchase sheet for a subscription
 * product. Resolves with the raw purchaseToken on success. The `total`
 * amount is a required-but-unused field of the Payment Request API shape —
 * Play Billing ignores it and charges the product's real Play Console price
 * (set server-side in the Play Console, not here).
 */
export async function purchasePlaySubscription(productId: string): Promise<PlayPurchaseResult> {
  if (!isPlayBillingSupported()) {
    throw new Error('Play Billing is not available in this context.');
  }

  const paymentMethods: PaymentMethodData[] = [
    {
      supportedMethods: PLAY_BILLING_PAYMENT_METHOD,
      data: { sku: productId },
    },
  ];
  const paymentDetails: PaymentDetailsInit = {
    total: {
      label: 'MRT Supporter',
      amount: { currency: 'USD', value: '0' },
    },
  };

  const request = new PaymentRequest(paymentMethods, paymentDetails);
  const response = await request.show();
  const details = response.details as unknown as { purchaseToken?: string };

  if (!details.purchaseToken) {
    await response.complete('fail');
    throw new Error('Play Billing purchase did not return a purchase token.');
  }

  await response.complete('success');
  return { purchaseToken: details.purchaseToken };
}
