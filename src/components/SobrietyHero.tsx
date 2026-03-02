/**
 * src/components/SobrietyHero.tsx
 * GITHUB COMMENT:
 * [SobrietyHero.tsx]
 * UX: Density overhaul. Reduced padding, applied leading-none to massive text, and tightened margins to eliminate dead space (Ticket 2.3).
 */
import { useMemo } from 'react';
import { Timestamp } from 'firebase/firestore';
import { CalendarDaysIcon } from '@heroicons/react/24/outline';
import { calculateSobrietyDuration } from '../lib/dateUtils';

interface SobrietyHeroProps {
    date?: Timestamp | Date | null;
    levelData?: {
        level: number;
        currentXP: number;
        nextLevelXP: number;
        progressPercent: number;
    };
    archetype?: string;
}

export default function SobrietyHero({ date, levelData, archetype }: SobrietyHeroProps) {
    // Calculate Time Stats
    const stats = useMemo(() => {
        if (!date) return null;
        const startDate = date instanceof Date ? date : date.toDate();
        return calculateSobrietyDuration(startDate);
    }, [date]);

    if (!stats) {
        return (
            <div className="bg-gradient-to-br from-amber-400 via-orange-400 to-yellow-500 rounded-3xl p-4 text-center text-white shadow-xl shadow-orange-500/20 border border-white/20">
                <div className="opacity-90 mb-1.5 font-bold uppercase tracking-widest text-xs drop-shadow-sm">Begin the Journey</div>
                <p className="text-sm font-medium drop-shadow-sm">Set your sobriety date in Profile to track your freedom.</p>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-amber-400 via-orange-400 to-yellow-500 rounded-3xl p-4 text-white shadow-xl shadow-orange-500/20 relative overflow-hidden group border border-white/20">
            {/* Dynamic Background Texture */}
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
            {/* Decorative Glow */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-yellow-300 opacity-20 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-1000"></div>

            <div className="relative z-10 flex flex-col h-full justify-between">
                
                {/* Main Counters */}
                <div className="grid grid-cols-3 gap-2 text-center divide-x divide-white/30 py-1">
                    <div className="px-2">
                        <div className="text-3xl sm:text-5xl font-black tracking-tight drop-shadow-md leading-none">{stats.years}</div>
                        <div className="text-[10px] sm:text-xs font-bold uppercase opacity-90 mt-1 drop-shadow-sm">Years</div>
                    </div>
                    <div className="px-2">
                        <div className="text-3xl sm:text-5xl font-black tracking-tight drop-shadow-md leading-none">{stats.months}</div>
                        <div className="text-[10px] sm:text-xs font-bold uppercase opacity-90 mt-1 drop-shadow-sm">Months</div>
                    </div>
                    <div className="px-2">
                        <div className="text-3xl sm:text-5xl font-black tracking-tight drop-shadow-md leading-none">{stats.days}</div>
                        <div className="text-[10px] sm:text-xs font-bold uppercase opacity-90 mt-1 drop-shadow-sm">Days</div>
                    </div>
                </div>

                {/* Unified Footer: Gamification & Total Days */}
                {levelData && archetype && (
                    <div className="mt-3 pt-3 border-t border-white/20 space-y-2">
                        
                        {/* Gamification Stats (Single Row) */}
                        <div className="flex justify-between items-end text-[10px] sm:text-xs font-bold uppercase tracking-widest drop-shadow-sm opacity-95 gap-2">
                            {/* Left: Rank & Level */}
                            <div className="flex items-center gap-1.5 sm:gap-2 truncate">
                                <span className="truncate">Rank: {archetype}</span>
                                <span className="opacity-50">|</span>
                                <span>LVL: {levelData.level}</span>
                            </div>
                            
                            {/* Right: Progress & XP */}
                            <div className="text-right shrink-0">
                                <span className="hidden sm:inline opacity-80 mr-1.5">Progress</span>
                                <span className="font-mono tracking-normal">{levelData.currentXP.toLocaleString()} / {levelData.nextLevelXP.toLocaleString()} XP</span>
                            </div>
                        </div>
                            
                        {/* Shimmer Progress Bar */}
                        <div className="relative h-2 w-full bg-black/20 rounded-full overflow-hidden shadow-inner">
                            <div 
                                className="h-full bg-white transition-all duration-1000 ease-out relative"
                                style={{ width: `${levelData.progressPercent}%` }}
                            >
                                <div className="absolute inset-0 bg-white/50 w-full -translate-x-full animate-[shimmer_2s_infinite]"></div>
                            </div>
                        </div>

                        {/* Total Days */}
                        <div className="pt-1 flex items-center justify-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-medium drop-shadow-sm opacity-90">
                            <CalendarDaysIcon className="h-3.5 w-3.5" />
                            <span>Total Days: <span className="font-mono font-bold text-white ml-1">{stats.totalDays.toLocaleString()}</span></span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
