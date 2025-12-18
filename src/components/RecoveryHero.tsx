import { 
  TrophyIcon, 
  FireIcon, 
  PencilSquareIcon, 
  ScaleIcon,
  CalendarDaysIcon,
  FaceSmileIcon
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
    <div className="bg-gradient-to-r from-teal-500 to-blue-600 rounded-2xl shadow-lg p-4 text-white overflow-hidden relative">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-xl"></div>
      <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-32 h-32 bg-white opacity-10 rounded-full blur-xl"></div>

      {/* LAYOUT: Flex Row (Side-by-Side) */}
      <div className="relative z-10 flex flex-row items-stretch gap-3 sm:gap-6 h-full">
        
        {/* --- SECTION 1: TIME (Left Side - Centered & Larger) --- */}
        <div className="flex-1 flex flex-col justify-center items-center text-center min-w-0">
          <div className="flex items-center gap-2 mb-2 opacity-80">
            <TrophyIcon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider truncate">Recovery Time</span>
          </div>
          
          {sobrietyDate ? (
            <div className="flex flex-col justify-center items-center h-full">
               {/* Big Total Number */}
               <div className="text-6xl sm:text-7xl md:text-8xl font-extrabold tracking-tight leading-none mb-3">
                 {duration.totalDays}
                 <span className="text-xl sm:text-3xl font-medium ml-2 opacity-80">Days</span>
               </div>
               
               {/* Breakdown Subtext - Increased by another ~25% */}
               <div className="flex flex-wrap items-center justify-center gap-1 text-sm sm:text-xl font-medium text-blue-50 opacity-90">
                  <div className="inline-flex items-center gap-2 bg-black/10 px-4 py-2 rounded-lg truncate max-w-full">
                     <CalendarDaysIcon className="h-5 w-5 flex-shrink-0" />
                     <span className="truncate">
                        {duration.years}y, {duration.months}m, {duration.days}d
                     </span>
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

        {/* --- SECTION 2: STATS GRID (Right Side - 2x2) --- */}
        <div className="flex-shrink-0 w-[45%] sm:w-auto flex flex-col justify-center">
           
           <div className="grid grid-cols-2 gap-2 sm:gap-3">
                
                {/* 1. Journal Streak */}
                <div className="bg-white/10 rounded-lg p-2 sm:p-3 backdrop-blur-sm flex flex-col sm:flex-row items-center sm:gap-3 border border-white/5 text-center sm:text-left">
                    <div className="hidden sm:block p-1.5 bg-purple-500/30 rounded-md text-white">
                        <PencilSquareIcon className="h-4 w-4" />
                    </div>
                    {/* Mobile Icon */}
                    <PencilSquareIcon className="h-4 w-4 sm:hidden mb-1 text-purple-200" />
                    
                    <div>
                        <span className="block text-lg sm:text-xl font-bold leading-none">{journalStats?.journalStreak || 0}</span>
                        <span className="text-[9px] sm:text-[10px] uppercase tracking-wide text-blue-200 block mt-0.5">Journal</span>
                    </div>
                </div>

                {/* 2. Consistency */}
                <div className="bg-white/10 rounded-lg p-2 sm:p-3 backdrop-blur-sm flex flex-col sm:flex-row items-center sm:gap-3 border border-white/5 text-center sm:text-left">
                    <div className="hidden sm:block p-1.5 bg-green-500/30 rounded-md text-white">
                        <ScaleIcon className="h-4 w-4" />
                    </div>
                    <ScaleIcon className="h-4 w-4 sm:hidden mb-1 text-green-200" />
                    
                    <div>
                        <span className="block text-lg sm:text-xl font-bold leading-none">{journalStats?.consistencyRate || 0}</span>
                        <span className="text-[9px] sm:text-[10px] uppercase tracking-wide text-blue-200 block mt-0.5">Avg/Wk</span>
                    </div>
                </div>

                {/* 3. Habit Fire */}
                <div className="bg-white/10 rounded-lg p-2 sm:p-3 backdrop-blur-sm flex flex-col sm:flex-row items-center sm:gap-3 border border-white/5 text-center sm:text-left">
                    <div className="hidden sm:block p-1.5 bg-orange-500/30 rounded-md text-white">
                        <FireIcon className="h-4 w-4" />
                    </div>
                    <FireIcon className="h-4 w-4 sm:hidden mb-1 text-orange-200" />
                    
                    <div>
                        <span className="block text-lg sm:text-xl font-bold leading-none">{taskStreak}</span>
                        <span className="text-[9px] sm:text-[10px] uppercase tracking-wide text-blue-200 block mt-0.5">Streak</span>
                    </div>
                </div>

                {/* 4. Average Mood (Pink) */}
                <div className="bg-white/10 rounded-lg p-2 sm:p-3 backdrop-blur-sm flex flex-col sm:flex-row items-center sm:gap-3 border border-white/5 text-center sm:text-left">
                    <div className="hidden sm:block p-1.5 bg-pink-500/30 rounded-md text-white">
                        <FaceSmileIcon className="h-4 w-4" />
                    </div>
                    <FaceSmileIcon className="h-4 w-4 sm:hidden mb-1 text-pink-200" />
                    
                    <div>
                        <span className="block text-lg sm:text-xl font-bold leading-none">{journalStats?.averageMood || 0}</span>
                        <span className="text-[9px] sm:text-[10px] uppercase tracking-wide text-blue-200 block mt-0.5">Avg Mood</span>
                    </div>
                </div>

            </div>
        </div>

      </div>
    </div>
  );
}