/**
 * src/lib/milestones.ts
 * Pure functions for calculating standard recovery milestones.
 */
import { ASSETS } from '../data/assets';

const STANDARD_MILESTONES = [1, 7, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 365];

// PROJ-98 Phase 1: .webp, not .png — same images, ~12x smaller (~44KB vs
// ~560KB each). The .png originals stayed in public/Chips/ under the old
// path here for years; they're deleted now that this is the only consumer.
const MILESTONE_CHIPS: Record<number, string> = {
    30: ASSETS.chips.medallion_01,
    60: ASSETS.chips.medallion_02,
    90: ASSETS.chips.medallion_03,
    120: ASSETS.chips.medallion_04,
    150: ASSETS.chips.medallion_05,
    180: ASSETS.chips.medallion_06,
    210: ASSETS.chips.medallion_07,
    240: ASSETS.chips.medallion_08,
    270: ASSETS.chips.medallion_09,
    300: ASSETS.chips.medallion_10,
    330: ASSETS.chips.medallion_11,
    365: ASSETS.chips.medallion_12,
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
