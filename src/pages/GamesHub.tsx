/**
 * src/pages/GamesHub.tsx
 * PROJ-72 (Recovery Games), Phase 1: Architecture & Foundation.
 * Landing page for the games route — foundation-only for now, so every game
 * card is a "Coming Soon" placeholder (Phase 2+ ships the real games behind
 * these slots). Persona palette matches docs/projects/72_RECOVERY_GAMES.md /
 * the informal master plan: David sky, Ned green/cyan, Lisa amber, Walt fuchsia.
 */
import VibrantHeader from '../components/VibrantHeader';
import { TrophyIcon } from '@heroicons/react/24/outline';

interface GameSlot {
  title: string;
  persona: 'David' | 'Ned' | 'Lisa' | 'Walt';
  description: string;
  gradient: string;
}

const GAME_SLOTS: GameSlot[] = [
  { title: 'Craving Buster', persona: 'David', description: 'A short, calming mini-game for the middle of an urge.', gradient: 'from-sky-400 to-blue-500' },
  { title: 'Goal Ladder', persona: 'Ned', description: 'Momentum-building steps that never punish a broken streak.', gradient: 'from-emerald-400 to-cyan-500' },
  { title: 'Thought Challenge', persona: 'Lisa', description: 'A CBT-style reframing game for service burnout.', gradient: 'from-amber-400 to-orange-500' },
  { title: 'Trigger Match', persona: 'Walt', description: 'Pattern-recognition practice grounded in your own history.', gradient: 'from-fuchsia-400 to-rose-500' },
];

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
        {GAME_SLOTS.map((slot) => (
          <div
            key={slot.title}
            className={`relative overflow-hidden rounded-2xl px-5 py-4 bg-gradient-to-br ${slot.gradient} text-white shadow-lg opacity-70`}
          >
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold uppercase tracking-wider opacity-90">{slot.title}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded">
                  Coming Soon
                </span>
              </div>
              <p className="text-xs leading-relaxed opacity-90 mb-2">{slot.description}</p>
              <span className="text-[10px] font-semibold uppercase tracking-wider opacity-75">For {slot.persona}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
