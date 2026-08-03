import { format } from 'date-fns';
import type { ROSCAssessment, ROSCTrajectory } from './types/rosc';
import { toDateSafe, type ROSCCadence } from './roscCadence';

export interface ROSCTrendPoint {
    ts: number;
    label: string;
    health: number;
    home: number;
    purpose: number;
    community: number;
    total: number;
    trajectory: ROSCTrajectory;
}

const DEFAULT_WINDOW = 12;

export function buildROSCTrendSeries(
    assessments: ROSCAssessment[],
    cadence: ROSCCadence,
    windowSize: number = DEFAULT_WINDOW
): ROSCTrendPoint[] {
    const points = assessments
        .map((a): ROSCTrendPoint | null => {
            const date = toDateSafe(a.createdAt);
            if (!date) return null;
            return {
                ts: date.getTime(),
                label: format(date, cadence === 'weekly' ? 'MMM d' : 'MMM yy'),
                health: a.scores.health.score,
                home: a.scores.home.score,
                purpose: a.scores.purpose.score,
                community: a.scores.community.score,
                total: a.totalScore,
                trajectory: a.trajectory,
            };
        })
        .filter((p): p is ROSCTrendPoint => p !== null)
        .sort((a, b) => a.ts - b.ts);

    if (windowSize <= 0 || points.length <= windowSize) return points;
    return points.slice(points.length - windowSize);
}

export function summariseTrendForA11y(points: ROSCTrendPoint[]): string {
    if (points.length === 0) return 'No Recovery Capital check-ins yet.';
    if (points.length === 1) {
        return `One check-in so far, total score ${points[0].total} out of 40.`;
    }
    const first = points[0];
    const last = points[points.length - 1];
    const delta = last.total - first.total;
    const direction = delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat';
    return `Recovery Capital trend across ${points.length} check-ins from ${first.label} to ${last.label}: total score ${direction} ${Math.abs(delta)} points, latest total ${last.total} out of 40, trajectory ${last.trajectory}.`;
}
