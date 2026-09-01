import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import posthog from 'posthog-js';
import VibrantHeader from '../components/VibrantHeader';
import { db } from '../lib/firebase';
import { collection, addDoc, onSnapshot } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { isAndroidTWA } from '../lib/platform';
import { SparklesIcon, CheckCircleIcon, ShieldCheckIcon, DocumentChartBarIcon, UserGroupIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

export default function PremiumUpgrade() {
    const { user, userTier } = useAuth();
    const navigate = useNavigate();

    const [isSubscribing, setIsSubscribing] = useState(false);
    const [isManaging, setIsManaging] = useState(false);
    const isTWA = isAndroidTWA();

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
        setIsManaging(true);
        try {
            const functions = getFunctions(undefined, 'northamerica-northeast1');
            const createPortalLink = httpsCallable(functions, 'ext-firestore-stripe-payments-createPortalLink');
            
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
                            <li className="flex items-start gap-3"><UserGroupIcon className="h-5 w-5 text-amber-500 shrink-0" /><span><strong>Service Network Access</strong></span></li>
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
                        ) : isTWA ? (
                            // Deliberately not a clickable link (Google Play's "External Content
                            // Links Program" now formally regulates in-app links to external
                            // purchase pages — declaration, API integration, Play Console
                            // enrollment, review, and a 10-20% fee starting 2026-10-01). Plain
                            // informational text keeps this outside that program's scope entirely.
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
