/**
 * src/pages/__tests__/Profile.test.tsx
 * QA: Project 58 Phase 2 — the General tab used to mix three save models (explicit
 * submit, busy-flag autosave, silent optimistic autosave) with no visual distinction.
 * These tests verify every field now autosaves once onboarding is complete, using one
 * shared AutosaveStatus indicator, while onboarding still gates identity fields behind
 * an explicit "Complete Setup" submit.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { updateProfile as mockUpdateAuthProfile } from 'firebase/auth';
import Profile from '../Profile';

const mockUpdateProfileMutateAsync = vi.fn().mockResolvedValue(undefined);
const mockPatchFieldsMutateAsync = vi.fn().mockResolvedValue(undefined);
const mockResetVault = vi.fn();
let mockProfile: Record<string, unknown> | null;
let mockUserTier: 'free' | 'premium' = 'free';
let mockUserTierSource: 'Stripe-Managed' | 'play-billing' | 'manual' | undefined;

vi.mock('firebase/auth', () => ({ updateProfile: vi.fn() }));

vi.mock('../../contexts/AuthContext', () => ({
    useAuth: vi.fn(() => ({
        user: { uid: 'test-user-123', email: 'walt@example.com', displayName: 'Walt' },
        logout: vi.fn(),
        userTier: mockUserTier,
        userTierSource: mockUserTierSource,
    })),
}));

vi.mock('../../contexts/EncryptionContext', () => ({
    useEncryption: vi.fn(() => ({ changePin: vi.fn(), resetVault: mockResetVault })),
}));

vi.mock('../../contexts/LayoutContext', () => ({
    useLayout: vi.fn(() => ({ toggleSidebar: vi.fn(), toggleSOS: vi.fn(), isOnline: true })),
}));

vi.mock('../../hooks/useHeroColor', () => ({
    useHeroColor: vi.fn(() => ({ updateHeroColor: { mutate: vi.fn(), isPending: false } })),
}));

vi.mock('../../hooks/useUserProfile', () => ({
    useUserProfile: vi.fn(() => ({
        profile: mockProfile,
        isLoading: false,
        updateProfile: { mutateAsync: mockUpdateProfileMutateAsync },
        patchFields: { mutateAsync: mockPatchFieldsMutateAsync },
    })),
}));

vi.mock('../../lib/messaging', () => ({ requestNotificationPermission: vi.fn() }));

vi.mock('../../components/profile/DataManagement', () => ({ default: () => <div>Data Management Mock</div> }));
vi.mock('../../components/profile/AchievementsTab', () => ({ default: () => <div>Achievements Mock</div> }));
vi.mock('../../components/readings/ModalitySelector', () => ({ default: () => <div>Modality Selector Mock</div> }));

function renderProfile(initialPath = '/profile') {
    return render(
        <MemoryRouter initialEntries={[initialPath]}>
            <Routes>
                <Route path="/profile" element={<Profile />} />
                <Route path="/profile/:tab" element={<Profile />} />
                <Route path="/premium" element={<div>Premium Page Mock</div>} />
            </Routes>
        </MemoryRouter>
    );
}

describe('👤 Profile — Autosave Consistency (Project 58 Phase 2)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUserTier = 'free';
        mockUserTierSource = undefined;
        mockUpdateProfileMutateAsync.mockResolvedValue(undefined);
        mockPatchFieldsMutateAsync.mockResolvedValue(undefined);
        mockResetVault.mockResolvedValue(undefined);
        vi.mocked(mockUpdateAuthProfile).mockResolvedValue(undefined);
        Object.defineProperty(window, 'location', {
            configurable: true,
            value: { ...window.location, reload: vi.fn() },
        });
        mockProfile = {
            uid: 'test-user-123',
            displayName: 'Walt',
            sobrietyDate: { toDate: () => new Date('2024-01-01T00:00:00Z') },
            sponsorName: 'Sam',
            sponsorPhone: '555-0100',
            substanceCost: 10,
            costFrequency: 'daily',
            currencySymbol: '$',
            anchorSettings: { notifyCheckIn: true, notifyReading: true },
            pushNotificationsEnabled: true,
            heroColor: 'amber',
            hasCompletedOnboarding: true,
        };
    });

    it('1. renders no explicit "Save Changes" button once onboarding is complete', () => {
        renderProfile();
        expect(screen.queryByRole('button', { name: /save changes/i })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /complete setup/i })).not.toBeInTheDocument();
    });

    it('2. Support Network fields autosave on blur, with no button click', async () => {
        renderProfile();
        const phoneInput = screen.getByPlaceholderText('+1 555-0199');

        fireEvent.change(phoneInput, { target: { value: '555-0199' } });
        fireEvent.blur(phoneInput);

        await waitFor(() => {
            expect(mockUpdateProfileMutateAsync).toHaveBeenCalledWith(
                expect.objectContaining({ sponsorName: 'Sam', sponsorPhone: '555-0199' })
            );
        });
    });

    it('3. Dashboard Badge checkbox commits immediately via patchFields (dot-path), not a raw anchorSettings merge', async () => {
        renderProfile();
        const checkInBadge = screen.getByText('Daily Check-In Badge').closest('label')!.querySelector('input')!;

        fireEvent.click(checkInBadge);

        await waitFor(() => {
            expect(mockPatchFieldsMutateAsync).toHaveBeenCalledWith({
                'anchorSettings.notifyCheckIn': false,
                'anchorSettings.notifyReading': true,
            });
        });
    });

    it('4. shows "Saving…" then "Saved" on the shared AutosaveStatus indicator for a committed field', async () => {
        let resolveMutate: () => void = () => {};
        mockUpdateProfileMutateAsync.mockReturnValueOnce(
            new Promise<void>((resolve) => { resolveMutate = resolve; })
        );

        renderProfile();
        const nameInput = screen.getByPlaceholderText('Sponsor, Therapist, etc.');
        fireEvent.change(nameInput, { target: { value: 'New Sponsor' } });
        fireEvent.blur(nameInput);

        expect(await screen.findByText('Saving…')).toBeInTheDocument();

        resolveMutate();
        expect(await screen.findByText('Saved')).toBeInTheDocument();
    });

    it('5. onboarding: identity fields gate behind the explicit "Complete Setup" submit, disabled until both are filled', () => {
        mockProfile = null; // no profile document yet -> isOnboarding
        renderProfile();

        const completeButton = screen.getByRole('button', { name: /complete setup/i });
        expect(completeButton).toBeDisabled();

        fireEvent.change(screen.getByPlaceholderText('How should we address you?'), { target: { value: 'Ned' } });
        expect(completeButton).toBeDisabled(); // sobriety date still empty

        expect(mockUpdateProfileMutateAsync).not.toHaveBeenCalled();
    });

    it('6. onboarding: display name changes do not autosave on blur (they wait for Complete Setup)', () => {
        mockProfile = null;
        renderProfile();

        const nameInput = screen.getByPlaceholderText('How should we address you?');
        fireEvent.change(nameInput, { target: { value: 'Ned' } });
        fireEvent.blur(nameInput);

        expect(mockUpdateProfileMutateAsync).not.toHaveBeenCalled();
    });
});

describe('👤 Profile — Deep-Linkable Tabs (Project 58 Phase 4)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUserTier = 'free';
        mockUserTierSource = undefined;
        mockUpdateProfileMutateAsync.mockResolvedValue(undefined);
        mockPatchFieldsMutateAsync.mockResolvedValue(undefined);
        mockProfile = {
            uid: 'test-user-123',
            displayName: 'Walt',
            sobrietyDate: { toDate: () => new Date('2024-01-01T00:00:00Z') },
            hasCompletedOnboarding: true,
        };
    });

    it('10. renders the Security tab directly when landing on /profile/security', () => {
        renderProfile('/profile/security');
        expect(screen.getByRole('heading', { name: /change vault pin/i })).toBeInTheDocument();
    });

    it('11. renders the Data tab directly when landing on /profile/data', () => {
        renderProfile('/profile/data');
        expect(screen.getByText('Data Management Mock')).toBeInTheDocument();
    });

    it('11b. renders the Achievements tab directly when landing on /profile/achievements', () => {
        renderProfile('/profile/achievements');
        expect(screen.getByText('Achievements Mock')).toBeInTheDocument();
    });

    it('12. falls back to General for an unrecognized tab segment', () => {
        renderProfile('/profile/not-a-real-tab');
        expect(screen.getByText('Identity')).toBeInTheDocument();
    });

    it('13. clicking the Security tab button navigates to /profile/security', () => {
        renderProfile('/profile/general');
        fireEvent.click(screen.getByRole('button', { name: /security/i }));
        expect(screen.getByRole('heading', { name: /change vault pin/i })).toBeInTheDocument();
    });

    it('13b. clicking the Achievements tab button navigates to /profile/achievements', () => {
        renderProfile('/profile/general');
        fireEvent.click(screen.getByRole('button', { name: /achievements/i }));
        expect(screen.getByText('Achievements Mock')).toBeInTheDocument();
    });

    it('14. redirects a deep link to /profile/security back to General while onboarding is incomplete', async () => {
        mockProfile = null; // no profile document yet -> isOnboarding
        renderProfile('/profile/security');

        expect(await screen.findByText('Required Setup')).toBeInTheDocument();
        expect(screen.queryByRole('heading', { name: /change vault pin/i })).not.toBeInTheDocument();
    });
});

describe('👤 Profile — Danger Zone Dialog Consistency (Project 58 Phase 3)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUserTier = 'free';
        mockUserTierSource = undefined;
        mockUpdateProfileMutateAsync.mockResolvedValue(undefined);
        mockPatchFieldsMutateAsync.mockResolvedValue(undefined);
        mockResetVault.mockResolvedValue(undefined);
        vi.mocked(mockUpdateAuthProfile).mockResolvedValue(undefined);
        Object.defineProperty(window, 'location', {
            configurable: true,
            value: { ...window.location, reload: vi.fn() },
        });
        mockProfile = {
            uid: 'test-user-123',
            displayName: 'Walt',
            sobrietyDate: { toDate: () => new Date('2024-01-01T00:00:00Z') },
            hasCompletedOnboarding: true,
        };
    });

    it('7. requires typing RESET inside a styled dialog before destroying the vault — no native prompt/alert', async () => {
        renderProfile();
        fireEvent.click(screen.getByRole('button', { name: /security/i }));

        fireEvent.click(screen.getByRole('button', { name: /destroy & reset vault/i }));

        const dialog = await screen.findByRole('dialog');
        expect(within(dialog).getByText(/permanently destroys all encrypted journals/i)).toBeInTheDocument();

        fireEvent.click(within(dialog).getByRole('button', { name: /yes, proceed/i }));

        const confirmInput = within(dialog).getByPlaceholderText('Type RESET to confirm');
        const destroyButton = within(dialog).getByRole('button', { name: /destroy & reset vault/i });
        expect(destroyButton).toBeDisabled();
        expect(mockResetVault).not.toHaveBeenCalled();

        fireEvent.change(confirmInput, { target: { value: 'RESET' } });
        expect(destroyButton).not.toBeDisabled();

        fireEvent.click(destroyButton);

        await waitFor(() => expect(mockResetVault).toHaveBeenCalled());
    });

    it('8. Cancel closes the dialog without calling resetVault', async () => {
        renderProfile();
        fireEvent.click(screen.getByRole('button', { name: /security/i }));
        fireEvent.click(screen.getByRole('button', { name: /destroy & reset vault/i }));

        const dialog = await screen.findByRole('dialog');
        fireEvent.click(within(dialog).getByRole('button', { name: /cancel/i }));

        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
        expect(mockResetVault).not.toHaveBeenCalled();
    });

    it('9. identity autosave reports a distinct "partial" status when the Firestore save succeeds but the auth displayName sync fails', async () => {
        vi.mocked(mockUpdateAuthProfile).mockRejectedValueOnce(new Error('auth sync failed'));
        renderProfile();

        const nameInput = screen.getByPlaceholderText('How should we address you?');
        fireEvent.change(nameInput, { target: { value: 'Renamed' } });
        fireEvent.blur(nameInput);

        expect(await screen.findByText(/saved, but a sync step failed/i)).toBeInTheDocument();
        expect(mockUpdateProfileMutateAsync).toHaveBeenCalledWith(
            expect.objectContaining({ displayName: 'Renamed' })
        );
    });
});

describe('👤 Profile — Polish (Project 58 Phase 5)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUserTier = 'free';
        mockUserTierSource = undefined;
        mockUpdateProfileMutateAsync.mockResolvedValue(undefined);
        mockPatchFieldsMutateAsync.mockResolvedValue(undefined);
        mockProfile = {
            uid: 'test-user-123',
            displayName: 'Walt',
            sobrietyDate: { toDate: () => new Date('2024-01-01T00:00:00Z') },
            hasCompletedOnboarding: true,
        };
    });

    it('15. bounds the sobriety date input to today at the latest and ~100 years back at the earliest', () => {
        renderProfile();
        const dateInput = screen.getByDisplayValue('2024-01-01') as HTMLInputElement;

        const today = new Date().toISOString().split('T')[0];
        expect(dateInput.max).toBe(today);

        const minYear = new Date(dateInput.min).getFullYear();
        expect(new Date().getFullYear() - minYear).toBeGreaterThanOrEqual(99);
    });

    it('16. renders Hero Appearance swatches at the 44px touch-target floor', () => {
        renderProfile();
        const swatch = screen.getByRole('button', { name: /use amber theme/i });
        expect(swatch.className).toContain('h-11 w-11');
        expect(swatch.className).not.toContain('h-9 w-9');
    });
});

describe('👤 Profile — Account Tier Card (Project 107)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUserTier = 'free';
        mockUserTierSource = undefined;
        mockUpdateProfileMutateAsync.mockResolvedValue(undefined);
        mockPatchFieldsMutateAsync.mockResolvedValue(undefined);
        mockProfile = {
            uid: 'test-user-123',
            displayName: 'Walt',
            sobrietyDate: { toDate: () => new Date('2024-01-01T00:00:00Z') },
            hasCompletedOnboarding: true,
        };
    });

    it('free tier: shows the Free badge and a "Become a Supporter" button that navigates to /premium', () => {
        renderProfile();

        expect(screen.getByText('Free Plan')).toBeInTheDocument();
        expect(screen.getByText('Free')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /become a supporter/i }));
        expect(screen.getByText('Premium Page Mock')).toBeInTheDocument();
    });

    it('Stripe-sourced premium: shows a source-labeled badge and a "Manage Subscription" button', () => {
        mockUserTier = 'premium';
        mockUserTierSource = 'Stripe-Managed';
        renderProfile();

        expect(screen.getByText('You are a Supporter')).toBeInTheDocument();
        expect(screen.getByText(/supporter.*via stripe/i)).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /manage subscription/i }));
        expect(screen.getByText('Premium Page Mock')).toBeInTheDocument();
    });

    it('Play-Billing-sourced premium: shows "via Google Play" instead of Stripe', () => {
        mockUserTier = 'premium';
        mockUserTierSource = 'play-billing';
        renderProfile();

        expect(screen.getByText(/supporter.*via google play/i)).toBeInTheDocument();
    });

    it('manual/VIP grant: shows the VIP badge with no management button at all', () => {
        mockUserTier = 'premium';
        mockUserTierSource = 'manual';
        renderProfile();

        expect(screen.getByText(/vip.*manual grant/i)).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /manage subscription/i })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /become a supporter/i })).not.toBeInTheDocument();
    });

    it('does not render the tier card during onboarding', () => {
        mockProfile = null; // no profile document yet -> isOnboarding
        renderProfile();

        expect(screen.queryByText('Free Plan')).not.toBeInTheDocument();
        expect(screen.queryByText('You are a Supporter')).not.toBeInTheDocument();
    });
});
