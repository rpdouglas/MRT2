// src/components/games/fastLane/PlayerStatus.tsx
// PROJ-72 (Recovery Games), Phase 4. Ported from the legacy PlayerStatus.jsx.
// Keeps the head-to-head comparison bars against the AI rival ("Casey" —
// renamed from the legacy's "John G") per the standing "port the AI-rival
// framing faithfully" decision in docs/projects/72_RECOVERY_GAMES.md Phase 4.
import { RIVAL_NAME, SHOP_ITEMS } from '../../../lib/games/fastLane/gameData';
import { calculateStressLevel } from '../../../lib/games/fastLane/turnEngine';
import type { FastLaneParticipantState, FastLaneGoals, FastLaneDifficulty } from '../../../lib/games/fastLane/types';

interface PlayerStatusProps {
  player: FastLaneParticipantState;
  rival: FastLaneParticipantState;
  goals: FastLaneGoals;
  difficulty: FastLaneDifficulty;
}

function goalProgress(current: number, target: number): number {
  if (target <= 0) return 100;
  return Math.min(100, Math.round((current / target) * 100));
}

function ComparisonBar({ label, youPct, rivalPct }: { label: string; youPct: number; rivalPct: number }) {
  return (
    <div className="mb-3">
      <p className="text-xs font-semibold text-slate-500 mb-1">{label}</p>
      <div className="relative h-5 rounded-full bg-slate-100 overflow-hidden mb-1">
        <div className="h-full bg-indigo-500 flex items-center justify-end pr-2 text-[10px] font-bold text-white" style={{ width: `${youPct}%` }}>
          {youPct > 12 && `You ${youPct}%`}
        </div>
      </div>
      <div className="relative h-5 rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full bg-rose-400 flex items-center justify-end pr-2 text-[10px] font-bold text-white" style={{ width: `${rivalPct}%` }}>
          {rivalPct > 12 && `${RIVAL_NAME} ${rivalPct}%`}
        </div>
      </div>
    </div>
  );
}

export default function PlayerStatus({ player, rival, goals, difficulty }: PlayerStatusProps) {
  const playerWealth = player.money + player.stockShares * player.stockValue;
  const rivalWealth = rival.money + rival.stockShares * rival.stockValue;
  const playerStress = calculateStressLevel(player);
  const rivalStress = calculateStressLevel(rival);
  const itemNames = player.inventory.map((id) => SHOP_ITEMS.find((i) => i.id === id)?.name || id);

  return (
    <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4">
      <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-1">Week {player.week}</h3>
      <p className="text-xs text-slate-400 mb-4">{difficulty.name} mode</p>

      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div>
          <p className="font-bold text-indigo-600">You {player.inCrisis && <span className="text-rose-500 font-semibold">(Stabilizing)</span>}</p>
          <p className="text-slate-500">Home: {player.livingSituation.name}</p>
          <p className="text-slate-500">Funds: ${player.money.toFixed(0)}</p>
          <p className="text-slate-500">Role: {player.currentJob.titleRecovery}</p>
        </div>
        <div>
          <p className="font-bold text-rose-500">{RIVAL_NAME} {rival.inCrisis && <span className="text-rose-500 font-semibold">(Stabilizing)</span>}</p>
          <p className="text-slate-500">Home: {rival.livingSituation.name}</p>
          <p className="text-slate-500">Funds: ${rival.money.toFixed(0)}</p>
          <p className="text-slate-500">Role: {rival.currentJob.titleRecovery}</p>
        </div>
      </div>

      <ComparisonBar label={`Stress Level (You ${playerStress}% / ${RIVAL_NAME} ${rivalStress}%)`} youPct={playerStress} rivalPct={rivalStress} />
      <ComparisonBar
        label={`Financial Stability (Goal: $${goals.wealth.toLocaleString()})`}
        youPct={goalProgress(playerWealth, goals.wealth)}
        rivalPct={goalProgress(rivalWealth, goals.wealth)}
      />
      <ComparisonBar
        label={`Wellbeing (Goal: ${goals.wellbeing} pts)`}
        youPct={goalProgress(player.wellbeing, goals.wellbeing)}
        rivalPct={goalProgress(rival.wellbeing, goals.wellbeing)}
      />
      <ComparisonBar
        label={`Skill Building (Goal: ${goals.education}%)`}
        youPct={goalProgress(player.education, goals.education)}
        rivalPct={goalProgress(rival.education, goals.education)}
      />

      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mt-4 mb-2">Inventory</h4>
      {itemNames.length > 0 ? (
        <ul className="text-sm text-slate-600 list-disc list-inside">
          {itemNames.map((name, i) => <li key={i}>{name}</li>)}
        </ul>
      ) : (
        <p className="text-sm text-slate-400">No supportive items purchased yet.</p>
      )}
    </div>
  );
}
