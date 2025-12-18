import { 
  TrophyIcon, 
  FireIcon, 
  PencilSquareIcon, 
  ScaleIcon,
  CalendarDaysIcon
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

      <div className="relative z-10 flex flex-row gap-4 h-full">
        
        {/* --- SECTION 1: TIME (70% - The Hero) --- */}
        <div className="flex-grow flex flex-col justify-center min-w-0">
          <div className="flex items-center gap-2 mb-2 opacity-80">
            <TrophyIcon className="h-4 w-4 flex-shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wider truncate">Clean Time</span>
          </div>
          
          {sobrietyDate ? (
            <div className="flex flex-col justify-center h-full pb-2">
               {/* Big Total Number */}
               <div className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-none mb-3">
                 {duration.totalDays}
                 <span className="text-lg sm:text-2xl font-medium ml-1 sm:ml-2 opacity-80">Days</span>
               </div>
               
               {/* Breakdown Subtext */}
               <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm font-medium text-blue-50 opacity-90">
                  <div className="inline-flex items-center gap-1 bg-black/10 px-2 py-1 rounded">
                     <CalendarDaysIcon className="h-3 w-3" />
                     <span className="truncate">{duration.years}y, {duration.months}m, {duration.days}d</span>
                  </div>
               </div>
            </div>
          ) : (
            <div className="bg-white/10 rounded-lg p-3 text-blue-100 text-sm">
              Set sobriety date in Profile.
            </div>
          )}
        </div>

        {/* --- VERTICAL DIVIDER --- */}
        <div className="w-px bg-gradient-to-b from-transparent via-white/30 to-transparent flex-shrink-0"></div>

        {/* --- SECTION 2: STATS (30% - The Dock) --- */}
        <div className="flex-shrink-0 w-[25%] sm:w-[30%] flex flex-col justify-between py-1">
           
           {/* 1. Journal Streak */}
           <div className="flex flex-col items-center justify-center p-1 rounded-lg hover:bg-white/10 transition-colors group relative">
               <div className="p-1.5 bg-purple-500/30 rounded-md text-white mb-1">
                   <PencilSquareIcon className="h-5 w-5" />
               </div>
               <span className="text-lg font-bold leading-none">{journalStats?.journalStreak || 0}</span>
               
               {/* Desktop Label / Mobile Tiny Text */}
               <span className="hidden sm:inline text-xs text-blue-100 mt-1">Journal</span>
               <span className="sm:hidden text-[10px] text-blue-200 opacity-80">Strk</span>
           </div>

           {/* 2. Consistency */}
           <div className="flex flex-col items-center justify-center p-1 rounded-lg hover:bg-white/10 transition-colors group relative">
               <div className="p-1.5 bg-green-500/30 rounded-md text-white mb-1">
                   <ScaleIcon className="h-5 w-5" />
               </div>
               <span className="text-lg font-bold leading-none">{journalStats?.consistencyRate || 0}</span>
               
               <span className="hidden sm:inline text-xs text-blue-100 mt-1">Avg/Wk</span>
               <span className="sm:hidden text-[10px] text-blue-200 opacity-80">Avg</span>
           </div>

           {/* 3. Habit Fire */}
           <div className="flex flex-col items-center justify-center p-1 rounded-lg hover:bg-white/10 transition-colors group relative">
               <div className="p-1.5 bg-orange-500/30 rounded-md text-white mb-1">
                   <FireIcon className="h-5 w-5" />
               </div>
               <span className="text-lg font-bold leading-none">{taskStreak}</span>
               
               <span className="hidden sm:inline text-xs text-blue-100 mt-1">Habits</span>
               <span className="sm:hidden text-[10px] text-blue-200 opacity-80">Fire</span>
           </div>

        </div>

      </div>
    </div>
  );
}