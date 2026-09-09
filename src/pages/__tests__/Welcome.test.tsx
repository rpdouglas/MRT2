import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Welcome from '../Welcome';

const mockUseAuth = vi.fn();
vi.mock('../../contexts/AuthContext', () => ({ useAuth: (...args: unknown[]) => mockUseAuth(...args) }));

const mockIsAndroidTWA = vi.fn();
vi.mock('../../lib/platform', () => ({ isAndroidTWA: () => mockIsAndroidTWA() }));

vi.mock('posthog-js', () => ({ default: { capture: vi.fn(), identify: vi.fn() } }));

function renderWelcome() {
  return render(
    <MemoryRouter>
      <Welcome />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUseAuth.mockReturnValue({
    user: null,
    loading: false,
    loginWithGoogle: vi.fn(),
    signupWithEmail: vi.fn(),
    loginWithEmail: vi.fn(),
  });
});

// PROJ-116 amendment (2026-09-09): a Play Store TWA visitor already made the
// highest-intent decision (install) before landing here — this branch skips
// the marketing hero/quiz/showcase funnel entirely and goes straight to
// sign-up/login, while the crisis-bypass link must never be conditional on
// platform (David's floor).
describe('Welcome — Android TWA branch (isAndroidTWA)', () => {
  it('skips the marketing funnel and shows only the auth form inside the TWA', () => {
    mockIsAndroidTWA.mockReturnValue(true);
    renderWelcome();

    expect(screen.queryByText(/find your recovery season/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/meet the toolkit/i)).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /begin your toolkit/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/email address/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument();
  });

  it('keeps the crisis-bypass link present inside the TWA', () => {
    mockIsAndroidTWA.mockReturnValue(true);
    renderWelcome();

    expect(screen.getByRole('button', { name: /need help\?/i })).toBeInTheDocument();
  });

  it('renders the full marketing funnel for a normal web visitor', () => {
    mockIsAndroidTWA.mockReturnValue(false);
    renderWelcome();

    expect(screen.getByText(/find your recovery season/i)).toBeInTheDocument();
    expect(screen.getByText(/meet the toolkit/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /need help\?/i })).toBeInTheDocument();
  });
});
