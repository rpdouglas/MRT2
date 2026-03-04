/**
 * src/hooks/useWakeLock.ts
 * PURPOSE: Prevents the device screen from sleeping during long processes (e.g., Breathwork).
 * BROWSER SUPPORT: Uses the Screen Wake Lock API with graceful fallbacks.
 */
import { useRef, useCallback } from 'react';

export function useWakeLock() {
    const wakeLock = useRef<WakeLockSentinel | null>(null);

    const requestWakeLock = useCallback(async () => {
        if ('wakeLock' in navigator) {
            try {
                wakeLock.current = await navigator.wakeLock.request('screen');
                console.log('💡 Wake Lock active');
            } catch (err) {
                console.warn('Wake Lock request failed:', err);
            }
        }
    }, []);

    const releaseWakeLock = useCallback(async () => {
        if (wakeLock.current) {
            try {
                await wakeLock.current.release();
                wakeLock.current = null;
                console.log('💡 Wake Lock released');
            } catch (err) {
                console.warn('Wake Lock release failed:', err);
            }
        }
    }, []);

    return { requestWakeLock, releaseWakeLock };
}
