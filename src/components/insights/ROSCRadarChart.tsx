import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from 'recharts';
import type { ROSCAssessment } from '../../lib/types/rosc';

interface Props {
    current: ROSCAssessment;
    previous?: ROSCAssessment;
}

const DOMAINS = ['Health', 'Home', 'Purpose', 'Community'] as const;

function scoreColor(score: number) {
    if (score >= 7) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (score >= 4) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-gray-500 bg-gray-50 border-gray-200';
}

function trajectoryLabel(t: ROSCAssessment['trajectory'], prevTotal?: number, currTotal?: number): string {
    if (t === 'Declining') return 'Room to grow this month';
    if (t === 'Improving' && prevTotal !== undefined && currTotal !== undefined) {
        return `Up from ${prevTotal} last month`;
    }
    if (t === 'Stable') return 'Similar to last month';
    if (t === 'Insufficient Data') return 'Based on your check-in';
    return '';
}

export default function ROSCRadarChart({ current, previous }: Props) {
    const chartData = DOMAINS.map((d) => {
        const key = d.toLowerCase() as keyof typeof current.scores;
        return {
            domain: d,
            score: current.scores[key].score,
            prevScore: previous ? previous.scores[key].score : undefined,
            fullMark: 10,
        };
    });

    const subtitle = trajectoryLabel(current.trajectory, previous?.totalScore, current.totalScore);

    return (
        <div className="space-y-4">
            <div className="text-center">
                <div className="text-3xl font-black text-gray-900">
                    {current.totalScore}
                    <span className="text-lg font-normal text-gray-400">/40</span>
                </div>
                <div className="text-sm font-medium text-gray-500 mt-0.5">Total Recovery Capital</div>
                {subtitle && (
                    <div className="text-xs font-semibold text-fuchsia-600 mt-1">{subtitle}</div>
                )}
            </div>

            <ResponsiveContainer width="100%" height={220}>
                <RadarChart cx="50%" cy="50%" outerRadius="72%" data={chartData}>
                    <PolarGrid stroke="rgba(255,255,255,0.15)" />
                    <PolarAngleAxis
                        dataKey="domain"
                        tick={{ fontSize: 11, fill: '#6b7280', fontWeight: 600 }}
                    />
                    {previous && (
                        <Radar
                            name="Last month"
                            dataKey="prevScore"
                            stroke="rgba(255,255,255,0.6)"
                            fill="rgba(255,255,255,0.1)"
                            strokeWidth={1.5}
                            strokeDasharray="4 2"
                        />
                    )}
                    <Radar
                        name="This month"
                        dataKey="score"
                        stroke="#8B5CF6"
                        fill="rgba(139,92,246,0.25)"
                        strokeWidth={2}
                        isAnimationActive
                        animationDuration={600}
                        animationEasing="ease-out"
                    />
                </RadarChart>
            </ResponsiveContainer>

            {previous && (
                <div className="flex justify-center gap-4 text-xs font-medium text-gray-500">
                    <span className="flex items-center gap-1.5">
                        <span className="w-3 h-0.5 bg-violet-500 rounded-full inline-block" />
                        This month
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-3 h-0.5 bg-gray-300 rounded-full inline-block" style={{ borderTop: '1px dashed #9ca3af' }} />
                        Last month
                    </span>
                </div>
            )}

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {DOMAINS.map((d) => {
                    const key = d.toLowerCase() as keyof typeof current.scores;
                    const score = current.scores[key].score;
                    return (
                        <div
                            key={d}
                            className={`flex flex-col items-center py-2 px-3 rounded-xl border text-xs font-bold ${scoreColor(score)}`}
                        >
                            <span className="text-[10px] font-semibold uppercase tracking-wide opacity-70 mb-0.5">{d}</span>
                            <span className="text-base font-black">{score}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
