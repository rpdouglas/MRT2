/**
 * src/components/NotificationBanner.tsx
 * PROJ-26: Contextual UI to prompt the user to enable notifications.
 * Respects iOS PWA constraints (only prompts if running standalone).
 */
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { requestNotificationPermission } from '../lib/messaging';
import { BellAlertIcon, XMarkIcon } from '@heroicons/react/24/outline';

declare global { interface Navigator { standalone?: boolean; }
}

export default function NotificationBanner() {
    const { user } = useAuth();
    const [isVisible, setIsVisible] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!user) return;
        if (typeof window === 'undefined') return;

        // Check if they dismissed it recently
        const dismissed = localStorage.getItem(`mrt_notif_dismissed_${user.uid}`);
        if (dismissed) return;

        // Check native permission state
        if (!('Notification' in window)) return;
        if (Notification.permission === 'granted' || Notification.permission === 'denied') return;

        // iOS strict constraint: Web Push ONLY works if added to Home Screen
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const isStandalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;
        
        if (isIOS && !isStandalone) {
            // Do not prompt on iOS Safari browser, wait until they install the PWA
            return;
        }

        // FIX: Wrap in setTimeout to avoid synchronous setState inside useEffect
        const timer = setTimeout(() => setIsVisible(true), 0);
        return () => clearTimeout(timer);
    }, [user]);

    const handleEnable = async () => {
        if (!user) return;
        setLoading(true);
        const success = await requestNotificationPermission(user.uid);
        if (success) {
            setIsVisible(false);
        } else {
            // Denied or failed
            handleDismiss();
        }
        setLoading(false);
    };

    const handleDismiss = () => { if (!user) return; localStorage.setItem(`mrt_notif_dismissed_${user.uid}`, 'true'); setIsVisible(false); };

    if (!isVisible) return null;

    return (
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 flex items-start gap-4 shadow-sm animate-slideDown mb-6 relative">
            <button 
                onClick={handleDismiss} 
                className="absolute top-2 right-2 p-1 text-indigo-400 hover:text-indigo-600"
            >
                <XMarkIcon className="h-5 w-5" />
            </button>

            <div className="bg-indigo-100 p-2.5 rounded-full text-indigo-600 shrink-0 mt-0.5">
                <BellAlertIcon className="h-6 w-6" />
            </div>
            
            <div className="flex-1 pr-4">
                <h3 className="text-sm font-bold text-indigo-900 mb-1">Enable Daily Reminders</h3>
                <p className="text-xs text-indigo-700 mb-3 leading-relaxed">
                    Get gentle nudges for overdue habits and milestone celebrations. We never send sensitive journal data via notifications.
                </p>
                <button 
                    onClick={handleEnable}
                    disabled={loading}
                    className="text-xs font-bold bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                    {loading ? 'Requesting...' : 'Turn On Notifications'}
                </button>
            </div>
        </div>
    );
}
