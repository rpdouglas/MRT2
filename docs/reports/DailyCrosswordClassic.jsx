import React, { useState, useRef, useEffect, useMemo } from "react";
import { ChevronLeft, HelpCircle, Check, Lightbulb } from "lucide-react";

/**
 * DailyCrossword — "Classic Grid" view
 *
 * Fixes vs. the previous build:
 *  1. Cells are a fixed pixel size (CELL) instead of `1fr` columns —
 *     this is what was causing the stretched, full-width bar look.
 *  2. The whole layout tracks window.visualViewport.height so it
 *     always sizes itself to what's actually visible above the
 *     on-screen keyboard, instead of the keyboard covering content
 *  3. The header collapses to a slim strip once the keyboard is open,
 *     freeing vertical space for the clue + grid.
 *
 * NOTE: the @import in the <style> tag below is for portability in
 * this file only. In the real app, move the DM Sans / JetBrains Mono
 * font imports into your global stylesheet / index.html instead of
 * re-importing them per-component.
 *
 * Swap PUZZLE data for whatever your generation pipeline returns —
 * shape matches SPEC-CROSSWORD-001 §4.6 (words[], theme, etc.), minus
 * the fields this view doesn't use (hint, clue_style, insight_card —
 * wire those in whenever you build the reveal-hint and post-solve
 * insight card pieces).
 */

/* ---------------------------------------------------------
   PUZZLE DATA — replace with generated puzzle JSON
--------------------------------------------------------- */
const THEME = "Boundaries";
const PUZZLE_NUMBER = 142;

const WORDS = [
  { number: 1, dir: "across", row: 0, col: 0, answer: "SPACE", clue: "Where boundaries create room to breathe" },
  { number: 1, dir: "down", row: 0, col: 0, answer: "SELF", clue: "Who you're accountable to first" },
  { number: 2, dir: "down", row: 0, col: 2, answer: "ARM", clue: "Limb, or a support you lean on" },
  { number: 3, dir: "across", row: 2, col: 0, answer: "LIMIT", clue: "What a boundary sets" },
];
const ROWS = 4;
const COLS = 5;
const CELL = 38; // fixed px cell size — do not switch this back to 1fr

/* ---------------------------------------------------------
   Grid helpers
--------------------------------------------------------- */
function buildGrid() {
  const grid = Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => null));
  for (const w of WORDS) {
    for (let i = 0; i < w.answer.length; i++) {
      const r = w.dir === "down" ? w.row + i : w.row;
      const c = w.dir === "across" ? w.col + i : w.col;
      if (!grid[r][c]) grid[r][c] = { letter: w.answer[i], number: null, value: "" };
    }
  }
  for (const w of WORDS) if (!grid[w.row][w.col].number) grid[w.row][w.col].number = w.number;
  return grid;
}

function wordAt(row, col, dir) {
  return WORDS.find((w) => {
    for (let i = 0; i < w.answer.length; i++) {
      const r = w.dir === "down" ? w.row + i : w.row;
      const c = w.dir === "across" ? w.col + i : w.col;
      if (r === row && c === col && w.dir === dir) return true;
    }
    return false;
  });
}

function checkSolved(g) {
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) if (g[r][c] && g[r][c].value !== g[r][c].letter) return false;
  return true;
}

/* ---------------------------------------------------------
   Fonts + motion (move into global CSS in production)
--------------------------------------------------------- */
const FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
  .font-body { font-family: 'DM Sans', system-ui, sans-serif; }
  .font-mono-data { font-family: 'JetBrains Mono', monospace; }
  @keyframes celebrationPulse { 0%,100%{transform:scale(1);} 50%{transform:scale(1.04);} }
  .celebrate { animation: celebrationPulse 600ms ease-in-out 3; }
  @media (prefers-reduced-motion: reduce) { .celebrate { animation: none; } }
`;

/* ---------------------------------------------------------
   Header — collapses to a slim strip when the keyboard is open
--------------------------------------------------------- */
function Header({ compact }) {
  return (
    <div
      className="px-5 rounded-b-[24px] transition-all duration-200"
      style={{
        background: "linear-gradient(90deg, #06B6D4 0%, #14B8A6 100%)",
        paddingTop: compact ? 12 : 24,
        paddingBottom: compact ? 12 : 20,
      }}
    >
      <div className="flex items-center justify-between mb-1">
        <button className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white" aria-label="Back">
          <ChevronLeft size={18} />
        </button>
        {!compact && (
          <div className="font-mono-data text-cyan-50/80 text-[10px] tracking-widest">
            PUZZLE #{PUZZLE_NUMBER}
          </div>
        )}
        <button className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white" aria-label="Help">
          <HelpCircle size={16} />
        </button>
      </div>
      {compact ? (
        <p className="text-white font-medium text-[14px] text-center">Theme: {THEME}</p>
      ) : (
        <>
          <h1 className="text-white font-semibold text-[22px] leading-tight">Daily Crossword</h1>
          <p className="text-white/90 text-[13px] mt-1">
            Today's Theme: <span className="font-medium">{THEME}</span>
          </p>
        </>
      )}
    </div>
  );
}

function SolvedBanner() {
  return (
    <div className="mx-4 mt-3">
      <div
        className="celebrate rounded-2xl px-4 py-3 flex items-center gap-3"
        style={{ backgroundColor: "#FEF3C7", border: "1px solid #F59E0B" }}
      >
        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "#F59E0B" }}>
          <Check size={16} className="text-white" />
        </div>
        <div>
          <div className="text-[14px] font-semibold" style={{ color: "#92400E" }}>
            A few minutes spent on your recovery vocabulary.
          </div>
          <div className="text-[12px]" style={{ color: "#B45309" }}>
            Healthy boundaries protect recovery — not by pushing people away, but by making room for what matters.
          </div>
        </div>
      </div>
    </div>
  );
}

function GridCells({ grid, selected, isInCurrentWord, selectCell, solved }) {
  return (
    <div
      className="grid gap-[2px] bg-slate-300 p-[2px] rounded-lg"
      style={{ gridTemplateColumns: `repeat(${COLS}, ${CELL}px)` }}
    >
      {grid.map((row, r) =>
        row.map((cell, c) => {
          if (!cell) {
            return (
              <div
                key={`${r}-${c}`}
                style={{ width: CELL, height: CELL, backgroundColor: "#475569" }}
                className="rounded-[2px]"
              />
            );
          }
          const isSelected = selected.row === r && selected.col === c;
          const inWord = isInCurrentWord(r, c);
          return (
            <button
              key={`${r}-${c}`}
              onClick={() => selectCell(r, c)}
              style={{
                width: CELL,
                height: CELL,
                backgroundColor: isSelected ? "#06B6D4" : inWord ? "#CFFAFE" : "#FFFFFF",
              }}
              className="relative rounded-[2px] flex items-center justify-center transition-colors duration-150"
            >
              {cell.number && (
                <span
                  className="absolute top-0 left-0.5 font-body text-[8px] font-medium"
                  style={{ color: isSelected ? "#fff" : "#64748B" }}
                >
                  {cell.number}
                </span>
              )}
              <span
                className="font-body text-[15px] font-semibold"
                style={{ color: isSelected ? "#fff" : solved ? "#0F766E" : "#1E293B" }}
              >
                {cell.value}
              </span>
            </button>
          );
        })
      )}
    </div>
  );
}

/* ---------------------------------------------------------
   Main component
--------------------------------------------------------- */
export default function DailyCrossword() {
  const [grid, setGrid] = useState(buildGrid);
  const [selected, setSelected] = useState({ row: 0, col: 0 });
  const [direction, setDirection] = useState("across");
  const [solved, setSolved] = useState(false);
  const [vh, setVh] = useState(typeof window !== "undefined" ? window.innerHeight : 800);
  const inputRef = useRef(null);

  // Track the visible viewport (above the keyboard), not the full screen
  useEffect(() => {
    if (!window.visualViewport) return;
    const handler = () => setVh(window.visualViewport.height);
    handler();
    window.visualViewport.addEventListener("resize", handler);
    return () => window.visualViewport.removeEventListener("resize", handler);
  }, []);

  useEffect(() => {
    inputRef.current && inputRef.current.focus();
  }, []);

  const currentWord = useMemo(() => wordAt(selected.row, selected.col, direction), [selected, direction]);
  const keyboardOpen = vh < 500;

  const selectCell = (r, c) => {
    if (!grid[r][c]) return;
    if (selected.row === r && selected.col === c) {
      const other = direction === "across" ? "down" : "across";
      if (wordAt(r, c, other)) setDirection(other);
    } else {
      const hasAcross = wordAt(r, c, "across");
      const hasDown = wordAt(r, c, "down");
      if (direction === "across" && !hasAcross && hasDown) setDirection("down");
      if (direction === "down" && !hasDown && hasAcross) setDirection("across");
    }
    setSelected({ row: r, col: c });
    inputRef.current && inputRef.current.focus();
  };

  const advance = (r, c, dir, delta) => {
    const nr = dir === "down" ? r + delta : r;
    const nc = dir === "across" ? c + delta : c;
    if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && grid[nr][nc]) setSelected({ row: nr, col: nc });
  };

  const handleKey = (e) => {
    const key = e.key;
    if (/^[a-zA-Z]$/.test(key)) {
      setGrid((prev) => {
        const next = prev.map((row) => row.map((cell) => (cell ? { ...cell } : null)));
        next[selected.row][selected.col].value = key.toUpperCase();
        if (checkSolved(next)) setSolved(true);
        return next;
      });
      advance(selected.row, selected.col, direction, 1);
    } else if (key === "Backspace") {
      setGrid((prev) => {
        const next = prev.map((row) => row.map((cell) => (cell ? { ...cell } : null)));
        if (next[selected.row][selected.col].value) {
          next[selected.row][selected.col].value = "";
        } else {
          advance(selected.row, selected.col, direction, -1);
        }
        return next;
      });
    }
  };

  const revealLetter = () => {
    setGrid((prev) => {
      const next = prev.map((row) => row.map((cell) => (cell ? { ...cell } : null)));
      next[selected.row][selected.col].value = next[selected.row][selected.col].letter;
      if (checkSolved(next)) setSolved(true);
      return next;
    });
  };

  const isInCurrentWord = (r, c) => {
    if (!currentWord) return false;
    for (let i = 0; i < currentWord.answer.length; i++) {
      const rr = currentWord.dir === "down" ? currentWord.row + i : currentWord.row;
      const cc = currentWord.dir === "across" ? currentWord.col + i : currentWord.col;
      if (rr === r && cc === c) return true;
    }
    return false;
  };

  return (
    <div className="min-h-screen bg-slate-900 flex justify-center">
      <style>{FONTS}</style>
      <div className="w-full max-w-[420px]">
        <div style={{ height: vh }} className="overflow-y-auto bg-slate-50 flex flex-col">
          <Header compact={keyboardOpen} />

          {solved && <SolvedBanner />}

          <div className="mx-4 mt-3 rounded-xl bg-white border border-slate-200 px-3 py-2.5 flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 font-mono-data text-[12px] font-medium"
              style={{ backgroundColor: "#CFFAFE", color: "#0E7490" }}
            >
              {currentWord ? currentWord.number : ""}
            </div>
            <p className="text-slate-700 text-[13.5px] leading-snug">
              {currentWord ? currentWord.clue : "Select a cell"}
              <span className="text-slate-400 text-[12px] ml-1.5">({currentWord ? currentWord.dir : ""})</span>
            </p>
          </div>

          <div className="flex justify-center mt-4">
            <GridCells
              grid={grid}
              selected={selected}
              isInCurrentWord={isInCurrentWord}
              selectCell={selectCell}
              solved={solved}
            />
          </div>

          {/* Hidden input triggers the native mobile keyboard */}
          <input ref={inputRef} className="opacity-0 absolute -z-10 w-1 h-1" onKeyDown={handleKey} />

          {!keyboardOpen && (
            <div className="px-4 mt-5">
              <button
                onClick={revealLetter}
                className="w-full rounded-2xl bg-white border border-slate-200 py-2.5 flex items-center justify-center gap-2 text-slate-600 text-[13px] font-medium"
              >
                <Lightbulb size={15} /> Reveal a letter
              </button>
              <p className="text-center text-slate-400 text-[11px] mt-4 px-6 leading-relaxed">
                No timer, no streak, no score kept.
              </p>
            </div>
          )}

          <div onClick={() => inputRef.current && inputRef.current.focus()} className="flex-1" />
        </div>
      </div>
    </div>
  );
}
