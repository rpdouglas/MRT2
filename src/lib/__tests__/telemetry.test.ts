import { describe, it, expect, vi, beforeEach } from 'vitest';
import posthog from 'posthog-js';
import {
  safeCapture,
  trackSosOpened,
  trackUrgeSurferCompleted,
  trackGameStarted,
  trackGameCompleted,
  trackBreathworkCompleted,
  trackVitalityLogged,
  trackUncaughtError,
} from '../telemetry';

vi.mock('posthog-js', () => ({
  default: {
    capture: vi.fn(),
  },
}));

describe('Telemetry Wrapper (src/lib/telemetry.ts)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('safeCapture passes events through to posthog.capture', () => {
    safeCapture('test_event', { key: 'value' });
    expect(posthog.capture).toHaveBeenCalledWith('test_event', { key: 'value' });
  });

  it('safeCapture gracefully handles posthog throws', () => {
    vi.mocked(posthog.capture).mockImplementationOnce(() => {
      throw new Error('PostHog error');
    });

    expect(() => safeCapture('test_event')).not.toThrow();
  });

  it('trackSosOpened captures sos_modal_opened', () => {
    trackSosOpened('dashboard');
    expect(posthog.capture).toHaveBeenCalledWith('sos_modal_opened', { source: 'dashboard' });
  });

  it('trackUrgeSurferCompleted captures rounded duration', () => {
    trackUrgeSurferCompleted(300.4);
    expect(posthog.capture).toHaveBeenCalledWith('urge_surfer_completed', { duration_seconds: 300 });
  });

  it('trackGameStarted captures game_started with defaults', () => {
    trackGameStarted('craving-buster');
    expect(posthog.capture).toHaveBeenCalledWith('game_started', {
      game_id: 'craving-buster',
      persona_target: 'general',
    });
  });

  it('trackGameCompleted captures game_completed with score', () => {
    trackGameCompleted('fast-lane', 1200, 'walt');
    expect(posthog.capture).toHaveBeenCalledWith('game_completed', {
      game_id: 'fast-lane',
      score: 1200,
      persona_target: 'walt',
    });
  });

  it('trackBreathworkCompleted captures pattern and duration', () => {
    trackBreathworkCompleted('4-7-8', 180);
    expect(posthog.capture).toHaveBeenCalledWith('breathwork_completed', {
      pattern: '4-7-8',
      duration_seconds: 180,
    });
  });

  it('trackVitalityLogged captures category', () => {
    trackVitalityLogged('Move');
    expect(posthog.capture).toHaveBeenCalledWith('vitality_entry_logged', { category: 'Move' });
  });

  it('trackUncaughtError truncates long stack trace snippets', () => {
    const longStack = 'A'.repeat(500);
    trackUncaughtError('TypeError', longStack);
    expect(posthog.capture).toHaveBeenCalledWith('uncaught_error_captured', {
      error_name: 'TypeError',
      component_stack: 'A'.repeat(200),
    });
  });
});
