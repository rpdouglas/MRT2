import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { WORKBOOKS } from '../data/workbooks';
import { 
    BookOpenIcon, 
    StarIcon, 
    HeartIcon, 
    AcademicCapIcon,
    SparklesIcon,
    FireIcon,
    ChevronRightIcon
} from '@heroicons/react/24/outline';

export default function Workbooks() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
      activeCount: 0,
      wisdomScore: 0,
      mastery: 0
  });

  useEffect(() => {
    async function loadStats() {
        if (!user || !db) return;
        
        try {
            // Fetch all answers to calculate stats
            const colRef = collection(db, 'users', user.uid, 'workbook_answers');
            const snapshot = await getDocs(colRef);
            
            // 1. Wisdom Score (Total Answers)
            const wisdomScore = snapshot.size;

            // 2. Active Workbooks (Count unique workbook IDs from doc IDs "workbookId_sectionId")
            const uniqueWorkbooks = new Set<string>();
            snapshot.docs.forEach(doc => {
                const [wbId] = doc.id.split('_');
                if (wbId) uniqueWorkbooks.add(wbId);
            });
            const activeCount = uniqueWorkbooks.size;

            // 3. Mastery (Approximate % based on a fixed total for now, or dynamic)
            // Assuming ~45 questions total across current workbooks as a baseline for 100% mastery visually
            // In a real app, you'd calculate total available questions dynamically.
            const TOTAL_ESTIMATED_QUESTIONS = 45; 
            const mastery = Math.min(100, Math.round((wisdomScore / TOTAL_ESTIMATED_QUESTIONS) * 100));

            setStats({ activeCount, wisdomScore, mastery });
        } catch (error) {
            console.error("Failed to load workbook stats", error);
        } finally {
            setLoading(false);
        }
    }
    loadStats();
  }, [user]);

  const getTheme = (type: string) => {
    switch (type) {
      case 'general': return { color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-l-yellow-500', icon: StarIcon };
      case 'steps': return { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-l-blue-600', icon: BookOpenIcon };
      default: return { color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-l-purple-500', icon: HeartIcon };
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading your library...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      
      {/* --- HEADER (Matches Tasks Style) --- */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <AcademicCapIcon className="h-8 w-8 text-blue-600" />
                Recovery Library
            </h1>
            <p className="text-sm text-gray-500 mt-1">Structured guides to process your journey.</p>
          </div>
      </div>

      {/* --- MINI STATS GRID --- */}
      <div className="grid grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
              <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Active</span>
              <span className="text-2xl font-bold text-gray-900">{stats.activeCount}</span>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
              <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Wisdom Score</span>
              <div className="flex items-center gap-1 text-2xl font-bold text-cyan-600">
                  <SparklesIcon className="h-6 w-6" />
                  {stats.wisdomScore}
              </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
              <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Mastery</span>
              <div className="flex items-center gap-1 text-2xl font-bold text-indigo-600">
                  <FireIcon className="h-6 w-6" />
                  {stats.mastery}%
              </div>
          </div>
      </div>

      {/* --- WORKBOOK LIST (Quest Card Style) --- */}
      <div className="space-y-4">
        {WORKBOOKS.map((workbook) => {
            const theme = getTheme(workbook.type);
            
            return (
                <Link 
                    key={workbook.id} 
                    to={`/workbooks/${workbook.id}`}
                    className={`block relative group bg-white rounded-xl p-5 shadow-sm border border-gray-200 transition-all hover:shadow-md ${theme.border} border-l-[6px]`}
                >
                    <div className="flex items-start gap-4">
                        
                        {/* Icon Badge */}
                        <div className={`flex-shrink-0 h-10 w-10 rounded-lg flex items-center justify-center ${theme.bg} ${theme.color}`}>
                            <theme.icon className="h-6 w-6" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                                <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                                    {workbook.title}
                                </h3>
                                <ChevronRightIcon className="h-5 w-5 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                            </div>
                            
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                {workbook.description}
                            </p>

                            {/* Metadata Chips */}
                            <div className="flex items-center gap-3">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${theme.bg} ${theme.color} border-transparent`}>
                                    {workbook.sections.length} Sections
                                </span>
                                {workbook.type === 'steps' && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                        12-Step Compatible
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </Link>
            );
        })}
      </div>
    </div>
  );
}