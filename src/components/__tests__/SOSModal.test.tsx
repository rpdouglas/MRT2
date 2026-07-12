/**
 * src/components/__tests__/SOSModal.test.tsx
 * PROJ-59: smoke test added as part of migrating this file's raw
 * getDoc('users/{uid}') onto the shared useUserProfile() hook (David's
 * crisis path — previously zero coverage).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SOSModal from '../SOSModal';

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { uid: 'test-user-123' } }),
}));

const mockGetProfile = vi.fn();
vi.mock('../../lib/db', () => ({
  getProfile: (...args: unknown[]) => mockGetProfile(...args),
  updateProfileData: vi.fn(),
}));

vi.mock('../../lib/firebase', () => ({ db: { type: 'mock-db' } }));

function renderSOSModal(onClose = vi.fn()) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <SOSModal isOpen onClose={onClose} />
      </BrowserRouter>
    </QueryClientProvider>,
  );
}

describe('SOSModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows the sponsor-contact card when the profile has sponsor info', async () => {
    mockGetProfile.mockResolvedValue({ sponsorName: 'Alex', sponsorPhone: '5551234567' });

    renderSOSModal();

    expect(await screen.findByText('Contact Alex')).toBeInTheDocument();
    expect(screen.queryByText('Add Sponsor Contact Info')).not.toBeInTheDocument();
  });

  it('falls back to the "Add Sponsor" prompt when no sponsor is set, without crashing', async () => {
    mockGetProfile.mockResolvedValue({});

    renderSOSModal();

    expect(await screen.findByText('Add Sponsor Contact Info')).toBeInTheDocument();
    expect(screen.queryByText('Contact Support')).not.toBeInTheDocument();
  });

  it('always renders the immediate-support crisis options regardless of profile state', async () => {
    mockGetProfile.mockResolvedValue(null);

    renderSOSModal();

    expect(screen.getByText('Call 988 (Lifeline)')).toBeInTheDocument();
    expect(screen.getByText('Call 911')).toBeInTheDocument();
  });
});
