/**
 * src/pages/GamesHub.tsx
 * PROJ-72 (Recovery Games) / PROJ-80 (Unified Hero restyle). Landing page
 * for the games route. One dark unified card with a flat list of game rows
 * — persona grouping dropped in favor of a per-row icon tint, matching
 * docs/reports/RecoveryGamesUnifiedHero.jsx. Craving Buster and Thought
 * Challenge are kept in GAMES with `active: false` rather than deleted —
 * their routes/components are untouched, they're just filtered out of what
 * renders here. Flip `active` back to `true` to bring either one back.
 */
import type { ElementType } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CloudIcon,
  UserGroupIcon,
  RocketLaunchIcon,
  ArrowTrendingUpIcon,
  LightBulbIcon,
  ViewfinderCircleIcon,
  BookOpenIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline';
import { useGameSave } from '../hooks/useGameSave';
import type { FastLaneSaveState } from '../lib/games/fastLane/types';

type GamePersona = 'david' | 'ned' | 'lisa' | 'walt' | 'groups' | 'everyone';

interface GameEntry {
  id: string;
  title: string;
  desc: string;
  persona: GamePersona;
  icon: ElementType;
  daily?: boolean;
  active: boolean;
}

const PERSONA_COLORS: Record<GamePersona, string> = {
  walt: '#60A5FA',
  ned: '#2DD4BF',
  lisa: '#FB923C',
  david: '#38BDF8',
  groups: '#C084FC',
  everyone: '#F0ABFC',
};

const GAMES: GameEntry[] = [
  { id: 'craving-buster', title: 'Craving Buster', desc: 'A short, calming breathing-rhythm game for the middle of an urge.', persona: 'david', icon: CloudIcon, active: false },
  { id: 'recovery-jeopardy', title: 'Recovery Jeopardy', desc: 'A pass-the-device trivia game — play it with your group, sponsor, or sponsee.', persona: 'groups', icon: UserGroupIcon, active: true },
  { id: 'fast-lane', title: 'Fast Lane', desc: 'A multi-week life-management simulation — build stability week by week.', persona: 'walt', icon: RocketLaunchIcon, active: true },
  { id: 'goal-ladder', title: 'Goal Ladder', desc: 'Momentum-building steps that never punish a broken streak.', persona: 'ned', icon: ArrowTrendingUpIcon, active: true },
  { id: 'thought-challenge', title: 'Thought Challenge', desc: 'A CBT-style reframing game for service burnout.', persona: 'lisa', icon: LightBulbIcon, active: false },
  { id: 'trigger-match', title: 'Trigger Match', desc: 'Pattern-recognition practice for spotting a trigger before it lands.', persona: 'walt', icon: ViewfinderCircleIcon, active: true },
  { id: 'knowledge-quests', title: 'Knowledge Quests', desc: 'Short quiz packs on recovery-adjacent topics — stress, habits, sleep, and more.', persona: 'everyone', icon: BookOpenIcon, active: true },
  { id: 'daily-crossword', title: 'Daily Crossword', desc: "Today's puzzle, themed around a recovery concept.", persona: 'everyone', icon: Squares2X2Icon, daily: true, active: true },
];

const ACTIVE_GAMES = GAMES.filter((g) => g.active);

function GameRow({ game, chip }: { game: GameEntry; chip?: string }) {
  const Icon = game.icon;
  const color = PERSONA_COLORS[game.persona];
  return (
    <Link
      to={`/games/${game.id}`}
      className="w-full flex items-center gap-3 rounded-2xl px-3.5 py-3 bg-white/[0.06] border border-white/10 text-left active:bg-white/[0.1] transition-colors"
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${color}26` }}
      >
        <Icon className="h-[17px] w-[17px]" style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-[14.5px] text-white truncate">{game.title}</span>
          {game.daily && (
            <span className="text-[8px] font-mono tracking-wide px-1.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 shrink-0">
              DAILY
            </span>
          )}
          {chip && (
            <span className="text-[9.5px] font-medium px-1.5 py-0.5 rounded-full bg-white/10 text-purple-100/80 shrink-0">
              {chip}
            </span>
          )}
        </div>
        <p className="text-[12px] text-purple-200/60 leading-snug mt-0.5 truncate">{game.desc}</p>
      </div>
      <ChevronRightIcon className="h-4 w-4 text-purple-300/50 shrink-0" />
    </Link>
  );
}

export default function GamesHub() {
  const { save: fastLaneSave } = useGameSave('fast-lane');
  const fastLaneState = fastLaneSave as unknown as FastLaneSaveState | null;
  const fastLaneChip = fastLaneState ? `Continue · Week ${fastLaneState.player.week}` : undefined;

  return (
    <div className="pb-24">
      <div className="px-5 pt-6 pb-4 flex items-start gap-3">
        <Link
          to="/dashboard"
          className="w-11 h-11 rounded-xl bg-white flex items-center justify-center shadow-sm shrink-0 mt-0.5"
        >
          <ChevronLeftIcon className="h-5 w-5 text-slate-500" />
        </Link>
        <div>
          <h1 className="font-bold text-2xl text-slate-900 leading-tight">Recovery Games</h1>
          <p className="text-sm text-slate-500 mt-0.5">Zero-knowledge, anti-shame mini-games</p>
        </div>
      </div>

      <div className="px-4">
        <div
          className="relative overflow-hidden rounded-[28px] px-5 pt-5 pb-5"
          style={{
            background: 'linear-gradient(160deg, #2E1A47 0%, #1B0F2E 100%)',
            boxShadow: '0 20px 40px -12px rgba(59, 20, 90, 0.45)',
          }}
        >
          <div
            className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-30 blur-3xl pointer-events-none"
            style={{ background: 'radial-gradient(circle, #EC4899, transparent 70%)' }}
          />
          <div
            className="absolute -bottom-16 -left-10 w-40 h-40 rounded-full opacity-20 blur-3xl pointer-events-none"
            style={{ background: 'radial-gradient(circle, #A855F7, transparent 70%)' }}
          />

          <div className="relative flex flex-col gap-2">
            {ACTIVE_GAMES.map((game) => (
              <GameRow key={game.id} game={game} chip={game.id === 'fast-lane' ? fastLaneChip : undefined} />
            ))}
          </div>

          <p className="text-[10.5px] text-purple-300/40 mt-4 text-center">
            No timer, no streak, no score kept.
          </p>
        </div>
      </div>
    </div>
  );
}
