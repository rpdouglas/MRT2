import React, { useState, useRef, useEffect, useMemo } from "react";
import { ChevronLeft, HelpCircle, Check, RotateCcw, Lightbulb } from "lucide-react";

/* ---------------------------------------------------------
   PUZZLE DATA
   Theme-driven word set. In production this JSON is the
   output of the nightly generation call + layout algorithm.
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

function buildGrid() {
  const grid = Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => null)
  );
  for (const w of WORDS) {
    for (let i = 0; i < w.answer.length; i++) {
      const r = w.dir === "down" ? w.row + i : w.row;
      const c = w.dir === "across" ? w.col + i : w.col;
      if (!grid[r][c]) grid[r][c] = { letter: w.answer[i], number: null, value: "" };
    }
  }
  for (const w of WORDS) {
    if (!grid[w.row][w.col].number) grid[w.row][w.col].number = w.number;
  }
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

export default function DailyCrossword() {
  const [grid, setGrid] = useState(buildGrid);
  const [selected, setSelected] = useState({ row: 0, col: 0 });
  const [direction, setDirection] = useState("across");
  const [solved, setSolved] = useState(false);
  const inputRef = useRef(null);

  const currentWord = useMemo(
    () => wordAt(selected.row, selected.col, direction),
    [selected, direction]
  );

  const focusHidden = () => inputRef.current && inputRef.current.focus();

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
    focusHidden();
  };

  const advance = (r, c, dir, delta) => {
    const nr = dir === "down" ? r + delta : r;
    const nc = dir === "across" ? c + delta : c;
    if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && grid[nr][nc]) {
      setSelected({ row: nr, col: nc });
    }
  };

  const checkSolved = (g) => {
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++)
        if (g[r][c] && g[r][c].value !== g[r][c].letter) return false;
    return true;
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

  useEffect(() => {
    focusHidden();
  }, []);

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
    <div className="min-h-screen bg-slate-50 flex justify-center">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
        .font-body { font-family: 'DM Sans', system-ui, -apple-system, sans-serif; }
        .font-mono-data { font-family: 'JetBrains Mono', 'Fira Code', 'SF Mono', monospace; }
        @keyframes celebrationPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.04); }
        }
        .celebrate { animation: celebrationPulse 600ms ease-in-out 3; }
        @media (prefers-reduced-motion: reduce) {
          .celebrate { animation: none; }
          * { transition: none !important; }
        }
      `}</style>

      <div className="w-full max-w-[420px] bg-slate-50 min-h-screen pb-10 font-body">
        {/* Header — Somatic Action gradient (daily task layer) */}
        <div
          className="px-5 pt-6 pb-6 rounded-b-[28px]"
          style={{ background: "linear-gradient(90deg, #06B6D4 0%, #14B8A6 100%)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <button
              className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center text-white transition-colors duration-200 active:bg-white/30"
              aria-label="Back"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center text-white transition-colors duration-200 active:bg-white/30"
              aria-label="Help"
            >
              <HelpCircle size={18} />
            </button>
          </div>

          <div
            className="font-mono-data text-cyan-50/80 text-[11px] tracking-widest mb-1"
            style={{ letterSpacing: "0.08em" }}
          >
            PUZZLE #{PUZZLE_NUMBER}
          </div>
          <h1 className="text-white font-semibold text-[26px] leading-tight">
            Daily Crossword
          </h1>
          <p className="text-white/90 text-[15px] mt-1.5 font-normal">
            Today's Theme: <span className="font-medium">{THEME}</span>
          </p>
        </div>

        {/* Completion banner */}
        {solved && (
          <div className="mx-4 mt-4">
            <div
              className="celebrate rounded-2xl px-4 py-3.5 flex items-center gap-3"
              style={{ backgroundColor: "#FEF3C7", border: "1px solid #F59E0B" }}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: "#F59E0B" }}
              >
                <Check size={18} className="text-white" />
              </div>
              <div>
                <div className="text-[15px] font-semibold" style={{ color: "#92400E" }}>
                  Today's puzzle, solved.
                </div>
                <div className="text-[13px]" style={{ color: "#B45309" }}>
                  Come back tomorrow for a new theme.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Clue strip */}
        <div className="mx-4 mt-4">
          <div className="rounded-2xl bg-white border border-slate-200 px-4 py-3 flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-mono-data text-[13px] font-medium"
              style={{ backgroundColor: "#CFFAFE", color: "#0E7490" }}
            >
              {currentWord ? currentWord.number : ""}
            </div>
            <p className="text-slate-700 text-[15px] leading-snug">
              {currentWord ? currentWord.clue : "Select a cell to begin"}
              <span className="text-slate-400 text-[13px] ml-1.5">
                ({currentWord ? currentWord.dir : ""})
              </span>
            </p>
          </div>
        </div>

        {/* Grid */}
        <div className="flex justify-center mt-5 px-4">
          <div
            className="grid gap-[3px] bg-slate-300 p-[3px] rounded-xl"
            style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}
          >
            {grid.map((row, r) =>
              row.map((cell, c) => {
                if (!cell) {
                  return (
                    <div
                      key={`${r}-${c}`}
                      className="w-14 h-14 rounded-[3px]"
                      style={{ backgroundColor: "#475569" }}
                    />
                  );
                }
                const isSelected = selected.row === r && selected.col === c;
                const inWord = isInCurrentWord(r, c);
                const isCorrect = solved;
                return (
                  <button
                    key={`${r}-${c}`}
                    onClick={() => selectCell(r, c)}
                    className="relative w-14 h-14 rounded-[3px] flex items-center justify-center transition-colors duration-200"
                    style={{
                      backgroundColor: isSelected
                        ? "#06B6D4"
                        : inWord
                        ? "#CFFAFE"
                        : "#FFFFFF",
                    }}
                    aria-label={`Row ${r + 1} column ${c + 1}`}
                  >
                    {cell.number && (
                      <span
                        className="absolute top-0.5 left-1 font-body text-[9px] font-medium"
                        style={{ color: isSelected ? "#FFFFFF" : "#64748B" }}
                      >
                        {cell.number}
                      </span>
                    )}
                    <span
                      className="font-body text-[20px] font-semibold"
                      style={{
                        color: isSelected
                          ? "#FFFFFF"
                          : isCorrect
                          ? "#0F766E"
                          : "#1E293B",
                      }}
                    >
                      {cell.value}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Hidden input to trigger native mobile keyboard */}
        <input
          ref={inputRef}
          className="opacity-0 absolute -z-10 w-1 h-1"
          onKeyDown={handleKey}
          autoFocus
        />

        {/* Actions — no penalty, no counters, per non-manipulation commitment */}
        <div className="px-4 mt-6 flex gap-3">
          <button
            onClick={revealLetter}
            className="flex-1 rounded-2xl bg-white border border-slate-200 py-3 flex items-center justify-center gap-2 text-slate-600 text-[14px] font-medium transition-colors duration-200 active:bg-slate-100"
          >
            <Lightbulb size={16} />
            Reveal a letter
          </button>
          <button
            onClick={() => {
              setGrid(buildGrid());
              setSolved(false);
            }}
            className="w-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 transition-colors duration-200 active:bg-slate-100"
            aria-label="Restart puzzle"
          >
            <RotateCcw size={16} />
          </button>
        </div>

        <p className="text-center text-slate-400 text-[12px] mt-6 px-8 leading-relaxed">
          No timer, no streak, no score kept. Come back to this one whenever it suits you.
        </p>
      </div>
    </div>
  );
}
