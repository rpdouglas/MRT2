// src/components/games/crossword/DailyCrossword.tsx
// PROJ-79 (Recovery Games), 8th entry. Ported from the reference mockup
// (docs/reports/DailyCrossword.jsx) onto real data via useDailyCrossword,
// wrapped in GameShell like every other Recovery Game (Strategy fit chosen
// in /planning: consistent chrome over the mockup's bespoke header — see
// docs/projects/79_DAILY_CROSSWORD.md). The mockup's somatic-action colors
// (cyan-500 selected cell, cyan-100 in-word highlight) are kept on the grid
// itself, where the source spec's interaction-feedback requirements
// actually apply.
//
// Anti-shame requirements from the source spec (§5.4), all enforced here:
// no wrong-answer flagging mid-solve, no "hint used" indicator, no timer/
// streak/score. `useGameSession`'s score badge is deliberately never
// engaged (no startSession/setScore calls) so GameHeader never shows one.
//
// Grid parity follow-up vs. docs/reports/DailyCrosswordClassic.jsx: adopted
// its fixed-px cell technique (computeCellPx) instead of `1fr` columns, and
// its `visualViewport` keyboard-open tracking (isKeyboardOpen) — both scoped
// to this component's own content rather than the shared GameHeader/
// GameFooter, which sit outside this render tree.
import { useState, useRef, useMemo, useEffect, useCallback, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircleIcon, LightBulbIcon } from '@heroicons/react/24/outline';
import GameShell from '../GameShell';
import { useGameProgress } from '../../../hooks/useGameProgress';
import { useDailyCrossword } from '../../../hooks/useDailyCrossword';
import {
  buildGrid,
  wordAt,
  isInWord,
  checkSolved,
  advanceCell,
  computeCellPx,
  isKeyboardOpen,
} from '../../../lib/games/crossword/crosswordLogic';
import type { CrosswordGrid, CrosswordDirection, CrosswordSelection } from '../../../lib/games/crossword/types';
import type { CrosswordWordEntry } from '../../../lib/db';

const SOMATIC_SELECTED = '#06B6D4'; // somatic-action-primary
const SOMATIC_IN_WORD = '#CFFAFE'; // somatic-action-muted

interface CrosswordGameProps {
  words: CrosswordWordEntry[];
  rows: number;
  cols: number;
  theme: string;
  themeIntro: string;
  insightCard: { text: string; frameworkTags: string[] };
}

function CrosswordGame({ words, rows, cols, theme, themeIntro, insightCard }: CrosswordGameProps) {
  const navigate = useNavigate();
  const { recordProgress } = useGameProgress();
  const inputRef = useRef<HTMLInputElement>(null);
  const startedAtRef = useRef<number>(0);
  const hintCountRef = useRef(0);
  const revealCountRef = useRef(0);

  const [grid, setGrid] = useState<CrosswordGrid>(() => buildGrid(words, rows, cols));
  const [selected, setSelected] = useState<CrosswordSelection>(() => {
    const first = words[0];
    return first ? { row: first.row, col: first.col } : { row: 0, col: 0 };
  });
  const [direction, setDirection] = useState<CrosswordDirection>('across');
  const [solved, setSolved] = useState(false);
  // Tracks which word a hint was requested for (by reference — `words` is a
  // stable prop array, so wordAt() returns the same object across renders)
  // rather than a plain boolean, so switching words clears the hint without
  // needing a setState-in-effect to reset it.
  const [hintedWord, setHintedWord] = useState<CrosswordWordEntry | undefined>(undefined);
  const [showInsight, setShowInsight] = useState(false);
  // Tracks the visible viewport (above the on-screen keyboard), not the full
  // screen — same intent as the reference mockup's window.visualViewport
  // tracking, but scoped to this component's own content since GameShell's
  // shared GameHeader/GameFooter sit outside CrosswordGame's render tree.
  const [viewport, setViewport] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 400,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  }));

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const handler = () => setViewport({ width: vv.width, height: vv.height });
    handler();
    vv.addEventListener('resize', handler);
    return () => vv.removeEventListener('resize', handler);
  }, []);

  const keyboardOpen = isKeyboardOpen(viewport.height, window.innerHeight);
  const cellPx = useMemo(() => computeCellPx(viewport.width, cols), [viewport.width, cols]);

  const currentWord = useMemo(
    () => wordAt(words, selected.row, selected.col, direction),
    [words, selected, direction],
  );
  const showHint = hintedWord === currentWord;

  const focusHidden = useCallback(() => inputRef.current?.focus(), []);
  useEffect(() => {
    startedAtRef.current = Date.now();
    focusHidden();
  }, [focusHidden]);

  const handleSolved = useCallback((finishedGrid: CrosswordGrid) => {
    if (!checkSolved(finishedGrid)) return;
    setSolved(true);
    setShowInsight(true);
    recordProgress({
      gameId: 'daily-crossword',
      personaTarget: 'All',
      score: 0, // deliberately unscored — see the source spec's "not the point" framing
      stats: {
        solveDurationSeconds: Math.round((Date.now() - startedAtRef.current) / 1000),
        hintCount: hintCountRef.current,
        revealCount: revealCountRef.current,
        theme,
      },
    }).catch(() => { /* best-effort — the puzzle itself already completed for the user */ });
  }, [recordProgress, theme]);

  const selectCell = (r: number, c: number) => {
    if (!grid[r]?.[c]) return;
    if (selected.row === r && selected.col === c) {
      const other: CrosswordDirection = direction === 'across' ? 'down' : 'across';
      if (wordAt(words, r, c, other)) setDirection(other);
    } else {
      const hasAcross = wordAt(words, r, c, 'across');
      const hasDown = wordAt(words, r, c, 'down');
      if (direction === 'across' && !hasAcross && hasDown) setDirection('down');
      if (direction === 'down' && !hasDown && hasAcross) setDirection('across');
    }
    setSelected({ row: r, col: c });
    focusHidden();
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (solved) return;
    const key = e.key;

    if (/^[a-zA-Z]$/.test(key)) {
      const next = grid.map((row) => row.map((cell) => (cell ? { ...cell } : null)));
      const cell = next[selected.row][selected.col];
      if (cell) cell.value = key.toUpperCase();
      setGrid(next);
      handleSolved(next);

      const nextPos = advanceCell(grid, selected.row, selected.col, direction, 1);
      if (nextPos) setSelected(nextPos);
    } else if (key === 'Backspace') {
      const next = grid.map((row) => row.map((cell) => (cell ? { ...cell } : null)));
      const cell = next[selected.row][selected.col];
      if (cell?.value) {
        cell.value = '';
        setGrid(next);
      } else {
        const prevPos = advanceCell(grid, selected.row, selected.col, direction, -1);
        if (prevPos) setSelected(prevPos);
      }
    }
  };

  const revealLetter = () => {
    if (solved) return;
    revealCountRef.current += 1;
    const next = grid.map((row) => row.map((cell) => (cell ? { ...cell } : null)));
    const cell = next[selected.row][selected.col];
    if (cell) cell.value = cell.letter;
    setGrid(next);
    handleSolved(next);
  };

  const requestHint = () => {
    hintCountRef.current += 1;
    setHintedWord(currentWord);
  };

  return (
    <div
      className="flex flex-col gap-4"
      style={keyboardOpen ? { maxHeight: viewport.height, overflowY: 'auto' } : undefined}
    >
      {!keyboardOpen && (
        <div className="rounded-2xl bg-white border border-slate-200 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#0E7490' }}>
            Today's Theme: {theme}
          </p>
          <p className="text-sm text-slate-600 mt-1">{themeIntro}</p>
        </div>
      )}

      {solved && (
        <div
          className="celebrate rounded-2xl px-4 py-3.5 flex items-center gap-3"
          style={{ backgroundColor: '#FEF3C7', border: '1px solid #F59E0B' }}
          role="status"
        >
          <CheckCircleIcon className="h-8 w-8 shrink-0" style={{ color: '#F59E0B' }} />
          <div>
            <div className="text-[15px] font-semibold" style={{ color: '#92400E' }}>
              A few minutes spent strengthening recovery vocabulary.
            </div>
            <div className="text-[13px]" style={{ color: '#B45309' }}>
              Come back tomorrow for a new theme.
            </div>
          </div>
        </div>
      )}

      {showInsight && (
        <div className="rounded-2xl bg-white border border-slate-200 px-4 py-3.5 flex items-start justify-between gap-3">
          <p className="text-sm text-slate-700 leading-relaxed">{insightCard.text}</p>
          <button
            onClick={() => setShowInsight(false)}
            className="text-slate-400 hover:text-slate-600 text-xs font-semibold shrink-0"
            aria-label="Dismiss reflection"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="rounded-2xl bg-white border border-slate-200 px-4 py-3 flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-[13px] font-medium"
          style={{ backgroundColor: SOMATIC_IN_WORD, color: '#0E7490' }}
        >
          {currentWord ? currentWord.number : ''}
        </div>
        <p className="text-slate-700 text-[15px] leading-snug flex-1">
          {currentWord ? currentWord.clue : 'Select a cell to begin'}
          {currentWord && <span className="text-slate-400 text-[13px] ml-1.5">({currentWord.direction})</span>}
        </p>
      </div>

      {showHint && currentWord?.hint && (
        <div className="rounded-2xl px-4 py-3 text-sm" style={{ backgroundColor: SOMATIC_IN_WORD, color: '#0E7490' }}>
          {currentWord.hint}
        </div>
      )}

      <div className="flex justify-center overflow-x-auto">
        <div
          className="grid gap-[2px] bg-slate-300 p-[2px] rounded-lg"
          style={{ gridTemplateColumns: `repeat(${cols}, ${cellPx}px)` }}
        >
          {grid.map((row, r) =>
            row.map((cell, c) => {
              if (!cell) {
                return (
                  <div
                    key={`${r}-${c}`}
                    className="rounded-[2px]"
                    style={{ width: cellPx, height: cellPx, backgroundColor: '#475569' }}
                  />
                );
              }
              const isSelected = selected.row === r && selected.col === c;
              const inWord = isInWord(currentWord, r, c);
              return (
                <button
                  key={`${r}-${c}`}
                  type="button"
                  onClick={() => selectCell(r, c)}
                  className="relative rounded-[2px] flex items-center justify-center transition-colors duration-200"
                  style={{
                    width: cellPx,
                    height: cellPx,
                    backgroundColor: isSelected ? SOMATIC_SELECTED : inWord ? SOMATIC_IN_WORD : '#FFFFFF',
                  }}
                  aria-label={`Row ${r + 1} column ${c + 1}${cell.value ? `, ${cell.value}` : ', empty'}`}
                >
                  {cell.number && (
                    <span
                      className="absolute top-0 left-0.5 text-[8px] font-medium"
                      style={{ color: isSelected ? '#FFFFFF' : '#64748B' }}
                    >
                      {cell.number}
                    </span>
                  )}
                  <span
                    className="text-[15px] font-semibold"
                    style={{ color: isSelected ? '#FFFFFF' : solved ? '#0F766E' : '#1E293B' }}
                  >
                    {cell.value}
                  </span>
                </button>
              );
            }),
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        className="opacity-0 absolute -z-10 w-1 h-1"
        onKeyDown={handleKey}
        aria-label="Crossword letter input"
        tabIndex={-1}
      />

      {!keyboardOpen && (
        <div className="flex gap-3">
          <button
            onClick={revealLetter}
            disabled={solved}
            className="flex-1 rounded-2xl bg-white border border-slate-200 py-3 flex items-center justify-center gap-2 text-slate-600 text-[14px] font-medium transition-colors duration-200 active:bg-slate-100 disabled:opacity-50"
          >
            <LightBulbIcon className="h-4 w-4" />
            Reveal a letter
          </button>
          <button
            onClick={requestHint}
            disabled={solved || !currentWord?.hint}
            className="flex-1 rounded-2xl bg-white border border-slate-200 py-3 flex items-center justify-center gap-2 text-slate-600 text-[14px] font-medium transition-colors duration-200 active:bg-slate-100 disabled:opacity-50"
          >
            Gentle hint
          </button>
        </div>
      )}

      {solved && (
        <button
          onClick={() => navigate('/games')}
          className="rounded-2xl bg-slate-100 py-3 text-slate-700 font-semibold active:bg-slate-200 transition-colors"
        >
          Back to Games
        </button>
      )}

      {!keyboardOpen && (
        <p className="text-center text-slate-400 text-[12px] px-4 leading-relaxed">
          No timer, no streak, no score kept. Come back to this one whenever it suits you.
        </p>
      )}
    </div>
  );
}

export default function DailyCrossword() {
  const { puzzle, isLoading, isError } = useDailyCrossword();

  return (
    <GameShell title="Daily Crossword">
      <style>{`
        @keyframes crosswordCelebrationPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.04); } }
        .celebrate { animation: crosswordCelebrationPulse 600ms ease-in-out 3; }
        @media (prefers-reduced-motion: reduce) { .celebrate { animation: none; } }
      `}</style>
      {isLoading && <p className="text-center text-slate-500 py-12">Loading today's puzzle…</p>}
      {!isLoading && (isError || !puzzle) && (
        <div className="text-center py-12 px-4">
          <p className="text-slate-600">Today's puzzle isn't ready yet.</p>
          <p className="text-slate-400 text-sm mt-1">Check back a little later — a new one goes up every day.</p>
        </div>
      )}
      {!isLoading && puzzle && (
        <CrosswordGame
          words={puzzle.words}
          rows={puzzle.grid.rows}
          cols={puzzle.grid.cols}
          theme={puzzle.theme}
          themeIntro={puzzle.themeIntro}
          insightCard={puzzle.insightCard}
        />
      )}
    </GameShell>
  );
}
