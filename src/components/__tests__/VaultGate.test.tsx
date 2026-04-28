import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import VaultGate from '../VaultGate';

// 1. Mock the specific Auth Hook directly so it bypasses the Provider requirement
vi.mock('../../contexts/AuthContext', () => {
  return {
    useAuth: () => ({
      user: { uid: 'test-uid-123', email: 'test@example.com' },
      logout: vi.fn(),
      driveAccessToken: null,
      isAdmin: false
    }),
    AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
  };
});

// 2. Mock the DB calls so 'updateProfileData' doesn't hit Firebase
vi.mock('../../lib/db', () => ({
  updateProfileData: vi.fn().mockResolvedValue(true)
}));

// We need to test different states of the EncryptionContext.
// The easiest way is to mock useEncryption directly for these specific tests.
vi.mock('../../contexts/EncryptionContext', () => {
  return {
    useEncryption: vi.fn(),
    EncryptionProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
  };
});

import { useEncryption } from '../../contexts/EncryptionContext';

describe('🛡️ VaultGate Security Boundary', () => {
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display a loading spinner when vaultLoading is true', () => {
    vi.mocked(useEncryption).mockReturnValue({
      vaultLoading: true,
      isVaultUnlocked: false,
      isVaultSet: false,
      hasDeferredVault: false,
      setupVault: vi.fn(),
      unlockVault: vi.fn(),
      resetVault: vi.fn()
    } as unknown as ReturnType<typeof useEncryption>);

    render(<VaultGate><div>Protected Content</div></VaultGate>);
    expect(screen.getByText('Securing Vault...')).toBeInTheDocument();
  });

  it('should render children ONLY when isVaultUnlocked is true', () => {
    vi.mocked(useEncryption).mockReturnValue({
      vaultLoading: false,
      isVaultUnlocked: true,
      isVaultSet: true,
      hasDeferredVault: false,
      setupVault: vi.fn(),
      unlockVault: vi.fn(),
      resetVault: vi.fn()
    } as unknown as ReturnType<typeof useEncryption>);

    render(<VaultGate><div>Protected Content</div></VaultGate>);
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should render the PIN Setup UI if the vault is not yet set', () => {
    vi.mocked(useEncryption).mockReturnValue({
      vaultLoading: false,
      isVaultUnlocked: false,
      isVaultSet: false,
      hasDeferredVault: false,
      setupVault: vi.fn(),
      unlockVault: vi.fn(),
      resetVault: vi.fn()
    } as unknown as ReturnType<typeof useEncryption>);

    render(<VaultGate><div>Protected Content</div></VaultGate>);
    expect(screen.getByText('Create Recovery Vault')).toBeInTheDocument();
    expect(screen.getByText('Skip for Now (Try the App)')).toBeInTheDocument(); // PROJ-39 check
  });

  it('should render the Unlock UI if the vault is set but locked', () => {
    vi.mocked(useEncryption).mockReturnValue({
      vaultLoading: false,
      isVaultUnlocked: false,
      isVaultSet: true,
      hasDeferredVault: false,
      setupVault: vi.fn(),
      unlockVault: vi.fn(),
      resetVault: vi.fn()
    } as unknown as ReturnType<typeof useEncryption>);

    render(<VaultGate><div>Protected Content</div></VaultGate>);
    expect(screen.getByText('Vault Locked')).toBeInTheDocument();
  });

  it('should call unlockVault when a PIN is submitted', async () => {
    const mockUnlock = vi.fn().mockResolvedValue(true);
    vi.mocked(useEncryption).mockReturnValue({
      vaultLoading: false,
      isVaultUnlocked: false,
      isVaultSet: true,
      hasDeferredVault: false,
      setupVault: vi.fn(),
      unlockVault: mockUnlock,
      resetVault: vi.fn()
    } as unknown as ReturnType<typeof useEncryption>);

    render(<VaultGate><div>Protected Content</div></VaultGate>);
    
    const input = screen.getByPlaceholderText('Enter PIN');
    fireEvent.change(input, { target: { value: '1234' } });
    
    const submitBtn = screen.getByRole('button', { name: /Unlock Vault/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockUnlock).toHaveBeenCalledWith('1234');
    });
  });
});
