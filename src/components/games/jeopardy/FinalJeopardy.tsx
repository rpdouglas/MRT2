// src/components/games/jeopardy/FinalJeopardy.tsx
// PROJ-72 (Recovery Games), Phase 3. Ported from the legacy Recovery
// Jeopardy game, restyled onto MRT's Tailwind system.
import { useState } from 'react';
import { jeopardyData } from '../../../lib/games/jeopardy/jeopardyData';
import { calculateWagerOutcome, determineWinner } from '../../../lib/games/jeopardy/scoring';
import type { JeopardyPlayer } from '../../../lib/games/jeopardy/types';

interface FinalJeopardyProps {
  players: JeopardyPlayer[];
  onUpdateScore: (playerIndex: number, amount: number) => void;
  onRestartGame: () => void;
  /** Fired once, when scores are revealed — lets the orchestrator persist game_progress. */
  onComplete: (finalPlayers: JeopardyPlayer[]) => void;
}

type Stage = 'wager' | 'answer' | 'reveal';

export default function FinalJeopardy({ players, onUpdateScore, onRestartGame, onComplete }: FinalJeopardyProps) {
  const [wagers, setWagers] = useState<number[]>(Array(players.length).fill(0));
  const [answers, setAnswers] = useState<string[]>(Array(players.length).fill(''));
  const [stage, setStage] = useState<Stage>('wager');

  const finalQuestion = jeopardyData.finalJeopardy;

  const handleWagerChange = (index: number, value: string) => {
    const maxWager = Math.max(0, players[index].score);
    const updated = [...wagers];
    updated[index] = Math.min(maxWager, parseInt(value, 10) || 0);
    setWagers(updated);
  };

  const revealAnswers = () => {
    const updatedPlayers = players.map((player, index) => {
      const isCorrect = answers[index].trim().toLowerCase() === finalQuestion.answer.toLowerCase();
      const amount = calculateWagerOutcome(wagers[index], isCorrect);
      onUpdateScore(index, amount);
      return { ...player, score: player.score + amount };
    });
    setStage('reveal');
    onComplete(updatedPlayers);
  };

  if (stage === 'wager') {
    return (
      <div className="p-8 bg-white rounded-2xl shadow-sm border border-slate-200 text-center">
        <h2 className="text-2xl font-bold text-indigo-800 mb-2">Final Category</h2>
        <p className="text-3xl font-black text-slate-800 mb-8">{finalQuestion.category}</p>
        <h3 className="text-xl font-bold mb-4 text-slate-700">Place Your Wagers</h3>
        <div className="flex flex-col items-center gap-3">
          {players.map((player, index) => (
            <div key={index} className="flex items-center gap-3">
              <label className="font-bold text-slate-700 w-24 truncate text-right">{player.name}:</label>
              <input
                type="number"
                min={0}
                max={Math.max(0, player.score)}
                value={wagers[index]}
                onChange={(e) => handleWagerChange(index, e.target.value)}
                className="p-2 border border-slate-300 rounded-xl w-32 text-center"
              />
            </div>
          ))}
        </div>
        <button
          onClick={() => setStage('answer')}
          className="mt-8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-xl shadow-md"
        >
          Lock In Wagers
        </button>
      </div>
    );
  }

  if (stage === 'answer') {
    return (
      <div className="p-8 bg-white rounded-2xl shadow-sm border border-slate-200 text-center">
        <h2 className="text-2xl font-bold text-indigo-800 mb-2">Final Question</h2>
        <p className="text-2xl font-bold text-slate-800 mb-8">{finalQuestion.question}</p>
        <h3 className="text-xl font-bold mb-4 text-slate-700">Enter Your Answers</h3>
        <div className="flex flex-col items-center gap-3">
          {players.map((player, index) => (
            <div key={index} className="flex items-center gap-3">
              <label className="font-bold text-slate-700 w-24 truncate text-right">{player.name}:</label>
              <input
                type="text"
                value={answers[index]}
                onChange={(e) => {
                  const updated = [...answers];
                  updated[index] = e.target.value;
                  setAnswers(updated);
                }}
                className="p-2 border border-slate-300 rounded-xl w-64"
              />
            </div>
          ))}
        </div>
        <button
          onClick={revealAnswers}
          className="mt-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-8 rounded-xl shadow-md"
        >
          Reveal Final Scores
        </button>
      </div>
    );
  }

  // stage === 'reveal'
  const winner = determineWinner(players);

  return (
    <div className="p-8 bg-white rounded-2xl shadow-sm border border-slate-200 text-center">
      <h2 className="text-2xl font-bold text-indigo-800 mb-2">Correct Answer</h2>
      <p className="text-3xl font-black text-slate-800 mb-8">{finalQuestion.answer}</p>
      <h3 className="text-xl font-bold mb-4 text-slate-700">Final Scores</h3>
      <div className="flex flex-col items-center gap-2 mb-8">
        {players.map((player, index) => (
          <p key={index} className="text-lg">
            <span className="font-bold">{player.name}:</span> ${player.score}
          </p>
        ))}
      </div>
      <h2 className="text-3xl font-black text-emerald-600 mb-8">Nice work, {winner.name}!</h2>
      <button
        onClick={onRestartGame}
        className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-8 rounded-xl active:scale-95 transition-transform"
      >
        Play Again
      </button>
    </div>
  );
}
