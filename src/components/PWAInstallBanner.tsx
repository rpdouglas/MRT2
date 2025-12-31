/**
 * src/components/PWAInstallBanner.tsx
 * GITHUB COMMENT:
 * [PWAInstallBanner.tsx]
 * FIX: Solved 'navigator' type conflict by extending the Navigator interface directly.
 */
import { useState, useEffect } from 'react';
import { XMarkIcon, ArrowDownTrayIcon, ShareIcon, PlusIcon } from '@heroicons/react/24/outline';

// Correctly extend global interfaces via merging
declare global {
    interface Navigator {
        standalone?: boolean;
    }
    interface Window {
        MSStream?: unknown;
    }
}

// TypeScript interface for the non-standard beforeinstallprompt event
interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export default function PWAInstallBanner() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

    // 1. LAZY INITIALIZATION
    const [showIOSPrompt] = useState(() => {
        if (typeof window === 'undefined') return false; 
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        // Now valid thanks to interface merging
        const isStandalone = window.navigator.standalone;
        return !!(isIOS && !isStandalone);
    });

    // 2. LAZY INITIALIZATION
    const [isVisible, setIsVisible] = useState(() => {
        if (typeof window === 'undefined') return false;
        const isDismissed = localStorage.getItem('pwa_install_dismissed');
        if (isDismissed) return false;

        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        const isStandalone = window.navigator.standalone;
        return !!(isIOS && !isStandalone);
    });

    useEffect(() => {
        // 3. Android / Desktop Chrome Handler
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            
            if (localStorage.getItem('pwa_install_dismissed')) return;

            setDeferredPrompt(e as BeforeInstallPromptEvent);
            setIsVisible(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
            setIsVisible(false);
        }
        setDeferredPrompt(null);
    };

    const handleDismiss = () => {
        setIsVisible(false);
        localStorage.setItem('pwa_install_dismissed', 'true');
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 z-40 bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-700 animate-slideUp">
            <button 
                onClick={handleDismiss} 
                className="absolute top-2 right-2 p-1 text-slate-400 hover:text-white"
            >
                <XMarkIcon className="h-5 w-5" />
            </button>

            <div className="flex items-start gap-4">
                <div className="bg-blue-600 p-3 rounded-xl shrink-0">
                    <ArrowDownTrayIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                    <h3 className="font-bold text-lg mb-1">Install App</h3>
                    <p className="text-sm text-slate-300 mb-3">
                        Install My Recovery Toolkit for a better experience and offline access.
                    </p>

                    {showIOSPrompt ? (
                        <div className="text-xs bg-slate-800 p-3 rounded-lg border border-slate-600">
                            <p className="flex items-center gap-2 mb-1">
                                1. Tap <ShareIcon className="h-4 w-4 text-blue-400" /> <strong>Share</strong>
                            </p>
                            <p className="flex items-center gap-2">
                                2. Tap <PlusIcon className="h-4 w-4 text-gray-400" /> <strong>Add to Home Screen</strong>
                            </p>
                        </div>
                    ) : (
                        <button
                            onClick={handleInstallClick}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2 px-4 rounded-lg transition-colors"
                        >
                            Install Now
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}