/**
 * src/lib/milestones.ts
 * Pure functions for calculating standard recovery milestones.
 */

const STANDARD_MILESTONES = [1, 7, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 365];

// PROJ-98 Phase 1: .webp, not .png — same images, ~12x smaller (~44KB vs
// ~560KB each). The .png originals stayed in public/Chips/ under the old
// path here for years; they're deleted now that this is the only consumer.
export const MILESTONE_CHIPS: Record<number, string> = {
    30: '/Chips/medallion_01.webp',
    60: '/Chips/medallion_02.webp',
    90: '/Chips/medallion_03.webp',
    120: '/Chips/medallion_04.webp',
    150: '/Chips/medallion_05.webp',
    180: '/Chips/medallion_06.webp',
    210: '/Chips/medallion_07.webp',
    240: '/Chips/medallion_08.webp',
    270: '/Chips/medallion_09.webp',
    300: '/Chips/medallion_10.webp',
    330: '/Chips/medallion_11.webp',
    365: '/Chips/medallion_12.webp',
};

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
 * Returns the web path for the associated milestone chip, if one exists.
 */
export function getMilestoneImage(totalDays: number): string | null {
    return MILESTONE_CHIPS[totalDays] || null;
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
    if (totalDays === 120) return '4 Months';
    if (totalDays === 150) return '5 Months';
    if (totalDays === 180) return '6 Months';
    if (totalDays === 210) return '7 Months';
    if (totalDays === 240) return '8 Months';
    if (totalDays === 270) return '9 Months';
    if (totalDays === 300) return '10 Months';
    if (totalDays === 330) return '11 Months';
    
    if (totalDays > 0 && totalDays % 365 === 0) {
        const years = totalDays / 365;
        return `${years} Year${years > 1 ? 's' : ''}`;
    }
    
    return `${totalDays} Days`;
}
