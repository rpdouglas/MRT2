import React from 'react';

interface GlassCardProps {
    children: React.ReactNode;
    className?: string;
    variant?: 'insights' | 'dashboard' | 'tasks' | 'service' | 'workbooks' | 'tools';
}

const MODULE_TOKENS = {
    dashboard: { gradA: '#38BDF8', gradB: '#2563EB' },
    tasks: { gradA: '#22D3EE', gradB: '#0D9488' },
    service: { gradA: '#FB7185', gradB: '#F59E0B' },
    insights: { gradA: '#E879F9', gradB: '#EC4899' },
    workbooks: { gradA: '#818CF8', gradB: '#6D28D9' },
    tools: { gradA: '#FBBF24', gradB: '#EA580C' }
};

export default function GlassCard({ children, className = '', variant = 'insights' }: GlassCardProps) {
    const tokens = MODULE_TOKENS[variant];
    
    return (
        <div className={`relative overflow-hidden rounded-[20px] p-[1.5px] ${className}`} style={{
            background: `linear-gradient(145deg, ${tokens.gradA}55, ${tokens.gradB}33)`
        }}>
            <div className="relative overflow-hidden rounded-[19px] p-[18px_16px] bg-[#0804149e]" style={{
                backdropFilter: 'blur(24px) saturate(1.6)',
                WebkitBackdropFilter: 'blur(24px) saturate(1.6)',
            }}>
                {/* Ambient glows */}
                <div 
                    className="pointer-events-none absolute -right-[30px] -top-[40px] h-[140px] w-[140px] rounded-full" 
                    style={{ background: `radial-gradient(circle, ${tokens.gradA}30 0%, transparent 65%)` }} 
                />
                <div 
                    className="pointer-events-none absolute -bottom-[30px] -left-[10px] h-[100px] w-[100px] rounded-full" 
                    style={{ background: `radial-gradient(circle, ${tokens.gradB}25 0%, transparent 65%)` }} 
                />
                <div className="relative z-10">
                    {children}
                </div>
            </div>
        </div>
    );
}
