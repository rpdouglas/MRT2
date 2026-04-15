import { useRegisterSW } from 'virtual:pwa-register/react';
import { ArrowPathIcon, XMarkIcon } from '@heroicons/react/24/outline';

/**
 * 🚀 PROJ-19: PWA Workbox Cache Collision Fix
 * Approach B: Prompt Strategy.
 */
export function PWAUpdateBeacon() {
    const {
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(registration) {
            if (import.meta.env.DEV) {
                console.log('SW Registered:', registration);
            }
        },
        onRegisterError(error) {
            console.error('SW registration error', error);
        },
    });

    const closeToast = () => setNeedRefresh(false);

    if (!needRefresh) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 animate-fade-in-up">
            <div className="bg-amber-50 border border-amber-200 shadow-2xl rounded-2xl p-4 flex items-start space-x-4 max-w-sm">
                <div className="flex-shrink-0">
                    <ArrowPathIcon className="h-6 w-6 text-amber-600 animate-spin" aria-hidden="true" />
                </div>
                <div className="flex-1 pt-0.5">
                    <p className="text-sm font-semibold text-amber-900">Update Available</p>
                    <p className="mt-1 text-sm text-amber-700">
                        A new version of MRT has been downloaded. Reload to apply the updates and ensure optimal performance.
                    </p>
                    <div className="mt-4 flex space-x-3">
                        <button
                            type="button"
                            onClick={() => updateServiceWorker(true)}
                            className="rounded-lg bg-amber-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-500 transition-colors"
                        >
                            Reload Now
                        </button>
                        <button
                            type="button"
                            onClick={closeToast}
                            className="rounded-lg bg-transparent px-3 py-2 text-sm font-semibold text-amber-900 ring-1 ring-inset ring-amber-300 hover:bg-amber-100 transition-colors"
                        >
                            Dismiss
                        </button>
                    </div>
                </div>
                <div className="flex-shrink-0 flex">
                    <button type="button" className="text-amber-500 hover:text-amber-700" onClick={closeToast}>
                        <span className="sr-only">Close</span>
                        <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                </div>
            </div>
        </div>
    );
}
