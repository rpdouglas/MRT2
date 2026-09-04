import { startOfDay, subDays, isBefore, parseISO, format } from 'date-fns';
import type { MatDoseLog } from './db';

/**
 * Computes a 0–100 dose-compliance percentage from a window of MAT dose logs.
 *
 * Same forgiving day-Set-dedup shape as rhythmScore.ts's computeRhythmScore
 * (one missed day out of N is a small dent, not a reset to zero) — kept as a
 * parallel function rather than reusing computeRhythmScore directly, since
 * that function's signature is Task[]-shaped and mat_doses isn't a Task.
 * Deliberately kept forgiving, not stricter: per CLAUDE.md's crisis-first
 * "no punishing streak-breaks" principle, MRT isn't a clinical adherence
 * monitor, and a harsher number for a missed dose day risks feeling punitive
 * in exactly the way Jordan's persona documentation says the app must not.
 */
export function computeMatComplianceRate(doses: MatDoseLog[], days: number): number {
  if (days <= 0) return 0;

  const today = startOfDay(new Date());
  const windowStart = subDays(today, days - 1); // inclusive N-day window

  const loggedDays = new Set<string>();

  for (const dose of doses) {
    if (!dose.date) continue;
    const loggedDate = startOfDay(parseISO(dose.date));
    if (isBefore(loggedDate, windowStart)) continue;

    loggedDays.add(format(loggedDate, 'yyyy-MM-dd'));
  }

  return Math.round((loggedDays.size / days) * 100);
}
