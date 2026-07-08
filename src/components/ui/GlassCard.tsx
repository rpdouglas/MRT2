import React from 'react';

interface GlassCardProps {
    children: React.ReactNode;
    className?: string;
    variant?: 'insights' | 'dashboard' | 'tasks' | 'service' | 'workbooks' | 'vitality' | 'journal';
    mode?: 'dark' | 'light';
}

const MODULE_TOKENS = {
    dashboard: { gradA: '#38BDF8', gradB: '#2563EB', base: '#112238' },
    tasks: { gradA: '#22D3EE', gradB: '#0D9488', base: '#0e2537' },
    service: { gradA: '#FB7185', gradB: '#F59E0B', base: '#311526' },
    insights: { gradA: '#E879F9', gradB: '#EC4899', base: '#2e1739' },
    workbooks: { gradA: '#34D399', gradB: '#65A30D', base: '#112529' },
    vitality: { gradA: '#FBBF24', gradB: '#F97316', base: '#312217' },
    journal: { gradA: '#818CF8', gradB: '#6D28D9', base: '#1d1a38' }
};

export default function GlassCard({ children, className = '', variant = 'insights', mode = 'dark' }: GlassCardProps) {
    const tokens = MODULE_TOKENS[variant];

    if (mode === 'light') {
        return (
            <div className={`relative overflow-hidden rounded-[20px] p-[1.5px] ${className}`} style={{
                background: `linear-gradient(145deg, ${tokens.gradA}55, ${tokens.gradB}33)`
            }}>
                <div className="relative overflow-hidden rounded-[19px] p-[18px_16px] bg-gradient-to-br from-amber-50 to-rose-50">
                    <div className="relative z-10">
                        {children}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`relative overflow-hidden rounded-[20px] p-[1.5px] ${className}`} style={{
            background: `linear-gradient(145deg, ${tokens.gradA}CC, ${tokens.gradB}99)`
        }}>
            <div className="relative overflow-hidden rounded-[19px] p-[18px_16px]" style={{
                background: `${tokens.base}c2`,
                backdropFilter: 'blur(24px) saturate(1.8)',
                WebkitBackdropFilter: 'blur(24px) saturate(1.8)',
            }}>
                {/* Ambient glows */}
                <div
                    className="pointer-events-none absolute -right-[30px] -top-[40px] h-[140px] w-[140px] rounded-full"
                    style={{ background: `radial-gradient(circle, ${tokens.gradA}80 0%, transparent 70%)` }}
                />
                <div
                    className="pointer-events-none absolute -bottom-[30px] -left-[10px] h-[100px] w-[100px] rounded-full"
                    style={{ background: `radial-gradient(circle, ${tokens.gradB}66 0%, transparent 70%)` }}
                />
                <div className="relative z-10">
                    {children}
                </div>
            </div>
        </div>
    );
}
