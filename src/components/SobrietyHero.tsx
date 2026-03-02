/**
 * src/components/SobrietyHero.tsx
 * GITHUB COMMENT:
 * [SobrietyHero.tsx]
 * FEAT: Consolidated Gamification XP, Level, and Archetype into the Hero component (Ticket 2.3).
 */
import { useMemo, useState } from 'react';
import { Timestamp } from 'firebase/firestore';
import { TrophyIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';
import { calculateSobrietyDuration } from '../lib/dateUtils';
import { RECOVERY_SLOGANS } from '../data/slogans';

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
    // 1. Calculate Time Stats
    const stats = useMemo(() => {
        if (!date) return null;
        const startDate = date instanceof Date ? date : date.toDate();
        return calculateSobrietyDuration(startDate);
    }, [date]);

    // 2. Select Random Slogan (Lazy State Initialization)
    const [slogan] = useState(() => {
        const randomIndex = Math.floor(Math.random() * RECOVERY_SLOGANS.length);
        return RECOVERY_SLOGANS[randomIndex];
    });

    if (!stats) {
        return (
            <div className="bg-gradient-to-br from-amber-400 via-orange-400 to-yellow-500 rounded-[2rem] p-6 text-center text-white shadow-xl shadow-orange-500/20 border border-white/20">
                <div className="opacity-90 mb-2 font-bold uppercase tracking-widest text-xs drop-shadow-sm">Begin the Journey</div>
                <p className="text-sm font-medium drop-shadow-sm">Set your sobriety date in Profile to track your freedom.</p>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-amber-400 via-orange-400 to-yellow-500 rounded-[2rem] p-4 sm:p-6 text-white shadow-xl shadow-orange-500/20 relative overflow-hidden group border border-white/20">
            {/* Dynamic Background Texture */}
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
            {/* Decorative Glow */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-yellow-300 opacity-20 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-1000"></div>

            <div className="relative z-10 flex flex-col h-full justify-between">
                {/* Header: Random Slogan */}
                <div className="flex justify-center items-center mb-6">
                    <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 shadow-sm">
                        <TrophyIcon className="h-5 w-5 text-white drop-shadow-md" />
                        <span className="text-xs font-bold uppercase tracking-widest text-white drop-shadow-sm">
                            {slogan}
                        </span>
                    </div>
                </div>

                {/* Main Counters */}
                <div className="grid grid-cols-3 gap-2 text-center divide-x divide-white/30">
                    <div className="px-2">
                        <div className="text-3xl sm:text-5xl font-black tracking-tight drop-shadow-md">{stats.years}</div>
                        <div className="text-xs sm:text-sm font-bold uppercase opacity-90 mt-1 drop-shadow-sm">Years</div>
                    </div>
                    <div className="px-2">
                        <div className="text-3xl sm:text-5xl font-black tracking-tight drop-shadow-md">{stats.months}</div>
                        <div className="text-xs sm:text-sm font-bold uppercase opacity-90 mt-1 drop-shadow-sm">Months</div>
                    </div>
                    <div className="px-2">
                        <div className="text-3xl sm:text-5xl font-black tracking-tight drop-shadow-md">{stats.days}</div>
                        <div className="text-xs sm:text-sm font-bold uppercase opacity-90 mt-1 drop-shadow-sm">Days</div>
                    </div>
                </div>

                {/* Unified Footer: Gamification & Total Days */}
                {levelData && archetype && (
                    <div className="mt-6 pt-5 border-t border-white/20">
                        <div className="flex justify-between items-end mb-3">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold uppercase tracking-widest opacity-90 mb-0.5">
                                    Rank: {archetype}
                                </span>
                                <div className="text-2xl font-black leading-none drop-shadow-sm">
                                    Level {levelData.level}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-[10px] font-bold uppercase tracking-widest opacity-90 mb-0.5">
                                    Progress
                                </div>
                                <div className="text-xs font-bold font-mono drop-shadow-sm">
                                    {levelData.currentXP.toLocaleString()} / {levelData.nextLevelXP.toLocaleString()} XP
                                </div>
                            </div>
                        </div>
                        
                        {/* Shimmer Progress Bar */}
                        <div className="relative h-2.5 w-full bg-black/20 rounded-full overflow-hidden shadow-inner">
                            <div 
                                className="h-full bg-white transition-all duration-1000 ease-out relative"
                                style={{ width: `${levelData.progressPercent}%` }}
                            >
                                <div className="absolute inset-0 bg-white/50 w-full -translate-x-full animate-[shimmer_2s_infinite]"></div>
                            </div>
                        </div>

                        {/* Total Days */}
                        <div className="mt-4 flex items-center justify-center gap-2 text-xs font-medium drop-shadow-sm opacity-90">
                            <CalendarDaysIcon className="h-4 w-4" />
                            <span>Total Days: <span className="font-mono font-bold text-white ml-1">{stats.totalDays.toLocaleString()}</span></span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
