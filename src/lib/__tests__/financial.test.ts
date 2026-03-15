/**
 * src/lib/__tests__/financial.test.ts
 * QA: Strict mathematical verification for the Financial Freedom engine.
 */
import { describe, it, expect } from 'vitest';
import { calculateSavings } from '../financial';

describe('💰 Financial Math Engine', () => {
    it('1. should return 0 if cost or days are 0 or missing', () => {
        expect(calculateSavings(0, 'daily', 10)).toBe(0);
        expect(calculateSavings(10, 'daily', 0)).toBe(0);
        expect(calculateSavings(null, 'weekly', 10)).toBe(0);
        expect(calculateSavings(undefined, undefined, 10)).toBe(0);
        expect(calculateSavings(-15, 'daily', 10)).toBe(0);
    });

    it('2. should calculate daily savings accurately', () => {
        expect(calculateSavings(15, 'daily', 10)).toBe(150);
        expect(calculateSavings(5.50, 'daily', 2)).toBe(11);
    });

    it('3. should calculate weekly savings accurately', () => {
        // $70 per week = $10 per day. 10 days = $100
        expect(calculateSavings(70, 'weekly', 10)).toBe(100);
    });

    it('4. should calculate monthly savings accurately', () => {
        // $304.375 per month = $10 per day. 10 days = $100
        const savings = calculateSavings(304.375, 'monthly', 10);
        expect(Math.round(savings)).toBe(100);
    });

    it('5. should default to daily if frequency is omitted or invalid', () => {
        // frequency is explicitly typed to allow null, so no ts-expect-error needed.
        expect(calculateSavings(20, null, 5)).toBe(100);
    });
});
