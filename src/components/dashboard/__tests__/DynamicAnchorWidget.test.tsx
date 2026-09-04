/**
 * src/components/dashboard/__tests__/DynamicAnchorWidget.test.tsx
 * PROJ-59: smoke test added as part of migrating this file's duplicated
 * profile-fetch and raw updateDoc write onto useUserProfile()/patchFields
 * (previously zero coverage).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DynamicAnchorWidget from '../DynamicAnchorWidget';

vi.mock('../../../hooks/useTimeOfDay', () => ({
  useTimeOfDay: () => 'morning',
  TIME_BASED_PROMPTS: { morning: 'How are you starting your day?' },
}));

vi.mock('../../../hooks/useAnchorStatus', () => ({
  useAnchorStatus: () => ({ needsCheckIn: false, needsReading: false }),
}));

vi.mock('../../../contexts/EncryptionContext', () => ({
  useEncryption: () => ({ isVaultUnlocked: true }),
}));

vi.mock('../../../hooks/useDailyReading', () => ({
  useAllDailyReadings: () => [],
}));

const mockMarkAsRead = { mutate: vi.fn() };
vi.mock('../../../hooks/useReadingPreferences', () => ({
  useReadingPreferences: () => ({
    preferences: null,
    activeModality: 'twelve-step-aa',
    hasReadToday: false,
    markAsRead: mockMarkAsRead,
  }),
  ALL_MODALITIES: ['twelve-step-aa'],
}));

const mockPatchFieldsMutateAsync = vi.fn().mockResolvedValue(undefined);
const mockUseUserProfile = vi.fn(() => ({
  profile: { anchorSettings: { defaultFellowship: 'DEFAULT' } } as Record<string, unknown>,
  patchFields: { mutateAsync: mockPatchFieldsMutateAsync },
}));
vi.mock('../../../hooks/useUserProfile', () => ({
  useUserProfile: () => mockUseUserProfile(),
}));

const mockLogDose = vi.fn().mockResolvedValue(undefined);
vi.mock('../../../hooks/useMatDoseLog', () => ({
  useMatDoseLog: () => ({ todaysDose: null, logDose: mockLogDose, isLogging: false }),
}));

vi.mock('../../journal/JournalEditor', () => ({ default: () => <div>Journal Editor</div> }));
vi.mock('../../VaultGate', () => ({ default: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock('../../readings/ReadingModal', () => ({ default: () => <div>Reading Modal</div> }));

function renderWidget() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <DynamicAnchorWidget />
    </QueryClientProvider>,
  );
}

describe('DynamicAnchorWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseUserProfile.mockReturnValue({
      profile: { anchorSettings: { defaultFellowship: 'DEFAULT' } },
      patchFields: { mutateAsync: mockPatchFieldsMutateAsync },
    });
  });

  it('renders the Check-In and Daily Reading cards', () => {
    renderWidget();

    expect(screen.getByText('Morning Check-In')).toBeInTheDocument();
    expect(screen.getByText('Daily Reading')).toBeInTheDocument();
  });

  it('does not render the Log Dose card when matModeEnabled is unset (PROJ-111)', () => {
    renderWidget();

    expect(screen.queryByText('Log Dose')).not.toBeInTheDocument();
  });

  it('renders and can tap the Log Dose card when matModeEnabled is true (PROJ-111)', async () => {
    mockUseUserProfile.mockReturnValue({
      profile: { anchorSettings: { defaultFellowship: 'DEFAULT' }, matModeEnabled: true },
      patchFields: { mutateAsync: mockPatchFieldsMutateAsync },
    });
    renderWidget();

    const logDoseButton = screen.getByText('Log Dose');
    expect(logDoseButton).toBeInTheDocument();

    fireEvent.click(logDoseButton);
    await waitFor(() => expect(mockLogDose).toHaveBeenCalledWith());
  });

  it('opens the journal overlay when the Check-In card is clicked', () => {
    renderWidget();

    fireEvent.click(screen.getByText('Morning Check-In'));

    expect(screen.getByText('Journal Editor')).toBeInTheDocument();
  });

  it('bumps anchorSettings.lastReadingDate via patchFields when a fellowship reading link is opened', async () => {
    window.open = vi.fn();
    renderWidget();

    // No in-app readings available, so the primary click falls back to the
    // external fellowship link path that calls updateReadingDate().
    fireEvent.click(screen.getByText('Daily Reading'));

    await waitFor(() => expect(mockPatchFieldsMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({ 'anchorSettings.lastReadingDate': expect.any(String) }),
    ));
  });
});
