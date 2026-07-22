/**
 * src/pages/__tests__/Dashboard.test.tsx
 * PROJ-59: smoke test added as part of migrating this file's duplicated
 * profile-fetch and raw updateDoc build-hash write onto
 * useUserProfile()/patchFields (previously zero coverage).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Dashboard from '../Dashboard';

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { uid: 'test-user-123' }, driveAccessToken: null }),
}));

vi.mock('../../lib/versioning', () => ({
  useBuildInfo: () => ({ env: 'DEV', branch: 'main', globalHash: 'hash-v2', coreHash: 'core-v2', buildTime: '2026-01-01' }),
}));

vi.mock('../../lib/firebase', () => ({ db: { type: 'mock-db' } }));

const mockPatchFieldsMutate = vi.fn();
vi.mock('../../hooks/useUserProfile', () => ({
  useUserProfile: () => ({
    profile: { sobrietyDate: null, lastSeenBuildHash: 'hash-v1' },
    isLoading: false,
    patchFields: { mutate: mockPatchFieldsMutate },
  }),
}));

vi.mock('../../components/dashboard/DynamicAnchorWidget', () => ({ default: () => <div>Anchor Widget</div> }));
vi.mock('../../components/SobrietyHero', () => ({ default: () => <div>Sobriety Hero</div> }));
vi.mock('../../components/NotificationBanner', () => ({ default: () => null }));
vi.mock('../../components/VibrantHeader', () => ({ default: ({ title }: { title: string }) => <h1>{title}</h1> }));
vi.mock('react-confetti', () => ({ default: () => null }));

function renderDashboard() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    </QueryClientProvider>,
  );
}

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the dashboard once data loads', async () => {
    renderDashboard();

    expect(await screen.findByText('My Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Anchor Widget')).toBeInTheDocument();
  });

  it('patches lastSeenBuildHash via patchFields when the local build hash is stale (regression: was a raw updateDoc + manual invalidateQueries)', async () => {
    renderDashboard();

    await waitFor(() => expect(mockPatchFieldsMutate).toHaveBeenCalledWith({ lastSeenBuildHash: 'hash-v2' }));
  });

  it('renders "My X" bento tile labels with no gamification numbers (PROJ-76: relocated to Profile → Achievements)', async () => {
    renderDashboard();

    await screen.findByText('My Dashboard');
    expect(screen.getByText('My Journal')).toBeInTheDocument();
    expect(screen.getByText('My Tasks')).toBeInTheDocument();
    expect(screen.getByText('My Vitality')).toBeInTheDocument();
    expect(screen.getByText('My Workbooks')).toBeInTheDocument();
    expect(screen.getByText('My Games')).toBeInTheDocument();
    expect(screen.getByText('My Tools')).toBeInTheDocument();
  });
});
