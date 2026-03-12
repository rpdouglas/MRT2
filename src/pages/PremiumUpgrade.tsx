import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import VibrantHeader from '../components/VibrantHeader';
import { db } from '../lib/firebase';
import { collection, addDoc, onSnapshot } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { 
    SparklesIcon, 
    CheckCircleIcon, 
    ShieldCheckIcon,
    DocumentChartBarIcon,
    UserGroupIcon,
    ArrowPathIcon
} from '@heroicons/react/24/outline';

export default function PremiumUpgrade() {
    const { user, userTier } = useAuth();
    const navigate = useNavigate();
    
    const [isSubscribing, setIsSubscribing] = useState(false);
    const [isManaging, setIsManaging] = useState(false);

    const handleSubscribe = async () => {
        if (!user || !db) return;
        setIsSubscribing(true);
        try {
            const priceId = import.meta.env.VITE_STRIPE_PREMIUM_PRICE_ID;
            if (!priceId) {
                throw new Error("Missing VITE_STRIPE_PREMIUM_PRICE_ID in environment variables. Please check your .env file.");
            }

            const sessionsRef = collection(db, 'users', user.uid, 'checkout_sessions');
            const docRef = await addDoc(sessionsRef, {
                price: priceId,
                success_url: window.location.origin + '/dashboard',
                cancel_url: window.location.origin + '/premium',
            });

            // 10-second timeout to handle extension cold starts or network drops
            let isResolved = false;
            const timeoutId = setTimeout(() => {
                if (!isResolved) {
                    unsubscribe();
                    setIsSubscribing(false);
                    alert("The checkout session took too long to generate. Please try again.");
                }
            }, 10000);

            // Listen for the Stripe Extension to populate the redirect URL
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
                    window.location.assign(data.url); // Redirect to Stripe Checkout
                }
            });

        } catch (err: unknown) {
            setIsSubscribing(false);
            const error = err as Error;
            alert(`Failed to initialize checkout: ${error.message}`);
        }
    };

    const handleManageSubscription = async () => {
        setIsManaging(true);
        try {
            const functions = getFunctions();
            // This callable function is created automatically by the Stripe Firebase Extension
            const createPortalLink = httpsCallable(functions, 'ext-firestore-stripe-payments-createPortalLink');
            const { data } = await createPortalLink({
                returnUrl: window.location.origin + '/profile'
            });

            const responseData = data as { url?: string };
            if (responseData?.url) {
                window.location.assign(responseData.url); // Redirect to Stripe Customer Portal
            } else {
                throw new Error("Failed to retrieve portal URL.");
            }
        } catch (err: unknown) {
            setIsManaging(false);
            const error = err as Error;
            alert(`Failed to open subscription portal: ${error.message}`);
        }
    };

    return (
        <div className={`min-h-screen bg-slate-50 flex flex-col pb-24 font-sans`}>
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
                
                {/* Current Status Banner */}
                {userTier === 'premium' && (
                    <div className="bg-green-600 text-white p-4 rounded-xl shadow-lg mb-6 flex items-center justify-center gap-2">
                        <CheckCircleIcon className="h-6 w-6" />
                        <span className="font-bold">You are an active Supporter. Thank you!</span>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                    
                    {/* FREE TIER CARD */}
                    <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm flex flex-col">
                        <div className="mb-6">
                            <span className="text-gray-500 font-bold tracking-widest uppercase text-xs">Standard</span>
                            <h3 className="text-3xl font-black text-gray-900 mt-1">Free Forever</h3>
                            <p className="text-sm text-gray-500 mt-2 leading-relaxed">Everything you need for immediate crisis de-escalation and daily habit tracking.</p>
                        </div>
                        <ul className="space-y-4 mb-8 flex-1">
                            <li className="flex items-start gap-3 text-gray-700 text-sm">
                                <CheckCircleIcon className="h-5 w-5 text-gray-400 shrink-0" />
                                <span>Zero-Knowledge <strong>Encrypted Journal</strong></span>
                            </li>
                            <li className="flex items-start gap-3 text-gray-700 text-sm">
                                <CheckCircleIcon className="h-5 w-5 text-gray-400 shrink-0" />
                                <span>Unlimited <strong>Task & Habit Tracking</strong></span>
                            </li>
                            <li className="flex items-start gap-3 text-gray-700 text-sm">
                                <CheckCircleIcon className="h-5 w-5 text-gray-400 shrink-0" />
                                <span><strong>Somatic Engine</strong> (Breathwork & Vitality)</span>
                            </li>
                            <li className="flex items-start gap-3 text-gray-700 text-sm">
                                <CheckCircleIcon className="h-5 w-5 text-gray-400 shrink-0" />
                                <span><strong>Basic AI Compass</strong> (1 Deep Dive per week)</span>
                            </li>
                            <li className="flex items-start gap-3 text-gray-700 text-sm">
                                <CheckCircleIcon className="h-5 w-5 text-gray-400 shrink-0" />
                                <span>JSON Data Export</span>
                            </li>
                        </ul>
                        <button 
                            onClick={() => navigate('/dashboard')}
                            className="w-full py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                        >
                            Return to Dashboard
                        </button>
                    </div>

                    {/* PREMIUM TIER CARD */}
                    <div className="bg-gradient-to-b from-slate-900 to-slate-800 rounded-3xl p-8 shadow-2xl border border-slate-700 flex flex-col relative overflow-hidden transform md:-translate-y-4">
                        <div className="absolute top-0 right-0 p-6 opacity-10">
                            <SparklesIcon className="h-32 w-32 text-amber-400" />
                        </div>
                        <div className="relative z-10 mb-6">
                            <span className="text-amber-400 font-bold tracking-widest uppercase text-xs flex items-center gap-1">
                                <SparklesIcon className="h-4 w-4" /> Supporter
                            </span>
                            <h3 className="text-3xl font-black text-white mt-1">$4.99 <span className="text-lg text-slate-400 font-medium">/mo</span></h3>
                            <p className="text-sm text-slate-300 mt-2 leading-relaxed">Unlock clinical-grade pattern recognition and professional service tools.</p>
                        </div>
                        <ul className="space-y-4 mb-8 flex-1 relative z-10">
                            <li className="flex items-start gap-3 text-slate-200 text-sm">
                                <CheckCircleIcon className="h-5 w-5 text-amber-500 shrink-0" />
                                <span><strong>Unlimited AI Deep Dives</strong>. Process your history instantly without weekly caps.</span>
                            </li>
                            <li className="flex items-start gap-3 text-slate-200 text-sm">
                                <DocumentChartBarIcon className="h-5 w-5 text-amber-500 shrink-0" />
                                <span><strong>PDF Report Generation</strong>. Beautifully formatted exports for your therapist or sponsor.</span>
                            </li>
                            <li className="flex items-start gap-3 text-slate-200 text-sm">
                                <UserGroupIcon className="h-5 w-5 text-amber-500 shrink-0" />
                                <span><strong>The Service Network</strong>. Encrypted Rolodex for managing your sponsees. <em>(Coming Soon)</em></span>
                            </li>
                            <li className="flex items-start gap-3 text-slate-200 text-sm">
                                <ShieldCheckIcon className="h-5 w-5 text-amber-500 shrink-0" />
                                <span><strong>Support the Mission</strong>. Help keep the core platform free for users in crisis.</span>
                            </li>
                        </ul>
                        
                        {userTier === 'premium' ? (
                            <button 
                                onClick={handleManageSubscription}
                                disabled={isManaging}
                                className="w-full py-4 bg-slate-700 text-white font-bold rounded-xl hover:bg-slate-600 transition-colors relative z-10 border border-slate-600 flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isManaging ? <><ArrowPathIcon className="h-5 w-5 animate-spin" /> Loading Portal...</> : 'Manage Subscription'}
                            </button>
                        ) : (
                            <button 
                                onClick={handleSubscribe}
                                disabled={isSubscribing}
                                className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-orange-500/20 active:scale-95 transition-all relative z-10 flex items-center justify-center gap-2 disabled:opacity-75 disabled:scale-100"
                            >
                                {isSubscribing ? <><ArrowPathIcon className="h-5 w-5 animate-spin" /> Preparing Checkout...</> : 'Become a Supporter'}
                            </button>
                        )}
                    </div>

                </div>

                <p className="text-center text-xs text-gray-400 mt-8 max-w-md mx-auto leading-relaxed">
                    Subscriptions are processed securely via Stripe. You can cancel at any time through your Profile settings. Your private data remains Zero-Knowledge encrypted regardless of your tier.
                </p>
            </div>
        </div>
    );
}
