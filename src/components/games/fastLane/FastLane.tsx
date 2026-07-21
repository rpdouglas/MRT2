// src/components/games/fastLane/FastLane.tsx
// PROJ-72 (Recovery Games), Phase 4. Ported from the legacy
// `RecoverySimulatorGame` ("Fast Lane") — a multi-week economic life-sim
// with an AI rival, kept per the standing "port the AI-rival framing
// faithfully" decision. Unlike every other Recovery Game, this one is a
// resumable multi-session save (see useGameSave / game_saves collection)
// rather than a single-sitting play-through.
//
// One deliberate deviation from the legacy source, called out per the PR
// template: the legacy used blocking `alert()` popups for both the
// player's win ("🎉 YOU WIN!") and the rival's win ("💔 JOHN G WINS!"),
// the latter hard-stopping the game. Here, reaching Casey's goals first is
// a calm log note that lets the player keep playing toward their own
// goals — no forced "you lose" state — while the win screen itself (and
// the comparison bars throughout) keep the competitive mechanic intact.
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import GameShell from '../GameShell';
import { useGameSession } from '../../../contexts/GameSessionContext';
import { useGameProgress } from '../../../hooks/useGameProgress';
import { useGameSave } from '../../../hooks/useGameSave';
import { DIFFICULTY_LEVELS, RIVAL_NAME, SHOP_ITEMS } from '../../../lib/games/fastLane/gameData';
import {
  createNewGameState,
  resolveWeekEnd,
  runRivalTurn,
  applyWork,
  applyJobSearch,
  applyStudy,
  applyPurchaseItem,
  applyPurchaseApartment,
  applyRest,
  applyAttendSupportMeeting,
  applyShadyGig,
  applyTakeLoan,
  applyRepayLoan,
  applySellItem,
  applyInvest,
  applyCashOut,
} from '../../../lib/games/fastLane/turnEngine';
import type { FastLaneSaveState, FastLaneDifficultyKey, FastLaneParticipantState } from '../../../lib/games/fastLane/types';
import PlayerStatus from './PlayerStatus';
import LocationBoard from './LocationBoard';
import GameLog from './GameLog';

const GAME_ID = 'fast-lane';

function totalWealth(p: FastLaneParticipantState): number {
  return p.money + p.stockShares * p.stockValue;
}

function DifficultySelector({ onSelect }: { onSelect: (key: FastLaneDifficultyKey) => void }) {
  return (
    <div className="flex flex-col gap-4 py-8 px-4 text-center">
      <h3 className="text-lg font-bold text-slate-800">Choose a Starting Point</h3>
      <p className="text-sm text-slate-500 max-w-sm mx-auto">
        A multi-week life-management simulation — build stability week by week alongside {RIVAL_NAME}, an AI companion working toward the same goals. Your progress saves automatically, so you can pick up where you left off.
      </p>
      <div className="flex flex-col gap-3 mt-2">
        {(Object.keys(DIFFICULTY_LEVELS) as FastLaneDifficultyKey[]).map((key) => {
          const level = DIFFICULTY_LEVELS[key];
          return (
            <button
              key={key}
              onClick={() => onSelect(key)}
              className="text-left px-5 py-4 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all active:scale-95"
            >
              <p className="font-bold text-slate-800">{level.name}</p>
              <p className="text-xs text-slate-500 mt-1">
                Start cash: ${level.playerStartMoney}{level.playerStartDebt ? ` (starting debt: $${level.playerStartDebt})` : ''}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FastLaneGame() {
  const navigate = useNavigate();
  const { startSession, setScore, completeSession } = useGameSession();
  const { recordProgress } = useGameProgress();
  const { save, isLoading, saveGame, clearSave } = useGameSave(GAME_ID);

  const [localState, setLocalState] = useState<FastLaneSaveState | null>(null);
  const [activeTab, setActiveTab] = useState<'status' | 'planner' | 'log'>('status');
  const [outcome, setOutcome] = useState<'playing' | 'won'>('playing');
  const [confirmingReset, setConfirmingReset] = useState(false);

  const gameState = localState ?? (save as unknown as FastLaneSaveState | null);

  const persist = useCallback((next: FastLaneSaveState) => {
    setLocalState(next);
    setScore(Math.round(totalWealth(next.player)));
    saveGame({ gameId: GAME_ID, state: next as unknown as Record<string, unknown> }).catch(() => { /* best-effort autosave */ });
  }, [saveGame, setScore]);

  const handleSelectDifficulty = (key: FastLaneDifficultyKey) => {
    startSession(GAME_ID);
    persist(createNewGameState(key));
  };

  const handleStartOver = () => {
    if (!confirmingReset) {
      setConfirmingReset(true);
      return;
    }
    setConfirmingReset(false);
    setOutcome('playing');
    setLocalState(null);
    clearSave().catch(() => { /* best-effort */ });
  };

  const runPlayerUpdate = (updater: (p: FastLaneParticipantState) => FastLaneParticipantState) => {
    if (!gameState || gameState.player.inCrisis) return;
    persist({ ...gameState, player: updater(gameState.player) });
  };

  const handleEndTurn = () => {
    if (!gameState) return;

    const weekResult = resolveWeekEnd(gameState.player, gameState.goals);
    const rivalResult = runRivalTurn(gameState.rival, gameState.goals);

    const logAdditions = [
      '--- Weekly Review ---',
      ...weekResult.logMessages,
      ...rivalResult.logMessages,
    ];

    if (rivalResult.rivalWon && !weekResult.playerWon) {
      logAdditions.push(`${RIVAL_NAME} reached her goals this week. No penalty for taking longer — keep going at your own pace.`);
    }

    logAdditions.push(`--- Week ${weekResult.updatedPlayer.week} Starts ---`);

    const next: FastLaneSaveState = {
      ...gameState,
      player: weekResult.updatedPlayer,
      rival: rivalResult.updatedRival,
      log: [...gameState.log, ...logAdditions],
    };

    persist(next);

    if (weekResult.playerWon) {
      setOutcome('won');
      const wealth = Math.round(totalWealth(next.player));
      completeSession(wealth);
      recordProgress({
        gameId: GAME_ID,
        personaTarget: 'Walt',
        score: wealth,
        stats: {
          weeksToWin: next.player.week,
          difficulty: next.difficulty,
          finalRole: next.player.currentJob.titleRecovery,
        },
      }).catch(() => { /* best-effort — the game itself already completed for the user */ });
      clearSave().catch(() => { /* best-effort */ });
    }
  };

  if (isLoading) {
    return <p className="text-center text-sm text-slate-400 py-12">Loading your save…</p>;
  }

  if (!gameState) {
    return <DifficultySelector onSelect={handleSelectDifficulty} />;
  }

  if (outcome === 'won') {
    return (
      <div className="flex flex-col items-center justify-center text-center gap-3 py-12 px-4">
        <p className="text-lg font-bold text-slate-800">You reached your goals.</p>
        <p className="text-slate-600 max-w-xs">
          It took {gameState.player.week} weeks to build the stability you set out for.
        </p>
        <div className="flex gap-3 mt-2">
          <button
            onClick={handleStartOver}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold active:scale-95 transition-transform"
          >
            {confirmingReset ? 'Confirm: Start Over?' : 'Play Again'}
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

  const difficultyMeta = DIFFICULTY_LEVELS[gameState.difficulty];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        {(['status', 'planner', 'log'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === tab ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {tab === 'status' ? 'Status' : tab === 'planner' ? 'Weekly Planner' : 'Game Log'}
          </button>
        ))}
      </div>

      {activeTab === 'status' && (
        <PlayerStatus player={gameState.player} rival={gameState.rival} goals={gameState.goals} difficulty={difficultyMeta} />
      )}

      {activeTab === 'planner' && (
        <LocationBoard
          player={gameState.player}
          onWork={() => runPlayerUpdate(applyWork)}
          onJobSearch={() => runPlayerUpdate(applyJobSearch)}
          onStudy={(course) => runPlayerUpdate((p) => applyStudy(p, course, gameState.goals))}
          onPurchaseItem={(item) => runPlayerUpdate((p) => applyPurchaseItem(p, item, gameState.goals))}
          onPurchaseApartment={(tier) => runPlayerUpdate((p) => applyPurchaseApartment(p, tier, gameState.goals))}
          onRest={() => {
            if (!gameState) return;
            persist({ ...gameState, player: applyRest(gameState.player, gameState.goals) });
          }}
          onAttendSupportMeeting={() => runPlayerUpdate((p) => applyAttendSupportMeeting(p, gameState.goals))}
          onShadyGig={() => runPlayerUpdate(applyShadyGig)}
          onTakeLoan={(amount) => runPlayerUpdate((p) => applyTakeLoan(p, amount))}
          onRepayLoan={(amount) => runPlayerUpdate((p) => applyRepayLoan(p, amount))}
          onSellItem={(itemId) => runPlayerUpdate((p) => applySellItem(p, itemId, SHOP_ITEMS))}
          onInvest={(amount) => runPlayerUpdate((p) => applyInvest(p, amount))}
          onCashOut={(shares) => runPlayerUpdate((p) => applyCashOut(p, shares))}
          onEndTurn={handleEndTurn}
        />
      )}

      {activeTab === 'log' && (
        <>
          <GameLog log={gameState.log} />
          <button
            onClick={handleStartOver}
            className="text-sm text-slate-400 hover:text-slate-600 font-semibold self-start"
          >
            {confirmingReset ? 'Confirm: Start a new game? (this abandons the current save)' : 'Start a new game'}
          </button>
        </>
      )}
    </div>
  );
}

export default function FastLane() {
  return (
    <GameShell title="Fast Lane">
      <FastLaneGame />
    </GameShell>
  );
}
