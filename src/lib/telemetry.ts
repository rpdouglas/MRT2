/**
 * src/lib/telemetry.ts
 * PROJ-82: Centralized, ZK-guarded PostHog Telemetry Wrapper.
 * Guarantees zero PII or user-generated disclosures leak to analytics.
 */
import posthog from 'posthog-js';

/**
 * Helper to safely capture events with error boundary protection.
 */
export function safeCapture(eventName: string, properties?: Record<string, unknown>): void {
  try {
    posthog.capture(eventName, properties);
  } catch (error) {
    console.warn(`[Telemetry] Failed to capture event '${eventName}':`, error);
  }
}

/**
 * Crisis Intervention: SOS Panic Button Triggered
 */
export function trackSosOpened(source: 'nav' | 'dashboard' | 'shortcut' = 'nav'): void {
  safeCapture('sos_modal_opened', { source });
}

/**
 * Urge Surfing Session Completed
 */
export function trackUrgeSurferCompleted(durationSeconds: number): void {
  safeCapture('urge_surfer_completed', { duration_seconds: Math.round(durationSeconds) });
}

/**
 * Recovery Game Started
 */
export function trackGameStarted(gameId: string, personaTarget?: string): void {
  safeCapture('game_started', { game_id: gameId, persona_target: personaTarget || 'general' });
}

/**
 * Recovery Game Completed / Progress Saved
 */
export function trackGameCompleted(gameId: string, score: number, personaTarget?: string): void {
  safeCapture('game_completed', {
    game_id: gameId,
    score,
    persona_target: personaTarget || 'general',
  });
}

/**
 * Somatic Breathwork Session Completed
 */
export function trackBreathworkCompleted(pattern: string, durationSeconds: number): void {
  safeCapture('breathwork_completed', { pattern, duration_seconds: Math.round(durationSeconds) });
}

/**
 * Somatic Vitality Logged (Move / Fuel / Breath)
 */
export function trackVitalityLogged(category: string): void {
  safeCapture('vitality_entry_logged', { category });
}

/**
 * Uncaught React Exception Captured in Error Boundary
 */
export function trackUncaughtError(errorName: string, componentStackSnippet?: string): void {
  safeCapture('uncaught_error_captured', {
    error_name: errorName,
    component_stack: componentStackSnippet ? componentStackSnippet.slice(0, 200) : undefined,
  });
}

/**
 * PROJ-94: A Firestore mutation's onError fired. Domain + error identity only —
 * never the mutation's input data, which may contain decrypted content.
 */
export function trackMutationFailed(domain: string, errorName: string): void {
  safeCapture('mutation_failed', { domain, error_name: errorName });
}

/**
 * PROJ-94: A caught error outside the mutation-wrapper pattern (auth state,
 * vault unlock/setup/reset, subscription listeners). Domain + error identity
 * only — never the caught error's full message, which for auth/vault paths
 * could echo back sensitive input.
 */
export function trackClientError(domain: string, errorName: string): void {
  safeCapture('client_error_captured', { domain, error_name: errorName });
}

/**
 * PROJ-99 Phase 5: fires only when the `profile.role === 'admin'` Firestore
 * fallback is the SOLE reason isAdmin resolved true for this session — i.e.
 * the custom claim was absent. Exists to make it safe to converge onto the
 * custom claim alone later: once this stops firing for a reasonable period,
 * every real admin account already has the claim and the fallback can be
 * removed with confidence instead of a guess. No PII — no uid, no email.
 */
export function trackAdminRoleFallbackUsed(): void {
  safeCapture('admin_role_fallback_used');
}
