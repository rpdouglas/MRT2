import React from "react";
import {
  ChevronLeft, ChevronRight, Wind, Users, Gauge, TrendingUp,
  Brain, Crosshair, BookOpen, Grid3x3, Anchor,
} from "lucide-react";

/**
 * Unified Hero — the whole Games list styled like the "Today's Focus"
 * dark card, with grouping (persona / need / tabs) dropped entirely
 * in favor of one flat list.
 *
 * Craving Buster and Thought Challenge are set to `active: false`
 * below rather than deleted — their entries and code stay intact,
 * they're just filtered out of what renders. Flip `active` back to
 * true to bring either one back into the list.
 *
 * Note: removing those two brings the list from 9 to 7, not 6 — if a
 * third game should come off the list too, easy to flip its `active`
 * flag as well.
 *
 * Persona color is kept on each icon badge (not shown as a text
 * label or grouping) purely so the flat list still has some visual
 * variety/wayfinding at a glance, without reintroducing grouping.
 */

const FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
  .font-body { font-family: 'DM Sans', system-ui, sans-serif; }
  .font-mono-data { font-family: 'JetBrains Mono', monospace; }
`;

const PERSONA_COLORS = {
  walt: "#60A5FA",
  ned: "#2DD4BF",
  lisa: "#FB923C",
  david: "#38BDF8",
  groups: "#C084FC",
  everyone: "#F0ABFC",
};

const GAMES = [
  { id: "craving-buster", title: "Craving Buster", desc: "A short, calming breathing-rhythm game for the middle of an urge.", persona: "david", icon: Wind, daily: false, chip: null, active: false },
  { id: "recovery-jeopardy", title: "Recovery Jeopardy", desc: "A pass-the-device trivia game — play it with your group, sponsor, or sponsee.", persona: "groups", icon: Users, daily: false, chip: null, active: true },
  { id: "fast-lane", title: "Fast Lane", desc: "A multi-week life-management simulation — build stability week by week.", persona: "walt", icon: Gauge, daily: false, chip: "Continue · Week 4", active: true },
  { id: "goal-ladder", title: "Goal Ladder", desc: "Momentum-building steps that never punish a broken streak.", persona: "ned", icon: TrendingUp, daily: false, chip: null, active: true },
  { id: "thought-challenge", title: "Thought Challenge", desc: "A CBT-style reframing game for service burnout.", persona: "lisa", icon: Brain, daily: false, chip: null, active: false },
  { id: "trigger-match", title: "Trigger Match", desc: "Pattern-recognition practice for spotting a trigger before it lands.", persona: "walt", icon: Crosshair, daily: false, chip: null, active: true },
  { id: "knowledge-quests", title: "Knowledge Quests", desc: "Short quiz packs on recovery-adjacent topics — stress, habits, sleep, and more.", persona: "everyone", icon: BookOpen, daily: false, chip: null, active: true },
  { id: "daily-crossword", title: "Daily Crossword", desc: "Today's puzzle, themed around Boundaries.", persona: "everyone", icon: Grid3x3, daily: true, chip: null, active: true },
  { id: "anchor-words", title: "Anchor Words", desc: "Find today's Anchor and its supporting words in the grid.", persona: "everyone", icon: Anchor, daily: true, chip: "New", active: true },
];

const ACTIVE_GAMES = GAMES.filter((g) => g.active);

const TODAY_THEME = "Boundaries";
const TODAY_LABEL = "TODAY · JUL 27";

function GameRow({ game }) {
  const Icon = game.icon;
  const color = PERSONA_COLORS[game.persona];
  return (
    <button className="w-full flex items-center gap-3 rounded-2xl px-3.5 py-3 bg-white/[0.06] border border-white/10 text-left active:bg-white/[0.1] transition-colors">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${color}26` }}
      >
        <Icon size={17} style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-body font-semibold text-[14.5px] text-white truncate">{game.title}</span>
          {game.daily && (
            <span className="font-mono-data text-[8px] tracking-wide px-1.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 shrink-0">
              DAILY
            </span>
          )}
          {game.chip && (
            <span className="font-body text-[9.5px] font-medium px-1.5 py-0.5 rounded-full bg-white/10 text-purple-100/80 shrink-0">
              {game.chip}
            </span>
          )}
        </div>
        <p className="font-body text-[12px] text-purple-200/60 leading-snug mt-0.5 truncate">{game.desc}</p>
      </div>
      <ChevronRight size={16} className="text-purple-300/50 shrink-0" />
    </button>
  );
}

export default function RecoveryGamesUnifiedHero() {
  return (
    <div className="min-h-screen flex justify-center" style={{ backgroundColor: "#FBEFFA" }}>
      <style>{FONTS}</style>
      <div className="w-full max-w-[420px] pb-10">

        {/* Page heading */}
        <div className="px-5 pt-6 pb-4 flex items-start gap-3">
          <button className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm shrink-0 mt-0.5">
            <ChevronLeft size={18} className="text-slate-500" />
          </button>
          <div>
            <h1 className="font-body font-bold text-[24px] text-slate-900 leading-tight">Recovery Games</h1>
            <p className="font-body text-[13.5px] text-slate-500 mt-0.5">Zero-knowledge, anti-shame mini-games</p>
          </div>
        </div>

        {/* One unified dark card — every game, no grouping */}
        <div className="mx-4">
          <div
            className="relative overflow-hidden rounded-[28px] px-5 pt-5 pb-5"
            style={{
              background: "linear-gradient(160deg, #2E1A47 0%, #1B0F2E 100%)",
              boxShadow: "0 20px 40px -12px rgba(59, 20, 90, 0.45)",
            }}
          >
            <div
              className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-30 blur-3xl pointer-events-none"
              style={{ background: "radial-gradient(circle, #EC4899, transparent 70%)" }}
            />
            <div
              className="absolute -bottom-16 -left-10 w-40 h-40 rounded-full opacity-20 blur-3xl pointer-events-none"
              style={{ background: "radial-gradient(circle, #A855F7, transparent 70%)" }}
            />

            <div className="relative">
              <span className="font-mono-data text-[10px] tracking-widest text-purple-300/70">{TODAY_LABEL}</span>
              <h2 className="font-body font-bold text-[26px] text-white mt-1 leading-tight">{TODAY_THEME}</h2>
              <p className="font-body text-[12.5px] text-purple-200/70 mt-1">Today's theme across Recovery Games</p>

              <div className="mt-4 flex flex-col gap-2">
                {ACTIVE_GAMES.map((game) => (
                  <GameRow key={game.id} game={game} />
                ))}
              </div>

              <p className="font-body text-[10.5px] text-purple-300/40 mt-4 text-center">
                No timer, no streak, no score kept.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
