import { useState, useEffect, useMemo } from 'react';
import type { ROSCAssessment } from '../../lib/types/rosc';
import { cadenceCurrentLabel, cadencePreviousLabel, type ROSCCadence } from '../../lib/roscCadence';

interface Props {
    current: ROSCAssessment;
    previous?: ROSCAssessment;
    cadence?: ROSCCadence;
}

export const PILLARS = [
    { key: 'health',    label: 'Health',    icon: '🫀', gradA: '#F472B6', gradB: '#EC4899', glow: '#F472B6' },
    { key: 'home',      label: 'Home',      icon: '🏠', gradA: '#FB923C', gradB: '#F59E0B', glow: '#FB923C' },
    { key: 'purpose',   label: 'Purpose',   icon: '⭐', gradA: '#A78BFA', gradB: '#7C3AED', glow: '#A78BFA' },
    { key: 'community', label: 'Community', icon: '🤝', gradA: '#34D399', gradB: '#059669', glow: '#34D399' },
] as const;

function useSegReveal(run: boolean, scoresKey: string, delay = 60) {
    const currentScores = useMemo(() => scoresKey.split(',').map(Number), [scoresKey]);
    const [revealed, setRevealed] = useState<number[]>(currentScores.map(() => 0));

    useEffect(() => {
        if (!run) { setRevealed(currentScores.map(() => 0)); return; }
        const timers: ReturnType<typeof setTimeout>[] = [];
        currentScores.forEach((target, pi) => {
            let seg = 0;
            const t = setTimeout(() => {
                const iv = setInterval(() => {
                    seg++;
                    setRevealed(prev => { 
                        const n = [...prev]; 
                        n[pi] = seg; 
                        return n; 
                    });
                    if (seg >= target) clearInterval(iv);
                }, delay + pi * 15);
                timers.push(iv as unknown as ReturnType<typeof setTimeout>);
            }, pi * 160);
            timers.push(t);
        });
        return () => timers.forEach(clearTimeout);
    }, [run, currentScores, delay]);
    
    return revealed;
}

export default function ROSCPillCapsules({ current, previous, cadence = 'monthly' }: Props) {
    const SEG = 10;
    const counts = [
        current.scores.health.score,
        current.scores.home.score,
        current.scores.purpose.score,
        current.scores.community.score
    ];
    const scoresKey = counts.join(',');
    
    const revealed = useSegReveal(true, scoresKey, 55);

    return (
        <div className="flex flex-col gap-[18px]">
            {PILLARS.map((p, pi) => {
                const cur = current.scores[p.key].score;
                const prev = previous ? previous.scores[p.key].score : 0;
                const gain = cur - prev;
                
                return (
                    <div key={p.key}>
                        <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2">
                                <span className="text-base">{p.icon}</span>
                                <span className="text-[13px] font-semibold text-white/90">{p.label}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                {previous ? <span className="text-[11px] text-white/30">{prev}</span> : null}
                                <span className="text-[21px] font-black text-white">{cur}</span>
                                {previous && gain !== 0 && (
                                    <span 
                                        className="text-[11px] font-bold rounded-full px-2 py-0.5"
                                        style={{ color: p.gradA, background: `${p.gradA}22` }}
                                    >
                                        {gain > 0 ? '+' : ''}{gain}
                                    </span>
                                )}
                            </div>
                        </div>
                        
                        <div className="flex gap-1.5">
                            {Array.from({ length: SEG }).map((_, si) => {
                                const filled = si < revealed[pi];
                                const wasFill = previous && si < prev;
                                return (
                                    <div 
                                        key={si} 
                                        className="flex-1 h-[14px] rounded-full origin-center"
                                        style={{
                                            background: filled
                                                ? `linear-gradient(135deg, ${p.gradA}, ${p.gradB})`
                                                : wasFill
                                                    ? "rgba(255,255,255,0.11)"
                                                    : "rgba(255,255,255,0.04)",
                                            boxShadow: filled ? `0 0 10px ${p.glow}77` : "none",
                                            border: `1px solid ${filled ? p.gradA+"44" : "rgba(255,255,255,0.06)"}`,
                                            transition: filled ? "all 0.18s ease" : "none",
                                            transform: filled ? "scaleY(1)" : "scaleY(0.8)",
                                        }} 
                                    />
                                );
                            })}
                        </div>
                    </div>
                );
            })}
            
            {previous && (
                <div className="mt-5 pt-3.5 border-t border-white/5 flex gap-4">
                    {[
                        { bg: "rgba(255,255,255,0.13)", label: cadencePreviousLabel(cadence) },
                        { bg: "linear-gradient(90deg,#C026D3,#EC4899)", label: cadenceCurrentLabel(cadence) }
                    ].map(({ bg, label }) => (
                        <div key={label} className="flex items-center gap-2">
                            <div className="w-[22px] h-[3px] rounded-sm" style={{ background: bg }} />
                            <span className="text-[10px] text-white/30">{label}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
