/**
 * src/components/__tests__/VaultGate.test.tsx
 * GITHUB COMMENT:
 * [VaultGate.test.tsx]
 * QA: Implemented strict UI boundary tests for the Zero-Knowledge VaultGate component.
 * Ensures secure content never renders unless explicit context flags are true.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import VaultGate from '../VaultGate';
import * as EncryptionContext from '../../contexts/EncryptionContext';

// Mock the context hook
vi.mock('../../contexts/EncryptionContext', () => ({
    useEncryption: vi.fn()
}));

describe('🛡️ VaultGate Security Boundary', () => {
    
    // Helper to easily mock the context state before each test
    const mockEncryptionState = (overrides: Partial<ReturnType<typeof EncryptionContext.useEncryption>>) => {
        vi.mocked(EncryptionContext.useEncryption).mockReturnValue({
            isVaultSet: true,
            isVaultUnlocked: false,
            vaultLoading: false,
            unlockVault: vi.fn(),
            setupVault: vi.fn(),
            resetVault: vi.fn(),
            changePin: vi.fn(),
            encrypt: vi.fn(),
            decrypt: vi.fn(),
            lockVault: vi.fn(),
            ...overrides
        });
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('1. should display a loading spinner when vaultLoading is true', () => {
        mockEncryptionState({ vaultLoading: true });
        
        render(
            <VaultGate>
                <div data-testid="secret-content">My Secret Journal</div>
            </VaultGate>
        );

        expect(screen.getByText('Securing Vault...')).toBeInTheDocument();
        expect(screen.queryByTestId('secret-content')).not.toBeInTheDocument();
    });

    it('2. should render children ONLY when isVaultUnlocked is true', () => {
        mockEncryptionState({ isVaultUnlocked: true });

        render(
            <VaultGate>
                <div data-testid="secret-content">My Secret Journal</div>
            </VaultGate>
        );

        // The secret content must be in the DOM
        expect(screen.getByTestId('secret-content')).toBeInTheDocument();
        // The lock screen should NOT be in the DOM
        expect(screen.queryByText('Vault Locked')).not.toBeInTheDocument();
    });

    it('3. should render the PIN Setup UI if the vault is not yet set', () => {
        mockEncryptionState({ isVaultSet: false, isVaultUnlocked: false });

        render(
            <VaultGate>
                <div data-testid="secret-content">My Secret Journal</div>
            </VaultGate>
        );

        expect(screen.getByText('Create Recovery Vault')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('New Security PIN')).toBeInTheDocument();
        expect(screen.queryByTestId('secret-content')).not.toBeInTheDocument();
    });

    it('4. should render the Unlock UI if the vault is set but locked', () => {
        mockEncryptionState({ isVaultSet: true, isVaultUnlocked: false });

        render(
            <VaultGate>
                <div data-testid="secret-content">My Secret Journal</div>
            </VaultGate>
        );

        expect(screen.getByText('Vault Locked')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Enter PIN')).toBeInTheDocument();
        expect(screen.queryByTestId('secret-content')).not.toBeInTheDocument();
    });

    it('5. should call unlockVault when a PIN is submitted', async () => {
        const mockUnlock = vi.fn().mockResolvedValue(true);
        mockEncryptionState({ isVaultSet: true, isVaultUnlocked: false, unlockVault: mockUnlock });

        render(
            <VaultGate>
                <div data-testid="secret-content">My Secret Journal</div>
            </VaultGate>
        );

        const pinInput = screen.getByPlaceholderText('Enter PIN');
        const unlockButton = screen.getByText('Unlock Vault');

        // Simulate user typing PIN and clicking submit
        fireEvent.change(pinInput, { target: { value: '1234' } });
        fireEvent.click(unlockButton);

        // Verify the context function was called with the exact input
        await waitFor(() => {
            expect(mockUnlock).toHaveBeenCalledWith('1234');
        });
    });

    it('6. should show an error message if unlock fails', async () => {
        const mockUnlock = vi.fn().mockResolvedValue(false); // Simulate bad PIN
        mockEncryptionState({ isVaultSet: true, isVaultUnlocked: false, unlockVault: mockUnlock });

        render(
            <VaultGate>
                <div data-testid="secret-content">My Secret Journal</div>
            </VaultGate>
        );

        const pinInput = screen.getByPlaceholderText('Enter PIN');
        const unlockButton = screen.getByText('Unlock Vault');

        fireEvent.change(pinInput, { target: { value: '9999' } });
        fireEvent.click(unlockButton);

        // Verify the error text appears
        await waitFor(() => {
            expect(screen.getByText('Improper PIN. Access Denied.')).toBeInTheDocument();
        });
    });
});
