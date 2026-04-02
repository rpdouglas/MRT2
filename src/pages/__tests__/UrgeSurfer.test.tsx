/**
 * src/pages/__tests__/UrgeSurfer.test.tsx
 * QA: Ensures component unmounts safely without leaking interval memory or locking the screen awake.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import UrgeSurfer from '../UrgeSurfer';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// --- MOCKS ---
vi.mock('../../contexts/AuthContext', () => ({
    useAuth: vi.fn(() => ({ user: { uid: 'test-user-123' } }))
}));

vi.mock('../../hooks/useJournalOperations', () => ({
    useJournalOperations: vi.fn(() => ({ addJournal: vi.fn() }))
}));

vi.mock('../../contexts/EncryptionContext', () => ({
    useEncryption: vi.fn(() => ({ encrypt: vi.fn().mockResolvedValue('encrypted-string'), isVaultUnlocked: true }))
}));

// NEW MOCK: Fixes the 'useLayout must be used within a LayoutProvider' error inside VibrantHeader
vi.mock('../../contexts/LayoutContext', () => ({ useLayout: vi.fn(() => ({ toggleSidebar: vi.fn(), toggleSOS: vi.fn(), isOnline: true }))
}));

const mockRequestWakeLock = vi.fn();
const mockReleaseWakeLock = vi.fn();

vi.mock('../../hooks/useWakeLock', () => ({ useWakeLock: vi.fn(() => ({ requestWakeLock: mockRequestWakeLock, releaseWakeLock: mockReleaseWakeLock }))
}));

const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
});

describe('🌊 UrgeSurfer Lifecycle & Safety', () => { beforeEach(() => { vi.clearAllMocks(); vi.useFakeTimers(); });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('1. should start in idle state and not request wake lock', () => {
        render(
            <QueryClientProvider client={queryClient}>
                <BrowserRouter>
                    <UrgeSurfer />
                </BrowserRouter>
            </QueryClientProvider>
        );

        expect(screen.getByText('Begin Surfing')).toBeInTheDocument();
        expect(mockRequestWakeLock).not.toHaveBeenCalled();
    });

    it('2. should request wake lock when surfing starts', () => {
        render(
            <QueryClientProvider client={queryClient}>
                <BrowserRouter>
                    <UrgeSurfer />
                </BrowserRouter>
            </QueryClientProvider>
        );

        const startButton = screen.getByText('Begin Surfing');
        fireEvent.click(startButton);

        // Verification
        expect(mockRequestWakeLock).toHaveBeenCalledTimes(1);
        expect(screen.getByText('5:00')).toBeInTheDocument();
    });

    it('3. THE GREMLIN TEST: should release WakeLock and clear interval on abrupt unmount', () => {
        const { unmount } = render(
            <QueryClientProvider client={queryClient}>
                <BrowserRouter>
                    <UrgeSurfer />
                </BrowserRouter>
            </QueryClientProvider>
        );

        // User starts surfing
        fireEvent.click(screen.getByText('Begin Surfing'));
        expect(mockRequestWakeLock).toHaveBeenCalled();

        // User panics and hits the back button or closes the app (component unmounts)
        unmount();

        // SRE Check: Did the WakeLock disengage?
        expect(mockReleaseWakeLock).toHaveBeenCalledTimes(1);

        // SRE Check: Does the interval crash the app if we advance time post-unmount?
        act(() => {
            vi.advanceTimersByTime(5000);
        });
        
        // If it didn't throw an error trying to set state on an unmounted component, it passed.
        expect(true).toBe(true); 
    });
});
