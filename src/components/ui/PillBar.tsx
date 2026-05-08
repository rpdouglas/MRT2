import { useState, useEffect, useRef } from 'react';

interface PillBarProps {
    value: number;
    max?: number;
    prev?: number;
    segments?: number;
    height?: number;
    animate?: boolean;
    variant?: 'insights' | 'dashboard' | 'tasks' | 'service' | 'workbooks';
}

const MODULE_TOKENS = {
    dashboard: { pill: 'linear-gradient(135deg, #38BDF8, #2563EB)', pillGhost: 'rgba(56,189,248,0.1)', glowA: '#38BDF888', border: '#38BDF844' },
    tasks: { pill: 'linear-gradient(135deg, #22D3EE, #0D9488)', pillGhost: 'rgba(34,211,238,0.1)', glowA: '#22D3EE88', border: '#22D3EE44' },
    service: { pill: 'linear-gradient(135deg, #FB7185, #F59E0B)', pillGhost: 'rgba(251,113,133,0.1)', glowA: '#FB718588', border: '#FB718544' },
    insights: { pill: 'linear-gradient(135deg, #E879F9, #EC4899)', pillGhost: 'rgba(232,121,249,0.1)', glowA: '#E879F988', border: '#E879F944' },
    workbooks: { pill: 'linear-gradient(135deg, #818CF8, #6D28D9)', pillGhost: 'rgba(129,140,248,0.1)', glowA: '#818CF888', border: '#818CF844' }
};

export default function PillBar({ 
    value, 
    max = 10,
    prev = 0, 
    segments = 10, 
    height = 12, 
    animate = true,
    variant = 'insights'
}: PillBarProps) {
    const tokens = MODULE_TOKENS[variant];
    const [revealed, setRevealed] = useState(animate ? 0 : value);
    const [ran, setRan] = useState(!animate);
    const ref = useRef<HTMLDivElement>(null);

    const normalizedValue = Math.min(value, max);

    useEffect(() => {
        if (ran) return;
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting && !ran) {
                setRan(true);
                let s = 0;
                const iv = setInterval(() => {
                    s++;
                    setRevealed(s);
                    if (s >= normalizedValue) clearInterval(iv);
                }, 55);
            }
        }, { threshold: 0.3 });
        
        if (ref.current) observer.observe(ref.current);
        return () => {
            observer.disconnect();
        };
    }, [normalizedValue, ran]);

    const filled = animate ? revealed : normalizedValue;

    return (
        <div ref={ref} className="flex gap-1">
            {Array.from({ length: segments }).map((_, si) => {
                const isFilled = si < filled;
                const isPrev = si < prev;
                return (
                    <div 
                        key={si} 
                        className="flex-1 rounded-full origin-center"
                        style={{
                            height,
                            background: isFilled ? tokens.pill : isPrev ? tokens.pillGhost : 'rgba(255,255,255,0.04)',
                            boxShadow: isFilled ? `0 0 10px ${tokens.glowA}` : 'none',
                            border: `1px solid ${isFilled ? tokens.border : 'rgba(255,255,255,0.06)'}`,
                            transition: isFilled ? 'all 0.2s ease' : 'none',
                            transform: isFilled ? 'scaleY(1)' : 'scaleY(0.75)',
                        }} 
                    />
                );
            })}
        </div>
    );
}
