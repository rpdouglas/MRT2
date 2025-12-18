import { 
  TrophyIcon, 
  FireIcon, 
  PencilSquareIcon, 
  ScaleIcon,
  CalendarDaysIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { differenceInYears, differenceInMonths, differenceInDays, addYears, addMonths } from 'date-fns';
import type { GamificationStats } from '../lib/gamification';

interface RecoveryHeroProps {
  sobrietyDate: Date | null;
  journalStats: GamificationStats | null;
  taskStreak: number;
}

export default function RecoveryHero({ sobrietyDate, journalStats, taskStreak }: RecoveryHeroProps) {
  
  // --- SOBRIETY CALCULATION LOGIC ---
  const calculateDuration = () => {
    if (!sobrietyDate) return { years: 0, months: 0, days: 0, totalDays: 0 };
    
    const now = new Date();
    
    // 1. Calculate Breakdown (Y/M/D)
    const years = differenceInYears(now, sobrietyDate);
    const dateAfterYears = addYears(sobrietyDate, years);
    
    const months = differenceInMonths(now, dateAfterYears);
    const dateAfterMonths = addMonths(dateAfterYears, months);
    
    const days = differenceInDays(now, dateAfterMonths);

    // 2. Calculate Total Days
    const totalDays = differenceInDays(now, sobrietyDate);
    
    return { years, months, days, totalDays };
  };

  const duration = calculateDuration();

  return (
    <div className="bg-gradient-to-r from-teal-500 to-blue-600 rounded-2xl shadow-lg p-5 text-white overflow-hidden relative">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-xl"></div>
      <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-32 h-32 bg-white opacity-10 rounded-full blur-xl"></div>

      <div className="relative z-10 flex flex-col md:flex-row gap-6 items-center md:items-stretch">
        
        {/* --- SECTION 1: TIME (Left Side) --- */}
        <div className="flex-grow flex flex-col justify-center text-center md:text-left min-w-0 py-2">
          <div className="flex items-center justify-center md:justify-start gap-2 mb-2 opacity-80">
            <TrophyIcon className="h-4 w-4 flex-shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wider">Clean Time</span>
          </div>
          
          {sobrietyDate ? (
            <div className="flex flex-col justify-center">
               {/* Big Total Number */}
               <div className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-none mb-3">
                 {duration.totalDays}
                 <span className="text-lg sm:text-2xl font-medium ml-1 sm:ml-2 opacity-80">Days</span>
               </div>
               
               {/* Breakdown Subtext */}
               <div className="flex justify-center md:justify-start">
                  <div className="inline-flex items-center gap-2 bg-black/10 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-blue-50 backdrop-blur-sm">
                     <CalendarDaysIcon className="h-4 w-4" />
                     <span className="truncate">{duration.years} Years, {duration.months} Months, {duration.days} Days</span>
                  </div>
               </div>
            </div>
          ) : (
            <div className="bg-white/10 rounded-lg p-3 text-blue-100 text-sm">
              Set sobriety date in Profile.
            </div>
          )}
        </div>

        {/* --- VERTICAL DIVIDER (Desktop Only) --- */}
        <div className="hidden md:block w-px bg-gradient-to-b from-transparent via-white/30 to-transparent flex-shrink-0 my-2"></div>
        {/* --- HORIZONTAL DIVIDER (Mobile Only) --- */}
        <div className="md:hidden w-full h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>

        {/* --- SECTION 2: STATS GRID (Right Side - 2x2) --- */}
        <div className="flex-shrink-0 w-full md:w-auto">
           
           <div className="grid grid-cols-2 gap-3">
                
                {/* 1. Journal Streak */}
                <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm flex items-center gap-3 min-w-[140px] border border-white/5">
                    <div className="p-2 bg-purple-500/30 rounded-lg text-white">
                        <PencilSquareIcon className="h-5 w-5" />
                    </div>
                    <div>
                        <span className="block text-xl font-bold leading-none">{journalStats?.journalStreak || 0}</span>
                        <span className="text-[10px] uppercase tracking-wide text-blue-200">Journal</span>
                    </div>
                </div>

                {/* 2. Consistency */}
                <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm flex items-center gap-3 min-w-[140px] border border-white/5">
                    <div className="p-2 bg-green-500/30 rounded-lg text-white">
                        <ScaleIcon className="h-5 w-5" />
                    </div>
                    <div>
                        <span className="block text-xl font-bold leading-none">{journalStats?.consistencyRate || 0}</span>
                        <span className="text-[10px] uppercase tracking-wide text-blue-200">Avg/Week</span>
                    </div>
                </div>

                {/* 3. Habit Fire */}
                <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm flex items-center gap-3 min-w-[140px] border border-white/5">
                    <div className="p-2 bg-orange-500/30 rounded-lg text-white">
                        <FireIcon className="h-5 w-5" />
                    </div>
                    <div>
                        <span className="block text-xl font-bold leading-none">{taskStreak}</span>
                        <span className="text-[10px] uppercase tracking-wide text-blue-200">Streak</span>
                    </div>
                </div>

                {/* 4. Future Slot (Placeholder) */}
                <div className="border border-dashed border-white/20 rounded-xl p-3 flex items-center justify-center gap-2 min-w-[140px] text-blue-200/50">
                    <PlusIcon className="h-4 w-4" />
                    <span className="text-[10px] uppercase tracking-wide font-medium">Soon</span>
                </div>

            </div>
        </div>

      </div>
    </div>
  );
}