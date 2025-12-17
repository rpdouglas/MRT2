import { 
  TrophyIcon, 
  FireIcon, 
  PencilSquareIcon, 
  ScaleIcon 
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
    if (!sobrietyDate) return { years: 0, months: 0, days: 0 };
    
    const now = new Date();
    const years = differenceInYears(now, sobrietyDate);
    const dateAfterYears = addYears(sobrietyDate, years);
    
    const months = differenceInMonths(now, dateAfterYears);
    const dateAfterMonths = addMonths(dateAfterYears, months);
    
    const days = differenceInDays(now, dateAfterMonths);
    
    return { years, months, days };
  };

  const duration = calculateDuration();

  return (
    <div className="bg-gradient-to-r from-teal-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white overflow-hidden relative">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-xl"></div>
      <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-32 h-32 bg-white opacity-10 rounded-full blur-xl"></div>

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
        
        {/* LEFT: SOBRIETY CLOCK */}
        <div className="flex-1">
          <h2 className="text-blue-100 font-medium text-sm uppercase tracking-wider mb-2 flex items-center gap-2">
            <TrophyIcon className="h-4 w-4" />
            Clean Time
          </h2>
          
          {sobrietyDate ? (
             <div className="flex gap-4 text-center">
               <div className="bg-white/20 rounded-lg p-3 min-w-[70px] backdrop-blur-sm">
                 <span className="block text-3xl font-bold">{duration.years}</span>
                 <span className="text-xs text-blue-100 uppercase">Years</span>
               </div>
               <div className="bg-white/20 rounded-lg p-3 min-w-[70px] backdrop-blur-sm">
                 <span className="block text-3xl font-bold">{duration.months}</span>
                 <span className="text-xs text-blue-100 uppercase">Months</span>
               </div>
               <div className="bg-white/20 rounded-lg p-3 min-w-[70px] backdrop-blur-sm">
                 <span className="block text-3xl font-bold">{duration.days}</span>
                 <span className="text-xs text-blue-100 uppercase">Days</span>
               </div>
             </div>
          ) : (
            <div className="bg-white/10 rounded-lg p-4 text-blue-100 text-sm">
              Set your sobriety date in Profile to start tracking.
            </div>
          )}
        </div>

        {/* RIGHT: GAMIFICATION STATS */}
        <div className="flex-shrink-0 grid grid-cols-3 md:grid-cols-1 gap-4 md:gap-2 border-t md:border-t-0 md:border-l border-white/20 pt-4 md:pt-0 md:pl-8">
            
            {/* Journal Streak */}
            <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
                   <PencilSquareIcon className="h-5 w-5 text-purple-200" />
                </div>
                <div>
                   <span className="block text-xl font-bold leading-none">
                      {journalStats?.journalStreak || 0}
                   </span>
                   <span className="text-xs text-blue-200">Journal Streak</span>
                </div>
            </div>

            {/* Consistency */}
            <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
                   <ScaleIcon className="h-5 w-5 text-green-200" />
                </div>
                <div>
                   <span className="block text-xl font-bold leading-none">
                      {journalStats?.consistencyRate || 0}
                   </span>
                   <span className="text-xs text-blue-200">Entries / Week</span>
                </div>
            </div>

            {/* Habit Fire */}
            <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
                   <FireIcon className="h-5 w-5 text-orange-200" />
                </div>
                <div>
                   <span className="block text-xl font-bold leading-none">
                      {taskStreak}
                   </span>
                   <span className="text-xs text-blue-200">Habit Fire</span>
                </div>
            </div>

        </div>

      </div>
    </div>
  );
}