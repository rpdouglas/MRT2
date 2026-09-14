/**
 * src/pages/__tests__/Dashboard.test.tsx
 * PROJ-59: smoke test added as part of migrating this file's duplicated
 * profile-fetch and raw updateDoc build-hash write onto
 * useUserProfile()/patchFields (previously zero coverage).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { format } from 'date-fns';
import Dashboard from '../Dashboard';

let mockDriveAccessToken: string | null = null;
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { uid: 'test-user-123' }, driveAccessToken: mockDriveAccessToken }),
}));

vi.mock('../../lib/versioning', () => ({
  useBuildInfo: () => ({ env: 'DEV', branch: 'main', globalHash: 'hash-v2', coreHash: 'core-v2', buildTime: '2026-01-01' }),
}));

vi.mock('../../lib/firebase', () => ({ db: { type: 'mock-db' } }));

const mockPatchFieldsMutate = vi.fn();
let mockProfile: Record<string, unknown> = { sobrietyDate: null, lastSeenBuildHash: 'hash-v1' };
vi.mock('../../hooks/useUserProfile', () => ({
  useUserProfile: () => ({
    profile: mockProfile,
    isLoading: false,
    patchFields: { mutate: mockPatchFieldsMutate },
  }),
}));

// PROJ-113 follow-up: the daily image's manual re-open trigger moved from
// VibrantHeader's extraAction into DynamicAnchorWidget's dropdown, to fix
// the header's centering — this mock surfaces the two props Dashboard now
// passes through, so the wiring itself has coverage.
vi.mock('../../components/dashboard/DynamicAnchorWidget', () => ({
  default: ({ dailyImageAvailable, onViewDailyImage }: { dailyImageAvailable?: boolean; onViewDailyImage?: () => void }) => (
    <div>
      Anchor Widget
      {dailyImageAvailable && <span>Image Available</span>}
      <button onClick={onViewDailyImage}>Open Image</button>
    </div>
  ),
}));
vi.mock('../../components/SobrietyHero', () => ({ default: () => <div>Sobriety Hero</div> }));
vi.mock('../../components/NotificationBanner', () => ({ default: () => null }));
vi.mock('../../components/VibrantHeader', () => ({ default: ({ title }: { title: string }) => <h1>{title}</h1> }));
vi.mock('../../components/dashboard/DailyImageModal', () => ({ default: () => <div>Daily Image Modal</div> }));
vi.mock('react-confetti', () => ({ default: () => null }));

const mockUseDailyImage = vi.fn(() => ({ dailyImage: null as Record<string, unknown> | null }));
vi.mock('../../hooks/useDailyImage', () => ({
  useDailyImage: () => mockUseDailyImage(),
}));

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
    mockDriveAccessToken = null;
    mockProfile = { sobrietyDate: null, lastSeenBuildHash: 'hash-v1' };
    mockUseDailyImage.mockReturnValue({ dailyImage: null });
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

  describe('Daily Image trigger (PROJ-113 follow-up: moved out of VibrantHeader into DynamicAnchorWidget)', () => {
    it('does not mark the image available when none exists for today', async () => {
      renderDashboard();

      await screen.findByText('My Dashboard');
      expect(screen.queryByText('Image Available')).not.toBeInTheDocument();
    });

    it('passes dailyImageAvailable through and opens DailyImageModal when the widget calls onViewDailyImage', async () => {
      // lastSeenDailyImageDate set to today so the separate once-per-day
      // auto-popup effect doesn't also open the modal, keeping this test
      // isolated to the manual onViewDailyImage trigger.
      mockProfile = { sobrietyDate: null, lastSeenBuildHash: 'hash-v2', lastSeenDailyImageDate: format(new Date(), 'yyyy-MM-dd') };
      mockUseDailyImage.mockReturnValue({ dailyImage: { date: 'mock', imageId: 'mock-image' } });
      renderDashboard();

      expect(await screen.findByText('Image Available')).toBeInTheDocument();
      expect(screen.queryByText('Daily Image Modal')).not.toBeInTheDocument();

      fireEvent.click(screen.getByText('Open Image'));
      expect(await screen.findByText('Daily Image Modal')).toBeInTheDocument();
    });
  });

  describe('Backup Alert (TD-24: surfacing a silently-failing Drive auto-backup)', () => {
    it('shows the "no Drive connected" nudge when Drive is not connected and no recent export exists', async () => {
      mockDriveAccessToken = null;
      mockProfile = { sobrietyDate: null, lastSeenBuildHash: 'hash-v2' };
      renderDashboard();

      expect(await screen.findByText(/It's been a week since your last save/i)).toBeInTheDocument();
    });

    it('stays silent when Drive is connected and no failure has been recorded, even with no lastExportAt yet', async () => {
      mockDriveAccessToken = 'a-real-drive-token';
      mockProfile = { sobrietyDate: null, lastSeenBuildHash: 'hash-v2' };
      renderDashboard();

      await screen.findByText('My Dashboard');
      expect(screen.queryByText(/Backup Needed/i)).not.toBeInTheDocument();
    });

    it('surfaces a distinct message when a Drive-connected auto-backup has failed — regression: this case was previously never shown at all', async () => {
      mockDriveAccessToken = 'a-real-drive-token';
      mockProfile = { sobrietyDate: null, lastSeenBuildHash: 'hash-v2', lastAutoBackupFailedAt: { toMillis: () => Date.now() } };
      renderDashboard();

      expect(await screen.findByText(/Your last Google Drive backup didn't go through/i)).toBeInTheDocument();
    });
  });
});
