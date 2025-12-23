import { Link } from 'react-router-dom';
import { 
    FireIcon, 
    ClipboardDocumentCheckIcon,
    ChartBarIcon, 
    SparklesIcon,
    BoltIcon,
    AcademicCapIcon,
    BookOpenIcon,
    ShieldCheckIcon,
    HeartIcon
} from '@heroicons/react/24/outline';

interface RecoveryHeroProps {
    userName: string;
    daysClean: number;
    journalStats: {
        streak: number;
        consistency: number;
    };
    taskStats: {
        fire: number;
        rate: number;
    };
    workbookStats: {
        wisdom: number;
        completion: number;
    };
    vitalityStats: { 
        bioStreak: number;
        totalLogs: number;
    };
    // Removed onSOSClick prop as button is removed
}

export default function RecoveryHero({ 
    userName, 
    daysClean, 
    journalStats, 
    taskStats, 
    workbookStats,
    vitalityStats
}: RecoveryHeroProps) {
  return (
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
         {/* Background Decoration */}
         <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl"></div>
         
         <div className="relative z-10">
             {/* Header Row: Greeting & Clean Time */}
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                 <div>
                     <h1 className="text-3xl font-bold">Welcome back, {userName}</h1>
                     <p className="text-blue-100 opacity-90">One day at a time. You are doing great.</p>
                 </div>

                 <div className="flex items-center gap-3">
                     
                     {/* CLEAN TIME BADGE */}
                     <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-2 flex items-center gap-3 shadow-lg">
                         <ShieldCheckIcon className="h-8 w-8 text-cyan-300" />
                         <div className="text-right">
                             <div className="text-2xl font-bold leading-none">{daysClean}</div>
                             <div className="text-[10px] uppercase tracking-wider text-blue-100 font-semibold">Days Clean</div>
                         </div>
                     </div>
                 </div>
             </div>

             {/* THE MATRIX GRID (Linked Tiles) */}
             <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                 
                 {/* COLUMN 1: JOURNAL */}
                 <Link to="/journal" className="group bg-blue-900/30 rounded-xl p-4 border border-blue-400/30 backdrop-blur-sm hover:bg-blue-900/50 hover:border-blue-400/50 transition-all cursor-pointer">
                     <div className="flex items-center gap-2 mb-3 text-blue-200 text-sm font-semibold uppercase tracking-wider group-hover:text-white transition-colors">
                         <BookOpenIcon className="h-4 w-4" /> Journal
                     </div>
                     <div className="space-y-3">
                         <div className="flex justify-between items-center">
                             <div className="flex items-center gap-2">
                                 <FireIcon className="h-5 w-5 text-orange-400" />
                                 <span className="text-sm font-medium">Streak</span>
                             </div>
                             <span className="text-xl font-bold">{journalStats.streak} Days</span>
                         </div>
                         <div className="flex justify-between items-center">
                             <div className="flex items-center gap-2">
                                 <ChartBarIcon className="h-5 w-5 text-purple-400" />
                                 <span className="text-sm font-medium">Consistency</span>
                             </div>
                             <span className="text-xl font-bold">{journalStats.consistency}/wk</span>
                         </div>
                     </div>
                 </Link>

                 {/* COLUMN 2: TASKS */}
                 <Link to="/tasks" className="group bg-blue-900/30 rounded-xl p-4 border border-blue-400/30 backdrop-blur-sm hover:bg-blue-900/50 hover:border-blue-400/50 transition-all cursor-pointer">
                     <div className="flex items-center gap-2 mb-3 text-blue-200 text-sm font-semibold uppercase tracking-wider group-hover:text-white transition-colors">
                         <ClipboardDocumentCheckIcon className="h-4 w-4" /> Habits
                     </div>
                     <div className="space-y-3">
                         <div className="flex justify-between items-center">
                             <div className="flex items-center gap-2">
                                 <BoltIcon className="h-5 w-5 text-yellow-400" />
                                 <span className="text-sm font-medium">Fire</span>
                             </div>
                             <span className="text-xl font-bold">{taskStats.fire} Days</span>
                         </div>
                         <div className="flex justify-between items-center">
                             <div className="flex items-center gap-2">
                                 <div className="h-5 w-5 rounded-full border-2 border-green-400 flex items-center justify-center">
                                     <div className="h-2 w-2 bg-green-400 rounded-full" />
                                 </div>
                                 <span className="text-sm font-medium">Completion</span>
                             </div>
                             <span className="text-xl font-bold">{taskStats.rate}%</span>
                         </div>
                     </div>
                 </Link>

                 {/* COLUMN 3: WORKBOOKS */}
                 <Link to="/workbooks" className="group bg-blue-900/30 rounded-xl p-4 border border-blue-400/30 backdrop-blur-sm hover:bg-blue-900/50 hover:border-blue-400/50 transition-all cursor-pointer">
                     <div className="flex items-center gap-2 mb-3 text-blue-200 text-sm font-semibold uppercase tracking-wider group-hover:text-white transition-colors">
                         <AcademicCapIcon className="h-4 w-4" /> Wisdom
                     </div>
                     <div className="space-y-3">
                         <div className="flex justify-between items-center">
                             <div className="flex items-center gap-2">
                                 <SparklesIcon className="h-5 w-5 text-cyan-400" />
                                 <span className="text-sm font-medium">Score</span>
                             </div>
                             <span className="text-xl font-bold">{workbookStats.wisdom} Ans</span>
                         </div>
                         <div className="flex justify-between items-center">
                             <div className="flex items-center gap-2">
                                 <div className="h-5 w-5 relative">
                                     <svg className="w-full h-full transform -rotate-90">
                                         <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
                                         <circle cx="10" cy="10" r="8" fill="none" stroke="#67e8f9" strokeWidth="3" strokeDasharray={`${workbookStats.completion * 0.5} 100`} />
                                     </svg>
                                 </div>
                                 <span className="text-sm font-medium">Mastery</span>
                             </div>
                             <span className="text-xl font-bold">{workbookStats.completion}%</span>
                         </div>
                     </div>
                 </Link>

                 {/* COLUMN 4: VITALITY */}
                 <Link to="/vitality" className="group bg-blue-900/30 rounded-xl p-4 border border-blue-400/30 backdrop-blur-sm hover:bg-blue-900/50 hover:border-blue-400/50 transition-all cursor-pointer">
                     <div className="flex items-center gap-2 mb-3 text-blue-200 text-sm font-semibold uppercase tracking-wider group-hover:text-white transition-colors">
                         <HeartIcon className="h-4 w-4" /> Vitality
                     </div>
                     <div className="space-y-3">
                         <div className="flex justify-between items-center">
                             <div className="flex items-center gap-2">
                                 <FireIcon className="h-5 w-5 text-rose-400" />
                                 <span className="text-sm font-medium">Bio-Streak</span>
                             </div>
                             <span className="text-xl font-bold">{vitalityStats.bioStreak} Days</span>
                         </div>
                         <div className="flex justify-between items-center">
                             <div className="flex items-center gap-2">
                                 <BoltIcon className="h-5 w-5 text-green-400" />
                                 <span className="text-sm font-medium">Total Logs</span>
                             </div>
                             <span className="text-xl font-bold">{vitalityStats.totalLogs}</span>
                         </div>
                     </div>
                 </Link>

             </div>
         </div>
      </div>
  );
}