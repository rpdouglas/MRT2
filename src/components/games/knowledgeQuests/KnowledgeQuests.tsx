// src/components/games/knowledgeQuests/KnowledgeQuests.tsx
// PROJ-72 (Recovery Games), Phase 6. Not persona-specific — general
// psychoeducation content packs. A pack-picker screen, then the same shared
// ScenarioMatchQuiz loop Thought Challenge and Trigger Match use (Phase 5),
// now on its third content bank. No save-state — a pack is a single-sitting
// quiz, so picking a different pack just swaps the content, same as
// choosing a difficulty in Fast Lane's selector.
//
// PROJ-87: self-contained dark-immersive shell (like GoalLadder.tsx/
// RecoveryJeopardy.tsx/TriggerMatch.tsx) instead of GameShell. Accent is the
// 'everyone' persona color already used for this game's Games Hub tile
// (#F0ABFC).
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrophyIcon, HomeIcon, PauseIcon, PlayIcon } from '@heroicons/react/24/outline';
import { GameSessionProvider, useGameSession } from '../../../contexts/GameSessionContext';
import { useGameProgress } from '../../../hooks/useGameProgress';
import ScenarioMatchQuiz from '../ScenarioMatchQuiz';
import { KNOWLEDGE_QUEST_PACKS } from '../../../lib/games/knowledgeQuests/packs';

const ACCENT = '#F0ABFC';

function PackPicker({ onSelect }: { onSelect: (packId: string) => void }) {
  return (
    <div className="flex flex-col gap-4 py-4">
      <p className="text-white/70 text-center max-w-sm mx-auto text-[15px] leading-relaxed">
        Short quiz packs on recovery-adjacent topics. Pick one to start.
      </p>
      <div className="flex flex-col gap-3">
        {KNOWLEDGE_QUEST_PACKS.map((pack) => (
          <button
            key={pack.id}
            onClick={() => onSelect(pack.id)}
            className="text-left px-5 py-4 rounded-xl bg-white/[0.07] border border-white/10 backdrop-blur-sm shadow-lg hover:border-white/30 transition-all active:scale-95"
          >
            <p className="font-bold text-white">{pack.title}</p>
            <p className="text-xs text-white/60 mt-1">{pack.description}</p>
            <p className="text-[10px] text-white/40 mt-1 uppercase tracking-wide">{pack.items.length} questions</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function KnowledgeQuestsGame() {
  const navigate = useNavigate();
  const { startSession, completeSession, phase, score, pauseSession, resumeSession, resetSession } = useGameSession();
  const { recordProgress } = useGameProgress();

  const [activePackId, setActivePackId] = useState<string | null>(null);
  const [result, setResult] = useState<{ correct: number; total: number } | null>(null);

  const activePack = KNOWLEDGE_QUEST_PACKS.find((p) => p.id === activePackId) ?? null;

  const handleSelectPack = (packId: string) => {
    setActivePackId(packId);
    setResult(null);
    startSession('knowledge-quests');
  };

  const handleComplete = (correct: number, total: number) => {
    if (!activePack) return;
    setResult({ correct, total });
    completeSession(correct);
    recordProgress({
      gameId: 'knowledge-quests',
      personaTarget: 'All',
      score: correct,
      stats: { packId: activePack.id, correct, total },
    }).catch(() => { /* best-effort — the game itself already completed for the user */ });
  };

  const handlePlayAnother = () => {
    setActivePackId(null);
    setResult(null);
  };

  const handleExit = () => {
    resetSession();
    navigate('/games');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[linear-gradient(160deg,#2E1A47_0%,#1B0F2E_100%)] text-white relative overflow-hidden">
      <div className="absolute -top-10 -right-10 w-64 h-64 bg-[#F0ABFC]/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-[#A855F7]/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col flex-1 w-full max-w-2xl mx-auto px-4 py-4 gap-4">
        <div className="flex items-center justify-between shrink-0">
          <h1 className="text-xl font-bold tracking-tight text-white">Knowledge Quests</h1>
          {phase !== 'idle' && (
            <div className="flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1.5">
              <TrophyIcon className="h-4 w-4" style={{ color: ACCENT }} />
              <span className="text-sm font-semibold font-mono">{score}</span>
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col justify-center gap-4">
          {!activePack && <PackPicker onSelect={handleSelectPack} />}

          {activePack && !result && (
            <ScenarioMatchQuiz items={activePack.items} onComplete={handleComplete} theme={{ mode: 'dark', accent: ACCENT }} />
          )}

          {activePack && result && (
            <div className="flex flex-col items-center text-center gap-3 py-8">
              <p className="text-2xl font-black text-white">
                {result.correct} of {result.total} on {activePack.title}.
              </p>
              <div className="flex gap-3 mt-2">
                <button
                  onClick={handlePlayAnother}
                  className="px-5 py-2.5 rounded-xl font-semibold active:scale-95 transition-transform"
                  style={{ backgroundColor: ACCENT, color: '#1B0F2E' }}
                >
                  Try Another Pack
                </button>
                <button
                  onClick={() => navigate('/games')}
                  className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold active:scale-95 transition-transform"
                >
                  Back to Games
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between bg-white/[0.06] border border-white/10 rounded-2xl px-4 py-3 shrink-0">
          <button
            onClick={handleExit}
            aria-label="Exit to Games"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-white/70 hover:bg-white/10 active:scale-95 transition-colors"
          >
            <HomeIcon className="h-5 w-5" />
            <span className="text-sm font-semibold">Exit</span>
          </button>

          {phase === 'playing' && (
            <button
              onClick={pauseSession}
              aria-label="Pause"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-white/70 hover:bg-white/10 active:scale-95 transition-colors"
            >
              <PauseIcon className="h-5 w-5" />
              <span className="text-sm font-semibold">Pause</span>
            </button>
          )}

          {phase === 'paused' && (
            <button
              onClick={resumeSession}
              aria-label="Resume"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-white/10 active:scale-95 transition-colors"
              style={{ color: ACCENT }}
            >
              <PlayIcon className="h-5 w-5" />
              <span className="text-sm font-semibold">Resume</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function KnowledgeQuests() {
  return (
    <GameSessionProvider>
      <KnowledgeQuestsGame />
    </GameSessionProvider>
  );
}
