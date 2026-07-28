// src/components/games/ScenarioMatchQuiz.tsx
// PROJ-72 (Recovery Games), Phase 5. Shared "scenario → multiple-choice →
// reveal → next" quiz loop reused by Thought Challenge, Trigger Match, and
// Knowledge Quests — same mechanic, different static content banks.
// Extracted so the loop isn't written twice, per CLAUDE.md's "reuse, don't
// reinvent."
//
// PROJ-87: gained an optional `theme` prop so Trigger Match/Knowledge Quests
// can render the dark-immersive styling without touching Thought Challenge,
// which stays on the default (light) path with no code changes.
import { useState, useMemo } from 'react';

export interface ScenarioMatchItem {
  prompt: string;
  options: string[];
  correctOption: string;
  explanation: string;
}

// PROJ-87: optional dark theme for consumers restyled to the app's
// dark-immersive shell (Trigger Match, Knowledge Quests). Omitting `theme`
// (Thought Challenge's call site) preserves the original light styling
// exactly — this prop is additive, not a breaking change to the default path.
export interface ScenarioMatchQuizTheme {
  mode: 'dark';
  accent: string;
}

interface ScenarioMatchQuizProps {
  items: ScenarioMatchItem[];
  onComplete: (score: number, total: number) => void;
  theme?: ScenarioMatchQuizTheme;
}

function shuffle<T>(array: T[]): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function ScenarioMatchQuiz({ items, onComplete, theme }: ScenarioMatchQuizProps) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const isDark = theme?.mode === 'dark';
  const accent = theme?.accent;

  // Shuffle each item's option order once per game session, not on every
  // render — otherwise the correct answer's position would jump around
  // while the player is still looking at it.
  const shuffledItems = useMemo(
    () => items.map((item) => ({ ...item, options: shuffle(item.options) })),
    [items],
  );

  const current = shuffledItems[index];
  const isLast = index === items.length - 1;
  const isCorrect = selected === current.correctOption;

  const handleSelect = (option: string) => {
    if (selected) return;
    setSelected(option);
    if (option === current.correctOption) {
      setScore((s) => s + 1);
    }
  };

  const handleNext = () => {
    if (isLast) {
      onComplete(score, items.length);
      return;
    }
    setIndex((i) => i + 1);
    setSelected(null);
  };

  return (
    <div className="flex flex-col gap-4">
      <p
        className={`text-xs font-semibold uppercase tracking-wide ${isDark ? 'font-mono' : 'text-slate-400'}`}
        style={isDark ? { color: accent } : undefined}
      >
        {index + 1} of {items.length}
      </p>

      <div
        className={`rounded-2xl p-4 ${
          isDark ? 'bg-white/[0.07] border border-white/10 backdrop-blur-sm shadow-lg' : 'bg-white border border-slate-200 shadow-sm'
        }`}
      >
        <p className={`font-medium mb-4 ${isDark ? 'text-white' : 'text-slate-800'}`}>{current.prompt}</p>
        <div className="flex flex-col gap-2">
          {current.options.map((option) => {
            const isSelected = selected === option;
            const showCorrect = selected && option === current.correctOption;
            const showIncorrectSelection = isSelected && option !== current.correctOption;
            const optionClass = isDark
              ? showCorrect
                ? 'bg-emerald-500/15 border-emerald-400/50 text-emerald-300'
                : showIncorrectSelection
                ? 'bg-rose-500/15 border-rose-400/50 text-rose-300'
                : 'bg-white/5 border-white/10 text-white/80 hover:border-white/30 disabled:hover:border-white/10'
              : showCorrect
              ? 'bg-emerald-50 border-emerald-400 text-emerald-700'
              : showIncorrectSelection
              ? 'bg-rose-50 border-rose-300 text-rose-600'
              : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 disabled:hover:border-slate-200';
            return (
              <button
                key={option}
                onClick={() => handleSelect(option)}
                disabled={!!selected}
                className={`text-left px-4 py-2.5 rounded-xl border text-sm font-semibold transition-colors ${optionClass}`}
              >
                {option}
              </button>
            );
          })}
        </div>

        {selected && (
          <div className={`mt-4 pt-4 border-t ${isDark ? 'border-white/10' : 'border-slate-100'}`}>
            <p
              className={`text-sm font-bold mb-1 ${
                isCorrect ? (isDark ? 'text-emerald-400' : 'text-emerald-600') : isDark ? 'text-white/70' : 'text-slate-600'
              }`}
            >
              {isCorrect ? 'Nice catch.' : `This one was ${current.correctOption}.`}
            </p>
            <p className={`text-sm ${isDark ? 'text-white/60' : 'text-slate-500'}`}>{current.explanation}</p>
          </div>
        )}
      </div>

      {selected && (
        <button
          onClick={handleNext}
          className={`px-5 py-2.5 rounded-xl font-semibold active:scale-95 transition-transform self-start ${
            isDark ? 'shadow-lg hover:brightness-90' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
          }`}
          style={isDark ? { backgroundColor: accent, color: '#1B0F2E' } : undefined}
        >
          {isLast ? 'Finish' : 'Next'}
        </button>
      )}
    </div>
  );
}
