import { describe, it, expect } from 'vitest';
import { calculateAnswerScoreChange, calculateWagerOutcome, determineWinner } from '../scoring';

describe('🎮 calculateAnswerScoreChange', () => {
    it('awards the face value for a correct answer in the Jeopardy round', () => {
        expect(calculateAnswerScoreChange(400, 'jeopardy', true)).toBe(400);
    });

    it('deducts the face value for an incorrect answer in the Jeopardy round', () => {
        expect(calculateAnswerScoreChange(400, 'jeopardy', false)).toBe(-400);
    });

    it('doubles the value for a correct answer in Double Jeopardy', () => {
        expect(calculateAnswerScoreChange(400, 'double', true)).toBe(800);
    });

    it('doubles the deduction for an incorrect answer in Double Jeopardy', () => {
        expect(calculateAnswerScoreChange(400, 'double', false)).toBe(-800);
    });
});

describe('🎮 calculateWagerOutcome', () => {
    it('wins the full wager on a correct Final Jeopardy answer', () => {
        expect(calculateWagerOutcome(500, true)).toBe(500);
    });

    it('loses the full wager on an incorrect Final Jeopardy answer', () => {
        expect(calculateWagerOutcome(500, false)).toBe(-500);
    });

    it('handles a zero wager safely', () => {
        expect(calculateWagerOutcome(0, true)).toBe(0);
        // `-0` from the `-wager` branch is numerically equal to 0 but fails Object.is;
        // `+ 0` normalizes it back to positive zero for the comparison.
        expect(calculateWagerOutcome(0, false) + 0).toBe(0);
    });
});

describe('🎮 determineWinner', () => {
    it('picks the player with the highest score', () => {
        const players = [
            { name: 'Team A', score: 200 },
            { name: 'Team B', score: 800 },
            { name: 'Team C', score: 500 },
        ];
        expect(determineWinner(players).name).toBe('Team B');
    });

    it('handles negative scores correctly', () => {
        const players = [
            { name: 'Team A', score: -400 },
            { name: 'Team B', score: -100 },
        ];
        expect(determineWinner(players).name).toBe('Team B');
    });

    it('resolves ties to whichever player appears first', () => {
        const players = [
            { name: 'Team A', score: 500 },
            { name: 'Team B', score: 500 },
        ];
        expect(determineWinner(players).name).toBe('Team A');
    });
});
