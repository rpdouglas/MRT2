import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { WORKBOOKS } from '../data/workbooks';
import VibrantHeader from '../components/VibrantHeader';
import { THEME } from '../lib/theme';
import { 
    BookOpenIcon, 
    StarIcon, 
    HeartIcon, 
    AcademicCapIcon,
    SparklesIcon,
    FireIcon,
    ChevronRightIcon,
    CheckBadgeIcon
} from '@heroicons/react/24/outline';

export default function Workbooks() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
      chaptersMastered: 0,
      wisdomScore: 0,
      mastery: 0
  });

  useEffect(() => {
    async function loadStats() {
        if (!user || !db) return;
        
        try {
            // 1. Build requirement map from static data
            const requiredPerSection: Record<string, number> = {};
            let totalEstimatedQuestions = 0;
            
            WORKBOOKS.forEach(wb => {
                wb.sections.forEach(sec => {
                    const requiredCount = sec.questions.filter(q => q.type !== 'read_only').length;
                    requiredPerSection[sec.id] = requiredCount;
                    totalEstimatedQuestions += requiredCount;
                });
            });

            // 2. Fetch User Data
            const colRef = collection(db, 'users', user.uid, 'workbook_answers');
            const snapshot = await getDocs(colRef);
            
            const wisdomScore = snapshot.size;

            // 3. Tally user answers per section
            const userAnswersPerSection: Record<string, number> = {};
            snapshot.docs.forEach(docSnap => {
                const data = docSnap.data();
                if (data.sectionId) {
                    userAnswersPerSection[data.sectionId] = (userAnswersPerSection[data.sectionId] || 0) + 1;
                }
            });

            // 4. Calculate completely mastered chapters
            let chaptersMastered = 0;
            for (const [sectionId, requiredCount] of Object.entries(requiredPerSection)) {
                const answeredCount = userAnswersPerSection[sectionId] || 0;
                if (requiredCount > 0 && answeredCount >= requiredCount) {
                    chaptersMastered++;
                }
            }

            const mastery = totalEstimatedQuestions > 0 
                ? Math.min(100, Math.round((wisdomScore / totalEstimatedQuestions) * 100))
                : 0;

            setStats({ chaptersMastered, wisdomScore, mastery });
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
    <div className={`pb-24 relative min-h-screen ${THEME.workbooks.page}`}>
      
      {/* HEADER */}
      <VibrantHeader 
        title="Recovery Library"
        subtitle="Structured guides to process your journey."
        icon={AcademicCapIcon}
        fromColor={THEME.workbooks.header.from}
        viaColor={THEME.workbooks.header.via}
        toColor={THEME.workbooks.header.to}
        percentage={stats.mastery}
        percentageColor={THEME.workbooks.ring}
      />

      <div className="max-w-4xl mx-auto px-4 -mt-10 relative z-30 space-y-6">
        
        <div className="grid grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
                <span className="text-[10px] sm:text-xs text-gray-400 font-bold uppercase tracking-wider text-center">Mastered</span>
                <div className="flex items-center gap-1 text-2xl font-bold text-emerald-600 mt-1">
                    <CheckBadgeIcon className="h-6 w-6" />
                    {stats.chaptersMastered}
                </div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
                <span className="text-[10px] sm:text-xs text-gray-400 font-bold uppercase tracking-wider text-center">Wisdom Score</span>
                <div className="flex items-center gap-1 text-2xl font-bold text-cyan-600 mt-1">
                    <SparklesIcon className="h-6 w-6" />
                    {stats.wisdomScore}
                </div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
                <span className="text-[10px] sm:text-xs text-gray-400 font-bold uppercase tracking-wider text-center">Mastery</span>
                <div className="flex items-center gap-1 text-2xl font-bold text-indigo-600 mt-1">
                    <FireIcon className="h-6 w-6" />
                    {stats.mastery}%
                </div>
            </div>
        </div>

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
                          <div className={`flex-shrink-0 h-10 w-10 rounded-lg flex items-center justify-center ${theme.bg} ${theme.color}`}>
                              <theme.icon className="h-6 w-6" />
                          </div>
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
    </div>
  );
}
