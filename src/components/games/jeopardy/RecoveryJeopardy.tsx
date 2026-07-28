// src/components/games/jeopardy/RecoveryJeopardy.tsx
// PROJ-72 (Recovery Games), Phase 3. Ported from the legacy Recovery
// Jeopardy game (local pass-the-device, 1-3 player/team trivia — 2 rounds
// + Final Jeopardy wagering, self-graded scoring). Kept as a genuinely
// multiplayer group activity per the /planning decision in
// docs/projects/72_RECOVERY_GAMES.md Phase 3 — unlike every other
// Recovery Game, this one is designed to be played by a group passing one
// device around (e.g. a sponsor/sponsee session or a home-group activity).
//
// PROJ-86: every round now renders inside one dark-immersive full-bleed
// shell (same visual family as GoalLadder.tsx) instead of GameShell's
// light chrome — GameShell itself is untouched (still used by
// CravingBuster/ThoughtChallenge/TriggerMatch/FastLane). JeopardyBoard
// (the category/dollar-value grid) is deliberately left alone — it's
// styled to look like the real Jeopardy board, not this app's chrome —
// and Scoreboard/QuestionModal/FinalJeopardy keep their light-card look,
// just with a touched-up shadow/ring so they read as intentional light
// cards floating on the dark shell rather than an unstyled leftover.
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrophyIcon, HomeIcon, PauseIcon, PlayIcon } from '@heroicons/react/24/outline';
import { GameSessionProvider, useGameSession } from '../../../contexts/GameSessionContext';
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
  const { startSession, setScore, completeSession, resetSession, phase, score, pauseSession, resumeSession } = useGameSession();
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

  const handleExit = () => {
    resetSession();
    navigate('/games');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[linear-gradient(160deg,#2E1A47_0%,#1B0F2E_100%)] text-white relative overflow-hidden">
      <div className="absolute -top-10 -right-10 w-64 h-64 bg-[#C084FC]/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-[#A855F7]/15 rounded-full blur-3xl pointer-events-none" />

      <div className={`relative z-10 flex flex-col flex-1 w-full mx-auto px-4 py-4 gap-4 ${round === 'setup' ? 'max-w-[420px]' : 'max-w-2xl'}`}>
        <div className="flex items-center justify-between shrink-0">
          <h1 className="text-xl font-bold tracking-tight text-white">Recovery Jeopardy</h1>
          {phase !== 'idle' && (
            <div className="flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1.5">
              <TrophyIcon className="h-4 w-4 text-[#C084FC]" />
              <span className="text-sm font-semibold font-mono">${score}</span>
            </div>
          )}
        </div>

        <div className={`flex-1 flex flex-col gap-4 ${round === 'setup' ? 'items-center justify-center' : ''}`}>
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
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[#C084FC] hover:bg-white/10 active:scale-95 transition-colors"
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

export default function RecoveryJeopardy() {
  return (
    <GameSessionProvider>
      <RecoveryJeopardyGame />
    </GameSessionProvider>
  );
}
