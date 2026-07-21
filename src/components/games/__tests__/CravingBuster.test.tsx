/**
 * src/components/games/__tests__/CravingBuster.test.tsx
 * PROJ-72 (Recovery Games), Phase 2. Verifies the vault-lock guard on
 * progress persistence — the game must always complete locally for the
 * user, but only call recordProgress when the vault happens to be
 * unlocked (see docs/projects/72_RECOVERY_GAMES.md Part B / the
 * crisis-tool vault-gating decision).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import CravingBuster from '../CravingBuster';
import { CRAVING_BUSTER_TOTAL_CYCLES, CRAVING_BUSTER_PHASE_DURATIONS } from '../../../lib/games/cravingBuster';

vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));

const mockRecordProgress = vi.fn().mockResolvedValue(undefined);
vi.mock('../../../hooks/useGameProgress', () => ({
    useGameProgress: () => ({ recordProgress: mockRecordProgress, history: [], isLoading: false }),
}));

let isVaultUnlocked = true;
vi.mock('../../../contexts/EncryptionContext', () => ({
    useEncryption: () => ({ isVaultUnlocked }),
}));

const CYCLE_SECONDS = CRAVING_BUSTER_PHASE_DURATIONS.inhale + CRAVING_BUSTER_PHASE_DURATIONS.hold + CRAVING_BUSTER_PHASE_DURATIONS.exhale;

async function playThroughToCompletion() {
    fireEvent.click(screen.getByText('Start'));
    await act(async () => {
        vi.advanceTimersByTime((CYCLE_SECONDS * CRAVING_BUSTER_TOTAL_CYCLES + 1) * 1000);
    });
}

describe('🎮 CravingBuster', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.clearAllMocks();
        isVaultUnlocked = true;
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('shows the idle intro screen with a Start button before playing', () => {
        render(<CravingBuster />);
        expect(screen.getByText('Start')).toBeInTheDocument();
    });

    it('persists the score via recordProgress when the vault is unlocked on completion', async () => {
        isVaultUnlocked = true;
        render(<CravingBuster />);

        await playThroughToCompletion();

        expect(mockRecordProgress).toHaveBeenCalledWith(
            expect.objectContaining({ gameId: 'craving-buster', personaTarget: 'David' })
        );
        expect(screen.getByText('Nice work.')).toBeInTheDocument();
    });

    it('still completes the game locally but skips recordProgress when the vault is locked', async () => {
        isVaultUnlocked = false;
        render(<CravingBuster />);

        await playThroughToCompletion();

        expect(mockRecordProgress).not.toHaveBeenCalled();
        expect(screen.getByText('Nice work.')).toBeInTheDocument();
    });
});
