// src/components/SobrietyHero.tsx
import { useMemo } from 'react';
import { Timestamp } from 'firebase/firestore';
import { TrophyIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';
import { calculateSobrietyDuration } from '../lib/dateUtils';

interface SobrietyHeroProps {
    date?: Timestamp | Date | null;
}

export default function SobrietyHero({ date }: SobrietyHeroProps) {
    const stats = useMemo(() => {
        if (!date) return null;
        const startDate = date instanceof Date ? date : date.toDate();
        return calculateSobrietyDuration(startDate);
    }, [date]);

    if (!stats) {
        return (
            // Reduced padding here too for consistency
            <div className="bg-gradient-to-br from-blue-600 to-cyan-500 rounded-[2rem] p-6 text-center text-white shadow-xl border border-white/20">
                <div className="opacity-80 mb-2 font-bold uppercase tracking-widest text-xs">Begin the Journey</div>
                <p className="text-sm">Set your sobriety date in Profile to track your freedom.</p>
            </div>
        );
    }

    return (
        // TIGHTENED PADDING: p-6 -> p-4 on mobile
        <div className="bg-gradient-to-br from-blue-600 to-cyan-500 rounded-[2rem] p-4 sm:p-6 text-white shadow-xl relative overflow-hidden group border border-white/10">
            {/* Dynamic Background Texture */}
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-1000"></div>

            <div className="relative z-10 flex flex-col h-full justify-between">
                {/* Header: CENTERED and reduced margin (mb-6 -> mb-3) */}
                <div className="flex justify-center items-center mb-3">
                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                        <TrophyIcon className="h-4 w-4 text-yellow-300" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white">One Day at a Time</span>
                    </div>
                </div>

                {/* Main Counters: Years / Months / Days */}
                <div className="grid grid-cols-3 gap-2 text-center divide-x divide-white/20">
                    <div className="px-2">
                        <div className="text-3xl sm:text-5xl font-black tracking-tight">{stats.years}</div>
                        <div className="text-[10px] sm:text-xs font-bold uppercase opacity-70 mt-1">Years</div>
                    </div>
                    <div className="px-2">
                        <div className="text-3xl sm:text-5xl font-black tracking-tight">{stats.months}</div>
                        <div className="text-[10px] sm:text-xs font-bold uppercase opacity-70 mt-1">Months</div>
                    </div>
                    <div className="px-2">
                        <div className="text-3xl sm:text-5xl font-black tracking-tight">{stats.days}</div>
                        <div className="text-[10px] sm:text-xs font-bold uppercase opacity-70 mt-1">Days</div>
                    </div>
                </div>

                {/* Footer: Reduced margin (mt-6 -> mt-4) */}
                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-blue-100/80 font-medium">
                    <CalendarDaysIcon className="h-4 w-4" />
                    <span>Total Days: <span className="font-mono font-bold text-white ml-1">{stats.totalDays.toLocaleString()}</span></span>
                </div>
            </div>
        </div>
    );
}