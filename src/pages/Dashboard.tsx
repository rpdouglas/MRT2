import { useEffect, useState } from 'react'; // Removed unused 'React'
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getUserJournals, type JournalEntry } from '../lib/journal';
import { getInsightHistory } from '../lib/insights'; 
import SobrietyCounter from '../components/SobrietyCounter';
import { Link } from 'react-router-dom';
import { 
  ArrowRightIcon, 
  ChartBarIcon, 
  SparklesIcon 
} from '@heroicons/react/24/outline';

export default function Dashboard() {
  const { user } = useAuth();
  
  // State
  const [sobrietyDate, setSobrietyDate] = useState<Date | null>(null);
  const [recentEntries, setRecentEntries] = useState<JournalEntry[]>([]);
  const [latestInsight, setLatestInsight] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      if (!user || !db) return;

      try {
        // 1. Fetch User Profile for Sobriety Date
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists() && userDoc.data().sobrietyDate) {
          setSobrietyDate(userDoc.data().sobrietyDate.toDate());
        }

        // 2. Fetch Recent Journals (Last 7 for stats)
        const journals = await getUserJournals(user.uid);
        setRecentEntries(journals.slice(0, 7)); 

        // 3. Fetch Latest Insight
        try {
            const insights = await getInsightHistory(user.uid);
            if (insights.length > 0) setLatestInsight(insights[0]);
        } catch (e) {
            console.warn("Insight history fetch failed", e);
        }

      } catch (error) {
        console.error("Error loading dashboard:", error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [user]);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading Dashboard...</div>;
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      
      {/* 1. WELCOME SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
           <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.displayName}</h1>
           <p className="text-gray-500">Here is your recovery overview for today.</p>
        </div>
        <Link 
          to="/journal" 
          className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow-sm"
        >
          <span>Check In</span>
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
      </div>

      {/* 2. HERO: SOBRIETY COUNTER */}
      {sobrietyDate ? (
        <SobrietyCounter sobrietyDate={sobrietyDate} />
      ) : (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <p className="text-yellow-700">
            <strong>Action Required:</strong> Please go to your <Link to="/profile" className="underline">Profile</Link> to set your Sobriety Date.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* 3. RECENT MOOD TREND */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <ChartBarIcon className="h-5 w-5 text-gray-500" />
            Mood History
          </h3>
          
          {recentEntries.length > 0 ? (
            <div className="flex items-end justify-between h-32 space-x-2">
              {[...recentEntries].reverse().map((entry) => (
                <div key={entry.id} className="flex flex-col items-center flex-1 group">
                   <div 
                     className={`w-full rounded-t-md transition-all duration-500 ${
                        entry.moodScore >= 7 ? 'bg-green-400' : 
                        entry.moodScore <= 3 ? 'bg-red-400' : 'bg-yellow-400'
                     }`}
                     style={{ height: `${entry.moodScore * 10}%` }}
                   />
                   <span className="text-xs text-gray-400 mt-2">
                     {entry.createdAt.getDate()}
                   </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400 text-sm">
              No journal entries yet. Check in to see your trends!
            </div>
          )}
        </div>

        {/* 4. LATEST INSIGHT CARD */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <SparklesIcon className="h-5 w-5 text-purple-500" />
            Latest Insight
          </h3>
          
          {latestInsight ? (
            <div className="space-y-3">
              <p className="text-gray-600 italic">"{latestInsight.analysis}"</p>
              
              <div className="pt-2">
                <p className="text-xs font-bold text-gray-400 uppercase mb-2">Suggested Action</p>
                <div className="flex items-center gap-2 text-sm text-gray-800 bg-purple-50 p-2 rounded">
                  <div className="w-2 h-2 bg-purple-500 rounded-full" />
                  {latestInsight.actionableSteps?.[0] || "Keep coming back!"}
                </div>
              </div>
              
              <div className="text-right">
                 <Link to="/journal" className="text-sm text-blue-600 hover:underline">View all insights &rarr;</Link>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400 text-sm">
              Use the "Sparkle Button" in your Journal to generate your first AI Insight.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}