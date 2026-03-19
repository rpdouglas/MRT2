/**
 * src/lib/milestones.ts
 * Pure functions for calculating standard recovery milestones.
 */

const STANDARD_MILESTONES = [1, 7, 30, 60, 90, 180, 270];

/**
 * Checks if the total days clean constitutes a major milestone.
 * Returns the milestone number if true, otherwise null.
 */
export function getMilestone(totalDays: number): number | null {
    if (totalDays <= 0) return null;
    
    // Check standard day/month milestones
    if (STANDARD_MILESTONES.includes(totalDays)) return totalDays;
    
    // Check yearly milestones
    if (totalDays % 365 === 0) return totalDays;

    return null;
}

/**
 * Returns a human-readable label for a given milestone day.
 */
export function getMilestoneLabel(totalDays: number): string {
    if (totalDays === 1) return '24 Hours';
    if (totalDays === 7) return '1 Week';
    if (totalDays === 30) return '1 Month';
    if (totalDays === 60) return '2 Months';
    if (totalDays === 90) return '3 Months';
    if (totalDays === 180) return '6 Months';
    if (totalDays === 270) return '9 Months';
    
    if (totalDays > 0 && totalDays % 365 === 0) {
        const years = totalDays / 365;
        return `${years} Year${years > 1 ? 's' : ''}`;
    }
    
    return `${totalDays} Days`;
}
