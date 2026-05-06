interface RhythmScoreRingProps {
  score: number; // 0-100
  size?: number; // diameter in px, default 52
}

function ringColor(score: number): string {
  if (score >= 70) return '#22c55e'; // green-500
  if (score >= 40) return '#f59e0b'; // amber-500
  return '#94a3b8';                  // slate-400 (muted)
}

export default function RhythmScoreRing({ score, size = 52 }: RhythmScoreRingProps) {
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(score, 100) / 100) * circumference;
  const color = ringColor(score);

  return (
    <div
      className="flex flex-col items-center gap-0.5"
      title={`14-Day Rhythm: ${score} — based on days with at least one completed habit`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={4}
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
        {/* Score number — un-rotate to read correctly */}
        <text
          x={size / 2}
          y={size / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fill={color}
          fontSize={size >= 48 ? 13 : 10}
          fontWeight="bold"
          style={{ transform: `rotate(90deg)`, transformOrigin: `${size / 2}px ${size / 2}px` }}
        >
          {score}
        </text>
      </svg>
      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide leading-none">
        Rhythm
      </span>
    </div>
  );
}
