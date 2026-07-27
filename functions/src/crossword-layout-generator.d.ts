// Minimal type declaration for crossword-layout-generator (no upstream @types).
// PROJ-79: deterministic, non-AI grid-interlocking library — the AI never
// computes grid coordinates, per docs/projects/79_DAILY_CROSSWORD.md §Phase 1.
declare module "crossword-layout-generator" {
    export interface CrosswordInputWord {
        clue: string;
        answer: string;
    }

    export interface CrosswordResultWord {
        clue: string;
        answer: string;
        startx?: number; // 1-indexed column
        starty?: number; // 1-indexed row
        position?: number; // clue number
        orientation: "across" | "down" | "none"; // "none" = dropped, failed to interlock
    }

    export interface CrosswordLayout {
        rows: number;
        cols: number;
        table: string[][];
        table_string: string;
        result: CrosswordResultWord[];
    }

    export function generateLayout(words: CrosswordInputWord[]): CrosswordLayout;
}
