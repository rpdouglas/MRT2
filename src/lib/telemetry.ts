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
 * PROJ-116: Welcome-page "Find Your Recovery Season" quiz funnel + crisis
 * bypass. Persona is always the resolved lowercase id (e.g. 'maya'), never
 * free-text answers — no quiz-answer transcript is ever sent.
 */
export function trackQuizStarted(): void {
  safeCapture('welcome_quiz_started');
}

export function trackQuizQuestionAnswered(questionNumber: 1 | 2 | 3 | 4): void {
  safeCapture('welcome_quiz_question_answered', { question_number: questionNumber });
}

export function trackQuizCompleted(persona: string): void {
  safeCapture('welcome_quiz_completed', { persona });
}

/**
 * A visitor clicked a persona's CTA directly from the trimmed showcase,
 * skipping the quiz — the self-identifying-visitor path SPEC-WELCOMEPAGE-002
 * §6 asks to carry the same persona-tagged funnel continuity as a quiz completion.
 */
export function trackShowcaseCardClicked(persona: string): void {
  safeCapture('welcome_showcase_card_clicked', { persona });
}

export function trackCrisisResourcesOpened(): void {
  safeCapture('crisis_resources_opened', { source: 'welcome_page' });
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
