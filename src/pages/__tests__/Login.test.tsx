/**
 * src/pages/__tests__/Login.test.tsx
 * PROJ-59: smoke test added as part of migrating this file's raw
 * getDoc('users/{uid}') onboarding-routing check onto the shared
 * useUserProfile() hook (David's first-load path — previously zero coverage).
 * Also guards the exact three-way branch (onboarded / not onboarded / query
 * error) preserved from the original raw-Firestore version.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Login from '../Login';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({ useNavigate: () => mockNavigate }));

const mockUseAuth = vi.fn();
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: (...args: unknown[]) => mockUseAuth(...args),
}));

const mockGetProfile = vi.fn();
vi.mock('../../lib/db', () => ({
  getProfile: (...args: unknown[]) => mockGetProfile(...args),
  updateProfileData: vi.fn(),
}));

vi.mock('../../lib/firebase', () => ({ db: { type: 'mock-db' } }));

function renderLogin() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <Login />
    </QueryClientProvider>,
  );
}

describe('Login onboarding redirect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the sign-in form and does not navigate while logged out', async () => {
    mockUseAuth.mockReturnValue({ loginWithGoogle: vi.fn(), loginWithEmail: vi.fn(), signupWithEmail: vi.fn(), user: null, loading: false });

    renderLogin();

    expect(await screen.findByText('Sign in with Google')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('routes an onboarded user to /dashboard', async () => {
    mockUseAuth.mockReturnValue({ loginWithGoogle: vi.fn(), loginWithEmail: vi.fn(), signupWithEmail: vi.fn(), user: { uid: 'test-uid' }, loading: false });
    mockGetProfile.mockResolvedValue({ hasCompletedOnboarding: true });

    renderLogin();

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/dashboard'));
  });

  it('routes a not-yet-onboarded user to /profile', async () => {
    mockUseAuth.mockReturnValue({ loginWithGoogle: vi.fn(), loginWithEmail: vi.fn(), signupWithEmail: vi.fn(), user: { uid: 'test-uid' }, loading: false });
    mockGetProfile.mockResolvedValue({ hasCompletedOnboarding: false });

    renderLogin();

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/profile'));
  });

  it('falls back to /dashboard when the profile fetch errors (safe zone, matching the pre-migration catch branch)', async () => {
    mockUseAuth.mockReturnValue({ loginWithGoogle: vi.fn(), loginWithEmail: vi.fn(), signupWithEmail: vi.fn(), user: { uid: 'test-uid' }, loading: false });
    mockGetProfile.mockRejectedValue(new Error('network down'));

    renderLogin();

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/dashboard'));
  });
});
