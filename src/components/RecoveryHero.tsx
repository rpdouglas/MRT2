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
    <div className="bg-gradient-to-r from-teal-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white overflow-hidden relative">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-xl"></div>
      <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-32 h-32 bg-white opacity-10 rounded-full blur-xl"></div>

      <div className="relative z-10 flex flex-col md:flex-row gap-6 md:gap-8">
        
        {/* --- SECTION 1: TIME (The Hero) --- */}
        <div className="flex-1 flex flex-col justify-center items-center md:items-start text-center md:text-left">
          <div className="flex items-center gap-2 mb-1 opacity-80">
            <TrophyIcon className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Total Clean Time</span>
          </div>
          
          {sobrietyDate ? (
            <div>
               {/* Mobile-First: Big Total Number */}
               <div className="text-5xl sm:text-6xl font-extrabold tracking-tight mb-2">
                 {duration.totalDays}
                 <span className="text-lg sm:text-2xl font-medium ml-2 opacity-80">Days</span>
               </div>
               
               {/* Mobile-First: Small Breakdown Subtext */}
               <div className="inline-flex items-center gap-2 bg-black/10 px-3 py-1 rounded-full text-xs sm:text-sm font-medium text-blue-50">
                  <CalendarDaysIcon className="h-4 w-4" />
                  <span>
                    {duration.years}y, {duration.months}m, {duration.days}d
                  </span>
               </div>
            </div>
          ) : (
            <div className="bg-white/10 rounded-lg p-4 text-blue-100 text-sm">
              Set your sobriety date in Profile to start tracking.
            </div>
          )}
        </div>

        {/* --- DIVIDER --- */}
        {/* Horizontal on Mobile, Vertical on Desktop */}
        <div className="w-full h-px md:w-px md:h-auto bg-gradient-to-r md:bg-gradient-to-b from-transparent via-white/30 to-transparent"></div>

        {/* --- SECTION 2: STATS (The Badges) --- */}
        <div className="flex-shrink-0 flex flex-col justify-center">
           
           {/* Desktop Title (Hidden on Mobile to save space) */}
           <h2 className="hidden md:block text-blue-100 font-medium text-sm uppercase tracking-wider mb-3">
            Achievements
          </h2>

           {/* Responsive Grid:
              Mobile: 3 Columns (Horizontal Row)
              Desktop: 1 Column (Vertical List)
           */}
           <div className="grid grid-cols-3 md:grid-cols-1 gap-2 md:gap-3">
                
                {/* 1. Journal Streak */}
                <div className="flex flex-col md:flex-row items-center md:justify-between p-2 md:p-3 bg-white/10 rounded-lg backdrop-blur-sm hover:bg-white/20 transition-colors">
                    <div className="flex items-center gap-2 md:gap-3 mb-1 md:mb-0">
                        <div className="p-1.5 bg-purple-500/30 rounded-md text-white">
                           <PencilSquareIcon className="h-5 w-5" />
                        </div>
                        {/* Label: Hidden on Mobile, Visible on Desktop */}
                        <span className="hidden md:inline text-sm text-blue-50">Journal Streak</span>
                    </div>
                    {/* Value */}
                    <div className="text-center md:text-right">
                        <span className="block text-xl font-bold leading-none">{journalStats?.journalStreak || 0}</span>
                        <span className="md:hidden text-[10px] text-blue-200 uppercase">Journal</span>
                    </div>
                </div>

                {/* 2. Consistency */}
                <div className="flex flex-col md:flex-row items-center md:justify-between p-2 md:p-3 bg-white/10 rounded-lg backdrop-blur-sm hover:bg-white/20 transition-colors">
                    <div className="flex items-center gap-2 md:gap-3 mb-1 md:mb-0">
                        <div className="p-1.5 bg-green-500/30 rounded-md text-white">
                           <ScaleIcon className="h-5 w-5" />
                        </div>
                        <span className="hidden md:inline text-sm text-blue-50">Consistency (Wk)</span>
                    </div>
                    <div className="text-center md:text-right">
                        <span className="block text-xl font-bold leading-none">{journalStats?.consistencyRate || 0}</span>
                        <span className="md:hidden text-[10px] text-blue-200 uppercase">Avg/Wk</span>
                    </div>
                </div>

                {/* 3. Habit Fire */}
                <div className="flex flex-col md:flex-row items-center md:justify-between p-2 md:p-3 bg-white/10 rounded-lg backdrop-blur-sm hover:bg-white/20 transition-colors">
                    <div className="flex items-center gap-2 md:gap-3 mb-1 md:mb-0">
                        <div className="p-1.5 bg-orange-500/30 rounded-md text-white">
                           <FireIcon className="h-5 w-5" />
                        </div>
                        <span className="hidden md:inline text-sm text-blue-50">Habit Fire</span>
                    </div>
                    <div className="text-center md:text-right">
                        <span className="block text-xl font-bold leading-none">{taskStreak}</span>
                        <span className="md:hidden text-[10px] text-blue-200 uppercase">Habits</span>
                    </div>
                </div>

            </div>
        </div>

      </div>
    </div>
  );
}