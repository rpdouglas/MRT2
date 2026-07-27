// src/lib/games/crossword/crosswordLogic.ts
// PROJ-79 (Daily Crossword). Pure grid-build / word-lookup / solve-check
// logic, ported and generalized from the reference mockup
// (docs/reports/DailyCrossword.jsx's buildGrid/wordAt/checkSolved) so it's
// independently unit-testable rather than living inline in the component —
// same upgrade Fast Lane's turnEngine.ts made over its legacy source.
import type { CrosswordWordEntry } from '../../db';
import type { CrosswordGrid, CrosswordDirection } from './types';

export function buildGrid(words: CrosswordWordEntry[], rows: number, cols: number): CrosswordGrid {
  const grid: CrosswordGrid = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => null),
  );

  for (const w of words) {
    for (let i = 0; i < w.answer.length; i++) {
      const r = w.direction === 'down' ? w.row + i : w.row;
      const c = w.direction === 'across' ? w.col + i : w.col;
      if (r < 0 || r >= rows || c < 0 || c >= cols) continue;
      if (!grid[r][c]) grid[r][c] = { letter: w.answer[i], number: null, value: '' };
    }
  }

  for (const w of words) {
    const cell = grid[w.row]?.[w.col];
    if (cell && !cell.number) cell.number = w.number;
  }

  return grid;
}

export function wordAt(
  words: CrosswordWordEntry[],
  row: number,
  col: number,
  direction: CrosswordDirection,
): CrosswordWordEntry | undefined {
  return words.find((w) => {
    if (w.direction !== direction) return false;
    for (let i = 0; i < w.answer.length; i++) {
      const r = w.direction === 'down' ? w.row + i : w.row;
      const c = w.direction === 'across' ? w.col + i : w.col;
      if (r === row && c === col) return true;
    }
    return false;
  });
}

export function isInWord(word: CrosswordWordEntry | undefined, row: number, col: number): boolean {
  if (!word) return false;
  for (let i = 0; i < word.answer.length; i++) {
    const r = word.direction === 'down' ? word.row + i : word.row;
    const c = word.direction === 'across' ? word.col + i : word.col;
    if (r === row && c === col) return true;
  }
  return false;
}

export function checkSolved(grid: CrosswordGrid): boolean {
  for (const row of grid) {
    for (const cell of row) {
      if (cell && cell.value !== cell.letter) return false;
    }
  }
  return true;
}

/** Next cell in a word's direction, or null if it would fall outside the grid/word. */
export function advanceCell(
  grid: CrosswordGrid,
  row: number,
  col: number,
  direction: CrosswordDirection,
  delta: 1 | -1,
): { row: number; col: number } | null {
  const nr = direction === 'down' ? row + delta : row;
  const nc = direction === 'across' ? col + delta : col;
  if (nr < 0 || nr >= grid.length || nc < 0 || nc >= (grid[0]?.length ?? 0)) return null;
  return grid[nr][nc] ? { row: nr, col: nc } : null;
}

// Grid-sizing constants for the fixed-px cell layout (docs/reports/
// DailyCrosswordClassic.jsx's `CELL` constant, generalized here since our
// real generated grids range well beyond that reference's 5-column example
// — crosswordPrompts.ts requests 10-12 words of 5-9 letters each).
const GRID_HORIZONTAL_PADDING = 32; // GameShell's p-4 (16px each side)
const MIN_CELL_PX = 28; // floor for a workable touch target on a wide grid
const MAX_CELL_PX = 44; // ceiling so small grids don't balloon on desktop

/** Fixed cell size (px) so the grid track always matches its cells — never `1fr`. */
export function computeCellPx(viewportWidth: number, cols: number): number {
  if (cols <= 0) return MIN_CELL_PX;
  const available = viewportWidth - GRID_HORIZONTAL_PADDING;
  const raw = Math.floor(available / cols);
  return Math.min(MAX_CELL_PX, Math.max(MIN_CELL_PX, raw));
}

/** Mirrors the reference mockup's keyboard-open heuristic, relative rather than a hardcoded px threshold. */
export function isKeyboardOpen(viewportHeight: number, windowInnerHeight: number): boolean {
  if (windowInnerHeight <= 0) return false;
  return viewportHeight < windowInnerHeight * 0.75;
}
