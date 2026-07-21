// src/components/games/knowledgeQuests/KnowledgeQuests.tsx
// PROJ-72 (Recovery Games), Phase 6. Not persona-specific — general
// psychoeducation content packs. A pack-picker screen, then the same shared
// ScenarioMatchQuiz loop Thought Challenge and Trigger Match use (Phase 5),
// now on its third content bank. No save-state — a pack is a single-sitting
// quiz, so picking a different pack just swaps the content, same as
// choosing a difficulty in Fast Lane's selector.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GameShell from '../GameShell';
import ScenarioMatchQuiz from '../ScenarioMatchQuiz';
import { useGameSession } from '../../../contexts/GameSessionContext';
import { useGameProgress } from '../../../hooks/useGameProgress';
import { KNOWLEDGE_QUEST_PACKS } from '../../../lib/games/knowledgeQuests/packs';

function PackPicker({ onSelect }: { onSelect: (packId: string) => void }) {
  return (
    <div className="flex flex-col gap-4 py-6 px-4">
      <p className="text-slate-600 text-center max-w-sm mx-auto">
        Short quiz packs on recovery-adjacent topics. Pick one to start.
      </p>
      <div className="flex flex-col gap-3">
        {KNOWLEDGE_QUEST_PACKS.map((pack) => (
          <button
            key={pack.id}
            onClick={() => onSelect(pack.id)}
            className="text-left px-5 py-4 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all active:scale-95"
          >
            <p className="font-bold text-slate-800">{pack.title}</p>
            <p className="text-xs text-slate-500 mt-1">{pack.description}</p>
            <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wide">{pack.items.length} questions</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function KnowledgeQuestsGame() {
  const navigate = useNavigate();
  const { startSession, completeSession } = useGameSession();
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

  if (!activePack) {
    return <PackPicker onSelect={handleSelectPack} />;
  }

  if (result) {
    return (
      <div className="flex flex-col items-center justify-center text-center gap-3 py-12 px-4">
        <p className="text-lg font-bold text-slate-800">
          {result.correct} of {result.total} on {activePack.title}.
        </p>
        <div className="flex gap-3 mt-2">
          <button
            onClick={handlePlayAnother}
            className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-semibold active:scale-95 transition-transform"
          >
            Try Another Pack
          </button>
          <button
            onClick={() => navigate('/games')}
            className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold active:scale-95 transition-transform"
          >
            Back to Games
          </button>
        </div>
      </div>
    );
  }

  return <ScenarioMatchQuiz items={activePack.items} onComplete={handleComplete} />;
}

export default function KnowledgeQuests() {
  return (
    <GameShell title="Knowledge Quests">
      <KnowledgeQuestsGame />
    </GameShell>
  );
}
