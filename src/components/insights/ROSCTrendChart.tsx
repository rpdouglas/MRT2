import { useMemo, useState } from 'react';
import {
    AreaChart,
    Area,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { SparklesIcon } from '@heroicons/react/24/outline';
import type { ROSCAssessment } from '../../lib/types/rosc';
import type { ROSCCadence } from '../../lib/roscCadence';
import { buildROSCTrendSeries, summariseTrendForA11y } from '../../lib/roscTrends';
import { PILLARS } from './ROSCPillCapsules';

interface Props {
    assessments: ROSCAssessment[];
    cadence: ROSCCadence;
}

const RANGE_OPTIONS = [
    { label: '6', value: 6 },
    { label: '12', value: 12 },
    { label: 'All', value: 0 },
] as const;

const tooltipStyle = {
    borderRadius: '12px',
    border: '1px solid rgba(232,121,249,0.2)',
    background: 'rgba(15,3,32,0.92)',
    color: '#FDF4FF',
    fontSize: '12px',
};

const axisTick = { fontSize: 10, fill: 'rgba(255,255,255,0.45)' };

export default function ROSCTrendChart({ assessments, cadence }: Props) {
    const [range, setRange] = useState<number>(12);
    const points = useMemo(() => buildROSCTrendSeries(assessments, cadence, range), [assessments, cadence, range]);
    const a11ySummary = useMemo(() => summariseTrendForA11y(points), [points]);

    if (points.length === 0) {
        return (
            <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-fuchsia-200">
                <div className="w-12 h-12 bg-fuchsia-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <SparklesIcon className="h-6 w-6 text-fuchsia-400" />
                </div>
                <p className="text-sm font-bold text-gray-700">Your trend appears here</p>
                <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
                    Complete your first check-in to start tracking Recovery Capital over time.
                </p>
            </div>
        );
    }

    return (
        <div
            role="img"
            aria-label={a11ySummary}
            className="relative rounded-3xl overflow-hidden p-[1.5px] shadow-lg"
            style={{ background: 'linear-gradient(145deg, #7C3AED 0%, #EC4899 100%)' }}
        >
            <div className="relative rounded-[23px] bg-[#0A0418]/60 backdrop-blur-2xl p-5 space-y-6">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/45">
                        Total Recovery Capital
                    </span>
                    <div className="flex gap-1 bg-white/5 rounded-lg p-0.5">
                        {RANGE_OPTIONS.map(opt => (
                            <button
                                key={opt.label}
                                onClick={() => setRange(opt.value)}
                                className={`text-[10px] font-bold px-2.5 py-1 rounded-md transition-all ${
                                    range === opt.value ? 'bg-fuchsia-500/80 text-white' : 'text-white/40 hover:text-white/70'
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {points.length === 1 && (
                    <p className="text-xs text-white/40 text-center -mt-3">
                        One snapshot so far — your trend line appears after your next check-in.
                    </p>
                )}

                <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={points} margin={{ top: 5, right: 8, bottom: 0, left: -20 }} accessibilityLayer>
                        <defs>
                            <linearGradient id="roscTotalGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#EC4899" stopOpacity={0.35} />
                                <stop offset="95%" stopColor="#C026D3" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.08)" />
                        <XAxis dataKey="label" tick={axisTick} interval="preserveStartEnd" axisLine={false} tickLine={false} />
                        <YAxis domain={[0, 40]} ticks={[0, 10, 20, 30, 40]} tick={axisTick} axisLine={false} tickLine={false} width={28} />
                        <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${value} / 40`, 'Total']} />
                        <Area
                            type="monotone"
                            dataKey="total"
                            stroke="#EC4899"
                            strokeWidth={2.5}
                            fill="url(#roscTotalGradient)"
                            dot={{ r: 3, fill: '#EC4899' }}
                            activeDot={{ r: 5 }}
                        />
                    </AreaChart>
                </ResponsiveContainer>

                <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/45">By Domain</span>
                    <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={points} margin={{ top: 10, right: 8, bottom: 0, left: -20 }} accessibilityLayer>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.08)" />
                            <XAxis dataKey="label" tick={axisTick} interval="preserveStartEnd" axisLine={false} tickLine={false} />
                            <YAxis domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} tick={axisTick} axisLine={false} tickLine={false} width={20} />
                            <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${value} / 10`]} />
                            <Legend wrapperStyle={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)' }} />
                            {PILLARS.map(pillar => (
                                <Line
                                    key={pillar.key}
                                    type="monotone"
                                    dataKey={pillar.key}
                                    name={pillar.label}
                                    stroke={pillar.gradA}
                                    strokeWidth={2}
                                    dot={{ r: 3 }}
                                    activeDot={{ r: 5 }}
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
