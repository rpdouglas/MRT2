/**
 * src/pages/GamesHub.tsx
 * PROJ-72 (Recovery Games). Landing page for the games route. All persona
 * games shipped as of Phase 5 — Craving Buster (David), Recovery Jeopardy
 * (Groups), Fast Lane (Walt), Goal Ladder (Ned), Thought Challenge (Lisa),
 * Trigger Match (Walt). Persona palette matches
 * docs/projects/72_RECOVERY_GAMES.md: David sky, Ned green/cyan, Lisa amber,
 * Walt fuchsia.
 */
import { Link } from 'react-router-dom';
import VibrantHeader from '../components/VibrantHeader';
import { TrophyIcon } from '@heroicons/react/24/outline';

export default function GamesHub() {
  return (
    <div className="pb-24">
      <VibrantHeader
        title="Recovery Games"
        subtitle="Zero-knowledge, anti-shame mini-games"
        icon={TrophyIcon}
        fromColor="from-indigo-500"
        viaColor="via-violet-500"
        toColor="to-purple-600"
        backLink="/dashboard"
      />

      <div className="px-4 -mt-10 relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          to="/games/craving-buster"
          className="relative overflow-hidden rounded-2xl px-5 py-4 bg-gradient-to-br from-sky-400 to-blue-500 text-white shadow-lg transition-transform active:scale-95 hover:shadow-xl"
        >
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold uppercase tracking-wider opacity-90">Craving Buster</span>
            </div>
            <p className="text-xs leading-relaxed opacity-90 mb-2">A short, calming breathing-rhythm game for the middle of an urge.</p>
            <span className="text-[10px] font-semibold uppercase tracking-wider opacity-75">For David</span>
          </div>
        </Link>

        <Link
          to="/games/recovery-jeopardy"
          className="relative overflow-hidden rounded-2xl px-5 py-4 bg-gradient-to-br from-violet-400 to-purple-600 text-white shadow-lg transition-transform active:scale-95 hover:shadow-xl"
        >
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold uppercase tracking-wider opacity-90">Recovery Jeopardy</span>
            </div>
            <p className="text-xs leading-relaxed opacity-90 mb-2">A pass-the-device trivia game — play it with your group, sponsor, or sponsee.</p>
            <span className="text-[10px] font-semibold uppercase tracking-wider opacity-75">For Groups</span>
          </div>
        </Link>

        <Link
          to="/games/fast-lane"
          className="relative overflow-hidden rounded-2xl px-5 py-4 bg-gradient-to-br from-teal-400 to-blue-600 text-white shadow-lg transition-transform active:scale-95 hover:shadow-xl"
        >
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold uppercase tracking-wider opacity-90">Fast Lane</span>
            </div>
            <p className="text-xs leading-relaxed opacity-90 mb-2">A multi-week life-management simulation — build stability week by week, saved automatically as you go.</p>
            <span className="text-[10px] font-semibold uppercase tracking-wider opacity-75">For Walt</span>
          </div>
        </Link>

        <Link
          to="/games/goal-ladder"
          className="relative overflow-hidden rounded-2xl px-5 py-4 bg-gradient-to-br from-emerald-400 to-cyan-500 text-white shadow-lg transition-transform active:scale-95 hover:shadow-xl"
        >
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold uppercase tracking-wider opacity-90">Goal Ladder</span>
            </div>
            <p className="text-xs leading-relaxed opacity-90 mb-2">Momentum-building steps that never punish a broken streak.</p>
            <span className="text-[10px] font-semibold uppercase tracking-wider opacity-75">For Ned</span>
          </div>
        </Link>

        <Link
          to="/games/thought-challenge"
          className="relative overflow-hidden rounded-2xl px-5 py-4 bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg transition-transform active:scale-95 hover:shadow-xl"
        >
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold uppercase tracking-wider opacity-90">Thought Challenge</span>
            </div>
            <p className="text-xs leading-relaxed opacity-90 mb-2">A CBT-style reframing game for service burnout.</p>
            <span className="text-[10px] font-semibold uppercase tracking-wider opacity-75">For Lisa</span>
          </div>
        </Link>

        <Link
          to="/games/trigger-match"
          className="relative overflow-hidden rounded-2xl px-5 py-4 bg-gradient-to-br from-fuchsia-400 to-rose-500 text-white shadow-lg transition-transform active:scale-95 hover:shadow-xl"
        >
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold uppercase tracking-wider opacity-90">Trigger Match</span>
            </div>
            <p className="text-xs leading-relaxed opacity-90 mb-2">Pattern-recognition practice for spotting a trigger before it lands.</p>
            <span className="text-[10px] font-semibold uppercase tracking-wider opacity-75">For Walt</span>
          </div>
        </Link>

        <Link
          to="/games/knowledge-quests"
          className="relative overflow-hidden rounded-2xl px-5 py-4 bg-gradient-to-br from-yellow-400 to-lime-500 text-white shadow-lg transition-transform active:scale-95 hover:shadow-xl"
        >
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold uppercase tracking-wider opacity-90">Knowledge Quests</span>
            </div>
            <p className="text-xs leading-relaxed opacity-90 mb-2">Short quiz packs on recovery-adjacent topics — stress, habits, sleep, and more.</p>
            <span className="text-[10px] font-semibold uppercase tracking-wider opacity-75">For Everyone</span>
          </div>
        </Link>
      </div>
    </div>
  );
}
