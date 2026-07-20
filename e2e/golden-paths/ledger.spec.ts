import { test, expect } from '../fixtures/emulator';

/**
 * Golden Path 3 — The Ledger Test.
 * Create a task, complete it, confirm the completion pipeline worked.
 *
 * Deviation from the original spec (recorded in docs/projects/23_QA_SENTINEL.md):
 * the original spec asserted "the Dashboard Streak/Fire increments," but
 * Dashboard's visible streak figures are journal/vitality-specific
 * (stats.journal.streak, stats.vitality.bioStreak) — not task-completion
 * counters. The Tasks page's own momentum indicator, RhythmScoreRing, only
 * tracks *recurring* task completions over a 14-day window and only renders
 * once the score is > 0 — too fragile a target for a single one-time-task
 * completion from a brand-new test user. Asserting the Today -> Log tab
 * transition (PROJ-47's actionability-based routing) is the more reliably
 * grounded proof that the completion pipeline actually ran end-to-end.
 */
test('completing a task moves it from Today to the Log tab', async ({ page }) => {
  const taskTitle = `E2E ledger task ${Date.now()}`;

  await page.goto('/tasks');
  await page.getByRole('button', { name: 'Add task' }).click();
  await page.getByPlaceholder('e.g. Morning Routine...').fill(taskTitle);
  await page.getByRole('button', { name: 'Create Task' }).click();

  await expect(page.getByText(taskTitle)).toBeVisible({ timeout: 10_000 });

  await page.getByRole('button', { name: 'Mark task complete' }).click();

  await page.getByRole('button', { name: 'Log' }).click();
  await expect(page.getByText(taskTitle)).toBeVisible({ timeout: 10_000 });
});
