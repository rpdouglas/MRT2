// src/components/games/jeopardy/RecoveryJeopardy.tsx
// PROJ-72 (Recovery Games), Phase 3. Ported from the legacy Recovery
// Jeopardy game (local pass-the-device, 1-3 player/team trivia — 2 rounds
// + Final Jeopardy wagering, self-graded scoring). Kept as a genuinely
// multiplayer group activity per the /planning decision in
// docs/projects/72_RECOVERY_GAMES.md Phase 3 — unlike every other
// Recovery Game, this one is designed to be played by a group passing one
// device around (e.g. a sponsor/sponsee session or a home-group activity).
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import GameShell from '../GameShell';
import { useGameSession } from '../../../contexts/GameSessionContext';
import { useGameProgress } from '../../../hooks/useGameProgress';
import { jeopardyData } from '../../../lib/games/jeopardy/jeopardyData';
import { calculateAnswerScoreChange, determineWinner } from '../../../lib/games/jeopardy/scoring';
import PlayerSetup from './PlayerSetup';
import JeopardyBoard from './JeopardyBoard';
import Scoreboard from './Scoreboard';
import QuestionModal from './QuestionModal';
import FinalJeopardy from './FinalJeopardy';
import type { JeopardyCategory, JeopardyPlayer, JeopardyQuestion, JeopardyRound, SelectedQuestion } from '../../../lib/games/jeopardy/types';

const TOTAL_QUESTIONS_PER_ROUND = 30; // 6 categories x 5 questions

function shuffle<T>(array: T[]): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function RecoveryJeopardyGame() {
  const navigate = useNavigate();
  const { startSession, setScore, completeSession } = useGameSession();
  const { recordProgress } = useGameProgress();

  const [players, setPlayers] = useState<JeopardyPlayer[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [round, setRound] = useState<JeopardyRound>('setup');
  const [answeredQuestions, setAnsweredQuestions] = useState<string[]>([]);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<SelectedQuestion | null>(null);
  const [jeopardyCategories, setJeopardyCategories] = useState<JeopardyCategory[]>([]);
  const [doubleJeopardyCategories, setDoubleJeopardyCategories] = useState<JeopardyCategory[]>([]);

  const handleStartGame = useCallback((playerList: JeopardyPlayer[]) => {
    setPlayers(playerList);
    setCurrentPlayerIndex(0);
    setRound('jeopardy');
    startSession('recovery-jeopardy');

    const shuffled = shuffle(jeopardyData.categories);
    setJeopardyCategories(shuffled.slice(0, 6));
    setDoubleJeopardyCategories(shuffled.slice(6, 12));
  }, [startSession]);

  const handleSelectQuestion = (category: JeopardyCategory, question: JeopardyQuestion) => {
    setCurrentQuestion({ category, question });
  };

  const handleAnswerOutcome = (wasCorrect: boolean) => {
    if (!currentQuestion) return;
    const { question } = currentQuestion;
    const scoreChange = calculateAnswerScoreChange(question.value, round, wasCorrect);

    const updatedPlayers = [...players];
    updatedPlayers[currentPlayerIndex] = {
      ...updatedPlayers[currentPlayerIndex],
      score: updatedPlayers[currentPlayerIndex].score + scoreChange,
    };
    setPlayers(updatedPlayers);
    setScore(updatedPlayers[currentPlayerIndex].score);

    setAnsweredQuestions((prev) => [...prev, question.question]);
    const newTotalAnswered = totalAnswered + 1;
    setTotalAnswered(newTotalAnswered);

    if (!wasCorrect) {
      setCurrentPlayerIndex((currentPlayerIndex + 1) % updatedPlayers.length);
    }

    if (newTotalAnswered === TOTAL_QUESTIONS_PER_ROUND && round === 'jeopardy') {
      setRound('double');
      setTotalAnswered(0);
      setAnsweredQuestions([]);
    } else if (newTotalAnswered === TOTAL_QUESTIONS_PER_ROUND && round === 'double') {
      setRound('final');
    }

    setCurrentQuestion(null);
  };

  const handleUpdateScore = (playerIndex: number, amount: number) => {
    setPlayers((prev) => {
      const updated = [...prev];
      updated[playerIndex] = { ...updated[playerIndex], score: updated[playerIndex].score + amount };
      return updated;
    });
  };

  const handleFinalComplete = (finalPlayers: JeopardyPlayer[]) => {
    const winner = determineWinner(finalPlayers);
    completeSession(winner.score);
    recordProgress({
      gameId: 'recovery-jeopardy',
      personaTarget: 'Lisa',
      score: winner.score,
      stats: {
        players: finalPlayers.map((p) => ({ name: p.name, score: p.score })),
        winner: winner.name,
      },
    }).catch(() => { /* best-effort — the game itself already completed for the group */ });
  };

  const handleRestartGame = () => {
    setPlayers([]);
    setCurrentPlayerIndex(0);
    setRound('setup');
    setAnsweredQuestions([]);
    setTotalAnswered(0);
    setCurrentQuestion(null);
    setJeopardyCategories([]);
    setDoubleJeopardyCategories([]);
  };

  const currentCategories = round === 'jeopardy' ? jeopardyCategories : doubleJeopardyCategories;

  return (
    <div className="flex flex-col gap-4">
      {round === 'setup' && <PlayerSetup onStartGame={handleStartGame} />}

      {(round === 'jeopardy' || round === 'double') && (
        <>
          <Scoreboard players={players} currentPlayerIndex={currentPlayerIndex} />
          <JeopardyBoard
            categories={currentCategories}
            round={round}
            onSelectQuestion={handleSelectQuestion}
            answeredQuestions={answeredQuestions}
          />
        </>
      )}

      {round === 'final' && (
        <FinalJeopardy
          players={players}
          onUpdateScore={handleUpdateScore}
          onRestartGame={handleRestartGame}
          onComplete={handleFinalComplete}
        />
      )}

      {currentQuestion && (
        <QuestionModal
          category={currentQuestion.category}
          question={currentQuestion.question}
          round={round}
          onAnswer={handleAnswerOutcome}
          onClose={() => setCurrentQuestion(null)}
        />
      )}

      {round === 'setup' && (
        <button
          onClick={() => navigate('/games')}
          className="text-sm text-slate-500 hover:text-slate-700 font-semibold mt-2"
        >
          &larr; Back to Games
        </button>
      )}
    </div>
  );
}

export default function RecoveryJeopardy() {
  return (
    <GameShell title="Recovery Jeopardy">
      <RecoveryJeopardyGame />
    </GameShell>
  );
}
