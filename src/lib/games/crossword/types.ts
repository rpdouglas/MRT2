// src/lib/games/crossword/types.ts
// PROJ-79 (Daily Crossword). Client-side grid types, distinct from
// CrosswordPuzzleRecord (src/lib/db.ts) — that's the stored/fetched shape,
// this is the mutable in-session solving state built from it.

export interface GridCell {
  letter: string;
  number: number | null;
  value: string;
}

export type CrosswordGrid = (GridCell | null)[][];

export type CrosswordDirection = 'across' | 'down';

export interface CrosswordSelection {
  row: number;
  col: number;
}
