import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DeleteAccount from '../DeleteAccount';

const mockLoginWithEmail = vi.fn();
const mockLoginWithGoogle = vi.fn();
const mockDeleteAccount = vi.fn();
let mockUser: { uid: string; email: string } | null = null;

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    loginWithEmail: (...args: unknown[]) => mockLoginWithEmail(...args),
    loginWithGoogle: (...args: unknown[]) => mockLoginWithGoogle(...args),
    deleteAccount: (...args: unknown[]) => mockDeleteAccount(...args),
  }),
}));

const mockAnnihilate = vi.fn();
vi.mock('../../lib/deletion', () => ({
  executeTotalAccountAnnihilation: (...args: unknown[]) => mockAnnihilate(...args),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockUser = null;
});

describe('DeleteAccount route', () => {
  it('shows the sign-in form first, not the deletion confirmation', () => {
    render(<DeleteAccount />);
    expect(screen.getByPlaceholderText('Email address')).toBeInTheDocument();
    expect(screen.queryByText(/Permanently Delete My Account/i)).not.toBeInTheDocument();
  });

  it('advances to the confirmation step after successful email login', async () => {
    mockLoginWithEmail.mockImplementation(async () => {
      mockUser = { uid: 'test-uid', email: 'ned@example.com' };
    });
    render(<DeleteAccount />);

    fireEvent.change(screen.getByPlaceholderText('Email address'), { target: { value: 'ned@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'hunter2' } });
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => expect(mockLoginWithEmail).toHaveBeenCalledWith('ned@example.com', 'hunter2'));
    await waitFor(() => expect(screen.getByRole('button', { name: /permanently delete my account/i })).toBeInTheDocument());
  });

  it('shows a specific error message on wrong-password without proceeding', async () => {
    mockLoginWithEmail.mockRejectedValue({ code: 'auth/wrong-password' });
    render(<DeleteAccount />);

    fireEvent.change(screen.getByPlaceholderText('Email address'), { target: { value: 'ned@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => expect(screen.getByText('Incorrect email or password.')).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: /permanently delete my account/i })).not.toBeInTheDocument();
  });

  it('runs Firestore annihilation before Auth deletion, then shows the done state', async () => {
    mockUser = { uid: 'test-uid', email: 'ned@example.com' };
    mockLoginWithEmail.mockImplementation(async () => {});
    mockAnnihilate.mockResolvedValue(undefined);
    mockDeleteAccount.mockResolvedValue(undefined);

    render(<DeleteAccount />);
    fireEvent.change(screen.getByPlaceholderText('Email address'), { target: { value: 'ned@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'hunter2' } });
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    await waitFor(() => screen.getByRole('button', { name: /permanently delete my account/i }));

    fireEvent.click(screen.getByRole('button', { name: /permanently delete my account/i }));

    await waitFor(() => expect(screen.getByText('Account Deleted')).toBeInTheDocument());
    expect(mockAnnihilate).toHaveBeenCalledWith('test-uid', expect.any(Function));
    expect(mockDeleteAccount).toHaveBeenCalled();
    const annihilateOrder = mockAnnihilate.mock.invocationCallOrder[0];
    const deleteOrder = mockDeleteAccount.mock.invocationCallOrder[0];
    expect(annihilateOrder).toBeLessThan(deleteOrder);
  });

  it('offers a Google sign-in option that calls loginWithGoogle', async () => {
    mockLoginWithGoogle.mockImplementation(async () => {
      mockUser = { uid: 'test-uid', email: 'ned@example.com' };
    });
    render(<DeleteAccount />);

    fireEvent.click(screen.getByRole('button', { name: /sign in with google/i }));
    await waitFor(() => expect(mockLoginWithGoogle).toHaveBeenCalled());
  });
});
