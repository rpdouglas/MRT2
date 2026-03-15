/**
 * src/lib/financial.ts
 * PURPOSE: Pure functions for financial calculations.
 * Extracting this from the UI ensures strict mathematical testability 
 * and prevents floating-point drift.
 */

export type CostFrequency = 'daily' | 'weekly' | 'monthly';

/**
 * Calculates total money saved based on clean time and self-reported cost.
 * @param cost - The raw cost entered by the user
 * @param frequency - How often the cost is incurred
 * @param totalDaysClean - Total sober days
 * @returns Unformatted raw savings number
 */
export function calculateSavings(
    cost: number | undefined | null,
    frequency: CostFrequency | undefined | null,
    totalDaysClean: number
): number {
    if (!cost || cost <= 0 || totalDaysClean <= 0) return 0;
    
    const freq = frequency || 'daily';
    let dailyCost = cost;
    
    if (freq === 'weekly') {
        dailyCost = cost / 7;
    } else if (freq === 'monthly') {
        // Average days in a month (365.25 / 12)
        dailyCost = cost / 30.4375;
    }
    
    return dailyCost * totalDaysClean;
}
