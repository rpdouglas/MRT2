import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import posthog from 'posthog-js';
import VibrantHeader from '../components/VibrantHeader';
import { db, default as app } from '../lib/firebase';
import { collection, addDoc, doc, setDoc, onSnapshot, Timestamp } from 'firebase/firestore';
import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions';
import { isAndroidTWA } from '../lib/platform';
import { isPlayBillingSupported, purchasePlaySubscription } from '../lib/playBilling';
import { SparklesIcon, CheckCircleIcon, ShieldCheckIcon, DocumentChartBarIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

const PLAY_PACKAGE_NAME = 'ca.myrecoverytoolkit.app';

// Same emulator-connection idiom as src/lib/gemini.ts / src/lib/vaultAuth.ts —
// this file previously called getFunctions() directly with no emulator
// wiring at all, so both callable functions below always hit real prod
// regardless of VITE_USE_EMULATORS. Needed for the PROJ-105 dev/emulator
// mock-purchase path (see src/lib/playBilling.ts's isDevMockEnabled) to
// actually reach a local verifyPlayPurchase instead of the deployed one.
const USE_EMULATORS = import.meta.env.DEV && import.meta.env.VITE_USE_EMULATORS === 'true';
let functionsInstance: ReturnType<typeof getFunctions> | null = null;
function getFunctionsInstance() {
    if (!functionsInstance) {
        if (!app) throw new Error('Firebase app is not initialized');
        functionsInstance = getFunctions(app, 'northamerica-northeast1');
        if (USE_EMULATORS) {
            connectFunctionsEmulator(functionsInstance, '127.0.0.1', 5001);
        }
    }
    return functionsInstance;
}

export default function PremiumUpgrade() {
    const { user, userTier, userTierSource } = useAuth();
    const navigate = useNavigate();

    const [isSubscribing, setIsSubscribing] = useState(false);
    const [isManaging, setIsManaging] = useState(false);
    const [isPlayPurchasing, setIsPlayPurchasing] = useState(false);
    const [playError, setPlayError] = useState<string | null>(null);
    const isTWA = isAndroidTWA();
    // isPlayBillingSupported() folds in isAndroidTWA() itself for the real
    // path — the PROJ-105 dev-mock path (?mockPlayBilling=1) short-circuits
    // it to true without a real TWA, so isTWA is deliberately not ANDed in
    // here (it's still used unmodified below for the TWA-only "Upgrade on
    // the Web" fallback branch, which the mock should not affect).
    const canUsePlayBilling = isPlayBillingSupported();

    const handleSubscribe = async () => {
        if (!user || !db) return;
        posthog.capture('premium_upgrade_clicked');
        setIsSubscribing(true);
        try {
            const priceId = import.meta.env.VITE_STRIPE_PREMIUM_PRICE_ID;
            if (!priceId) {
                throw new Error("Missing VITE_STRIPE_PREMIUM_PRICE_ID. Check GitHub Secrets.");
            }

            const sessionsRef = collection(db, 'users', user.uid, 'checkout_sessions');
            const docRef = await addDoc(sessionsRef, {
                price: priceId,
                success_url: window.location.origin + '/dashboard',
                cancel_url: window.location.origin + '/premium',
            });

            let isResolved = false;
            const timeoutId = setTimeout(() => {
                if (!isResolved) {
                    unsubscribe();
                    setIsSubscribing(false);
                    alert("Checkout session timeout. Please try again.");
                }
            }, 10000);

            const unsubscribe = onSnapshot(docRef, (snap) => {
                const data = snap.data();
                if (data?.error) {
                    isResolved = true;
                    unsubscribe();
                    clearTimeout(timeoutId);
                    setIsSubscribing(false);
                    alert(`Stripe Error: ${data.error.message}`);
                }
                if (data?.url) {
                    isResolved = true;
                    unsubscribe();
                    clearTimeout(timeoutId);
                    window.location.assign(data.url);
                }
            });

        } catch (err: unknown) { setIsSubscribing(false); alert(`Failed to initialize checkout: ${(err as Error).message}`); }
    };

    const handleManageSubscription = async () => {
        // PROJ-105 dual-source guard: a Play-Billing-sourced subscription has
        // no Stripe customer record at all, so routing it through the Stripe
        // portal would just fail. Play subscriptions are managed natively in
        // the Play Store app, not in-app.
        if (userTierSource === 'play-billing') {
            const productId = import.meta.env.VITE_PLAY_BILLING_PRODUCT_ID;
            window.location.assign(
                `https://play.google.com/store/account/subscriptions?sku=${encodeURIComponent(productId || '')}&package=${PLAY_PACKAGE_NAME}`
            );
            return;
        }

        setIsManaging(true);
        try {
            const createPortalLink = httpsCallable(getFunctionsInstance(), 'ext-firestore-stripe-payments-createPortalLink');

            const { data } = await createPortalLink({
                returnUrl: window.location.origin + '/profile'
            });

            const responseData = data as { url?: string };
            if (responseData?.url) {
                window.location.assign(responseData.url);
            } else {
                throw new Error("No portal URL returned.");
            }
        } catch (err: unknown) {
            setIsManaging(false);
            console.error("Portal Error Detail:", err);
            alert("Billing Portal Error: If you haven't subscribed yet, please use 'Become a Supporter' first to create your Stripe customer record.");
        }
    };

    const handlePlayPurchase = async () => {
        if (!user || !db) return;
        const productId = import.meta.env.VITE_PLAY_BILLING_PRODUCT_ID;
        if (!productId) {
            setPlayError('Play Billing is not configured for this build.');
            return;
        }

        posthog.capture('premium_upgrade_clicked', { platform: 'play-billing' });
        setIsPlayPurchasing(true);
        setPlayError(null);
        try {
            const { purchaseToken } = await purchasePlaySubscription(productId);

            // Persist the raw token immediately, before verification, so it
            // survives an app close mid-flow (see PlayPurchaseRecord's doc
            // comment in src/lib/db.ts). playPurchaseIndex is a second,
            // separate doc purely so the RTDN handler can look up the owning
            // uid later from a purchaseToken alone (see firestore.rules).
            await setDoc(doc(db, 'users', user.uid, 'playPurchases', purchaseToken), {
                purchaseToken,
                productId,
                createdAt: Timestamp.now(),
                verified: false,
            });
            await setDoc(doc(db, 'playPurchaseIndex', purchaseToken), { uid: user.uid });

            const verifyPlayPurchase = httpsCallable(getFunctionsInstance(), 'verifyPlayPurchase');
            await verifyPlayPurchase({ productId, purchaseToken });

            // Full navigation, not an SPA route change — AuthContext only
            // re-derives userTier/userTierSource from a fresh profile fetch
            // on auth-state re-entry (there's no live listener on the user
            // doc's tier field itself, only on Stripe's subscriptions
            // subcollection), same as the Stripe checkout redirect above.
            window.location.assign('/dashboard');
        } catch (err: unknown) {
            setIsPlayPurchasing(false);
            const message = err instanceof Error ? err.message : 'Purchase failed. Please try again.';
            setPlayError(message);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col pb-24 font-sans">
            <div className="flex-shrink-0 z-10">
                <VibrantHeader 
                    title="Supporter Tier" 
                    subtitle="Deepen your recovery. Support our mission." 
                    icon={SparklesIcon}
                    fromColor="from-amber-500"
                    viaColor="via-orange-500"
                    toColor="to-rose-500"
                    backLink="/profile"
                />
            </div>

            <div className="flex-1 max-w-4xl mx-auto px-4 -mt-8 relative z-20 w-full animate-fadeIn">
                {userTier === 'premium' && (
                    <div className="bg-green-600 text-white p-4 rounded-xl shadow-lg mb-6 flex items-center justify-center gap-2">
                        <CheckCircleIcon className="h-6 w-6" />
                        <span className="font-bold">You are an active Supporter. Thank you!</span>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                    <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm flex flex-col">
                        <div className="mb-6">
                            <span className="text-gray-500 font-bold tracking-widest uppercase text-xs">Standard</span>
                            <h3 className="text-3xl font-black text-gray-900 mt-1">Free Forever</h3>
                        </div>
                        <ul className="space-y-4 mb-8 flex-1 text-sm text-gray-700">
                            <li className="flex items-start gap-3"><CheckCircleIcon className="h-5 w-5 text-gray-400 shrink-0" /><span>Zero-Knowledge Journaling</span></li>
                            <li className="flex items-start gap-3"><CheckCircleIcon className="h-5 w-5 text-gray-400 shrink-0" /><span>Task & Habit Tracking</span></li>
                            <li className="flex items-start gap-3"><CheckCircleIcon className="h-5 w-5 text-gray-400 shrink-0" /><span>Somatic Engine</span></li>
                        </ul>
                        <button onClick={() => navigate('/dashboard')} className="w-full py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors">
                            Return to Dashboard
                        </button>
                    </div>

                    <div className="bg-gradient-to-b from-slate-900 to-slate-800 rounded-3xl p-8 shadow-2xl border border-slate-700 flex flex-col relative overflow-hidden transform md:-translate-y-4">
                        <div className="relative z-10 mb-6">
                            <span className="text-amber-400 font-bold tracking-widest uppercase text-xs">Supporter</span>
                            <h3 className="text-3xl font-black text-white mt-1">$3.99 <span className="text-lg text-slate-400 font-medium">/mo</span></h3>
                        </div>
                        <ul className="space-y-4 mb-8 flex-1 relative z-10 text-sm text-slate-200">
                            <li className="flex items-start gap-3"><SparklesIcon className="h-5 w-5 text-amber-500 shrink-0" /><span><strong>Unlimited AI Deep Dives</strong></span></li>
                            <li className="flex items-start gap-3"><DocumentChartBarIcon className="h-5 w-5 text-amber-500 shrink-0" /><span><strong>PDF Report Generation</strong></span></li>
                            <li className="flex items-start gap-3"><ShieldCheckIcon className="h-5 w-5 text-amber-500 shrink-0" /><span><strong>Keep MRT Free for Others</strong></span></li>
                        </ul>
                        
                        {userTier === 'premium' ? (
                            <button 
                                onClick={handleManageSubscription}
                                disabled={isManaging}
                                className="w-full py-4 bg-slate-700 text-white font-bold rounded-xl hover:bg-slate-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isManaging ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : 'Manage Subscription'}
                            </button>
                        ) : canUsePlayBilling ? (
                            // PROJ-105: real native purchase via the Digital Goods API +
                            // Payment Request API — not a link to an external purchase page,
                            // so Google Play's "External Content Links Program" doesn't apply
                            // here at all (that program only governs links out of the app).
                            <div className="w-full text-center">
                                <button
                                    onClick={handlePlayPurchase}
                                    disabled={isPlayPurchasing}
                                    className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-75"
                                >
                                    {isPlayPurchasing ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : 'Become a Supporter'}
                                </button>
                                {playError && (
                                    <p className="text-red-400 text-xs mt-3">{playError}</p>
                                )}
                            </div>
                        ) : isTWA ? (
                            // Fallback for a TWA session where the Digital Goods API isn't
                            // available (old WebView, non-Play sideload, etc.) — deliberately
                            // not a clickable link (Google Play's "External Content Links
                            // Program" formally regulates in-app links to external purchase
                            // pages — declaration, API integration, Play Console enrollment,
                            // review, and a 10-20% fee starting 2026-10-01). Plain informational
                            // text keeps this outside that program's scope entirely.
                            <div className="w-full text-center">
                                <div
                                    className="w-full min-h-[44px] py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 opacity-90"
                                >
                                    <SparklesIcon className="h-5 w-5" />
                                    Upgrade on the Web
                                </div>
                                <p className="text-slate-400 text-xs mt-3">
                                    Visit myrecoverytoolkit.ca to become a Supporter
                                </p>
                            </div>
                        ) : (
                            <button
                                onClick={handleSubscribe}
                                disabled={isSubscribing}
                                className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-75"
                            >
                                {isSubscribing ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : 'Become a Supporter'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
