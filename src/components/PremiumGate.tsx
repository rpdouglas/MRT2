import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LockClosedIcon, SparklesIcon } from '@heroicons/react/24/solid';

interface PremiumGateProps {
    children: React.ReactNode;
    fallbackMode?: 'hide' | 'lock_overlay' | 'button_swap';
    customMessage?: string;
}

export default function PremiumGate({ children, fallbackMode = 'button_swap', customMessage }: PremiumGateProps) {
    const { userTier } = useAuth();
    const navigate = useNavigate();

    // If they are premium, grant full access immediately
    if (userTier === 'premium') {
        return <>{children}</>;
    }

    // --- FALLBACK STATES FOR FREE USERS ---

    if (fallbackMode === 'hide') {
        return null;
    }

    if (fallbackMode === 'button_swap') {
        return (
            <button
                onClick={() => navigate('/premium')}
                className="flex flex-col items-center justify-center p-4 border border-amber-200 bg-gradient-to-b from-amber-50 to-orange-50 rounded-xl hover:shadow-md transition-all group w-full"
            >
                <LockClosedIcon className="h-6 w-6 text-amber-500 mb-2 group-hover:scale-110 transition-transform" />
                <span className="font-bold text-amber-900 flex items-center gap-1">
                    <SparklesIcon className="h-4 w-4 text-amber-500" /> Supporter Feature
                </span>
                <span className="text-xs text-amber-700 font-medium mt-1">
                    {customMessage || 'Unlock this feature'}
                </span>
            </button>
        );
    }

    // lock_overlay (Useful for blurring out full sections of UI)
    return (
        <div className="relative group overflow-hidden rounded-xl">
            <div className="blur-[3px] opacity-40 pointer-events-none select-none transition-all group-hover:blur-md">
                {children}
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-4">
                <div className="bg-white/90 backdrop-blur-md p-6 rounded-2xl shadow-xl text-center border border-amber-100 max-w-sm w-full transform group-hover:scale-105 transition-transform">
                    <div className="bg-amber-100 p-3 rounded-full w-fit mx-auto mb-3">
                        <LockClosedIcon className="h-6 w-6 text-amber-600" />
                    </div>
                    <h3 className="font-bold text-gray-900 mb-1">Premium Access Required</h3>
                    <p className="text-xs text-gray-600 mb-4">{customMessage || 'Upgrade to the Supporter Tier to access this functionality.'}</p>
                    <button 
                        onClick={() => navigate('/premium')}
                        className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-lg hover:shadow-lg active:scale-95 transition-all flex justify-center items-center gap-2"
                    >
                        <SparklesIcon className="h-4 w-4" /> View Benefits
                    </button>
                </div>
            </div>
        </div>
    );
}
