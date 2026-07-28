// src/components/games/goalLadder/LadderProgress.tsx
// PROJ-72 (Recovery Games), Goal Ladder immersive redesign. A pure,
// presentational SVG ladder — rungs light up as `rung` climbs toward
// `total`, with a marker tracking the current position. No hooks, no
// context: fully determined by props, same colocated-data split as
// goalLadderData.ts already establishes for this game.

// Matches PERSONA_COLORS.ned in src/pages/GamesHub.tsx (Goal Ladder's
// target persona) — duplicated here intentionally rather than exporting
// that (module-local, non-exported) constant out of GamesHub.tsx for one value.
export const NED_TEAL = '#2DD4BF';

interface LadderProgressProps {
  rung: number;
  total: number;
  className?: string;
}

const VIEW_HEIGHT = 200;
const TOP_Y = 12;
const BOTTOM_Y = 188;
const RAIL_LEFT_X = 18;
const RAIL_RIGHT_X = 82;
const RUNG_LEFT_X = 22;
const RUNG_RIGHT_X = 78;

export default function LadderProgress({ rung, total, className = '' }: LadderProgressProps) {
  const rungYs = Array.from({ length: total }, (_, i) => BOTTOM_Y - i * ((BOTTOM_Y - TOP_Y) / (total - 1)));
  const markerY = rung === 0 ? BOTTOM_Y + 8 : rungYs[Math.min(rung, total) - 1];

  return (
    <svg
      viewBox={`0 0 100 ${VIEW_HEIGHT}`}
      className={`w-[110px] h-[200px] ${className}`}
      role="img"
      aria-label={`Ladder progress: ${rung} of ${total} rungs climbed`}
    >
      <line x1={RAIL_LEFT_X} y1={TOP_Y} x2={RAIL_LEFT_X} y2={BOTTOM_Y} stroke="rgba(255,255,255,0.18)" strokeWidth={4} strokeLinecap="round" />
      <line x1={RAIL_RIGHT_X} y1={TOP_Y} x2={RAIL_RIGHT_X} y2={BOTTOM_Y} stroke="rgba(255,255,255,0.18)" strokeWidth={4} strokeLinecap="round" />

      {rungYs.map((y, i) => {
        const climbed = i < rung;
        return (
          <line
            key={i}
            x1={RUNG_LEFT_X}
            y1={y}
            x2={RUNG_RIGHT_X}
            y2={y}
            stroke={climbed ? NED_TEAL : 'rgba(255,255,255,0.15)'}
            strokeWidth={climbed ? 5 : 4}
            strokeLinecap="round"
            style={climbed ? { filter: `drop-shadow(0 0 4px ${NED_TEAL}88)` } : undefined}
          />
        );
      })}

      <g style={{ transform: `translateY(${markerY - (BOTTOM_Y + 8)}px)`, transition: 'transform 450ms cubic-bezier(0.34,1.56,0.64,1)' }}>
        <circle cx={50} cy={BOTTOM_Y + 8} r={7} fill={NED_TEAL} stroke="white" strokeOpacity={0.6} strokeWidth={1.5} />
      </g>
    </svg>
  );
}
