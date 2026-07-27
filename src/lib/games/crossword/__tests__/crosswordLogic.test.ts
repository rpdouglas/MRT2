// src/lib/games/crossword/__tests__/crosswordLogic.test.ts
// PROJ-79 (Daily Crossword). Fixture mirrors docs/reports/DailyCrossword.jsx's
// reference WORDS/ROWS/COLS so behavior parity with the mockup is verifiable.
import { describe, it, expect } from 'vitest';
import type { CrosswordWordEntry } from '../../../db';
import { buildGrid, wordAt, isInWord, checkSolved, advanceCell, computeCellPx, isKeyboardOpen } from '../crosswordLogic';

const word = (overrides: Partial<CrosswordWordEntry>): CrosswordWordEntry => ({
  answer: '',
  clue: '',
  clueStyle: 'dictionary',
  hint: null,
  themed: false,
  difficulty: 'mid',
  number: 0,
  row: 0,
  col: 0,
  direction: 'across',
  ...overrides,
});

const WORDS: CrosswordWordEntry[] = [
  word({ number: 1, direction: 'across', row: 0, col: 0, answer: 'SPACE', clue: 'Where boundaries create room to breathe' }),
  word({ number: 1, direction: 'down', row: 0, col: 0, answer: 'SELF', clue: "Who you're accountable to first" }),
  word({ number: 2, direction: 'down', row: 0, col: 2, answer: 'ARM', clue: 'Limb, or a support you lean on' }),
  word({ number: 3, direction: 'across', row: 2, col: 0, answer: 'LIMIT', clue: 'What a boundary sets' }),
];
const ROWS = 4;
const COLS = 5;

describe('buildGrid', () => {
  it('places every letter of every word', () => {
    const grid = buildGrid(WORDS, ROWS, COLS);
    expect(grid[0][0]?.letter).toBe('S'); // SPACE[0] / SELF[0] overlap
    expect(grid[0][1]?.letter).toBe('P');
    expect(grid[0][2]?.letter).toBe('A'); // SPACE[2] / ARM[0] overlap
    expect(grid[1][2]?.letter).toBe('R');
    expect(grid[2][0]?.letter).toBe('L'); // LIMIT[0] / SELF[2] overlap
  });

  it('leaves non-word cells null', () => {
    const grid = buildGrid(WORDS, ROWS, COLS);
    expect(grid[3][4]).toBeNull();
  });

  it('assigns the clue number only at each word\'s start cell', () => {
    const grid = buildGrid(WORDS, ROWS, COLS);
    expect(grid[0][0]?.number).toBe(1);
    expect(grid[0][2]?.number).toBe(2);
    expect(grid[2][0]?.number).toBe(3);
    expect(grid[0][1]?.number).toBeNull();
  });

  it('initializes every cell value to empty', () => {
    const grid = buildGrid(WORDS, ROWS, COLS);
    expect(grid[0][0]?.value).toBe('');
  });
});

describe('wordAt', () => {
  it('finds the across word covering a cell', () => {
    expect(wordAt(WORDS, 0, 3, 'across')?.answer).toBe('SPACE');
  });

  it('finds the down word covering a cell', () => {
    expect(wordAt(WORDS, 1, 0, 'down')?.answer).toBe('SELF');
  });

  it('returns undefined when no word exists in that direction at that cell', () => {
    expect(wordAt(WORDS, 0, 1, 'down')).toBeUndefined();
  });
});

describe('isInWord', () => {
  it('is true for every cell the word covers', () => {
    const arm = wordAt(WORDS, 0, 2, 'down');
    expect(isInWord(arm, 0, 2)).toBe(true);
    expect(isInWord(arm, 1, 2)).toBe(true);
    expect(isInWord(arm, 2, 2)).toBe(true);
  });

  it('is false for a cell outside the word', () => {
    const arm = wordAt(WORDS, 0, 2, 'down');
    expect(isInWord(arm, 0, 0)).toBe(false);
  });

  it('is false when word is undefined', () => {
    expect(isInWord(undefined, 0, 0)).toBe(false);
  });
});

describe('checkSolved', () => {
  it('is false while any cell mismatches its letter', () => {
    const grid = buildGrid(WORDS, ROWS, COLS);
    expect(checkSolved(grid)).toBe(false);
  });

  it('is true once every cell value matches its letter', () => {
    const grid = buildGrid(WORDS, ROWS, COLS);
    for (const row of grid) {
      for (const cell of row) {
        if (cell) cell.value = cell.letter;
      }
    }
    expect(checkSolved(grid)).toBe(true);
  });
});

describe('advanceCell', () => {
  it('moves forward within an across word', () => {
    const grid = buildGrid(WORDS, ROWS, COLS);
    expect(advanceCell(grid, 0, 0, 'across', 1)).toEqual({ row: 0, col: 1 });
  });

  it('moves forward within a down word', () => {
    const grid = buildGrid(WORDS, ROWS, COLS);
    expect(advanceCell(grid, 0, 0, 'down', 1)).toEqual({ row: 1, col: 0 });
  });

  it('returns null when the next cell is out of grid bounds', () => {
    const grid = buildGrid(WORDS, ROWS, COLS);
    expect(advanceCell(grid, 0, 0, 'across', -1)).toBeNull();
  });

  it('returns null when the next cell is a blocked (non-word) cell', () => {
    const grid = buildGrid(WORDS, ROWS, COLS);
    expect(advanceCell(grid, 3, 3, 'across', 1)).toBeNull();
  });
});

describe('computeCellPx', () => {
  it('shrinks toward the floor for a wide grid on a narrow screen', () => {
    // 13 cols on an iPhone SE-width viewport
    expect(computeCellPx(320, 13)).toBe(28);
  });

  it('clamps to the ceiling for a small grid on a wide screen', () => {
    expect(computeCellPx(1440, 5)).toBe(44);
  });

  it('computes a fixed track size that matches the reference mockup for its example grid', () => {
    // Reference mockup: 5 cols in a 420px-max-width container.
    expect(computeCellPx(420, 5)).toBe(44); // clamps to ceiling since (420-32)/5 > 44
  });

  it('falls back to the floor for a non-positive column count', () => {
    expect(computeCellPx(400, 0)).toBe(28);
  });
});

describe('isKeyboardOpen', () => {
  it('is false when the visual viewport matches the full window height', () => {
    expect(isKeyboardOpen(800, 800)).toBe(false);
  });

  it('is true once the visual viewport shrinks below the threshold', () => {
    expect(isKeyboardOpen(400, 800)).toBe(true);
  });

  it('is false for a small shrink that is not the keyboard (e.g. browser chrome)', () => {
    expect(isKeyboardOpen(700, 800)).toBe(false);
  });

  it('is false when windowInnerHeight is not yet known', () => {
    expect(isKeyboardOpen(400, 0)).toBe(false);
  });
});
