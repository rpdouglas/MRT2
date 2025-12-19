import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import type { JournalEntry } from './JournalEditor';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

// --- HELPERS ---
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const COLORS = ['#4ade80', '#f87171', '#94a3b8']; // Green, Red, Gray

const STOP_WORDS = new Set([
  'the', 'and', 'a', 'to', 'of', 'in', 'i', 'is', 'that', 'it', 'for', 'my', 'was', 'on', 'with', 'as', 'at', 'be', 'have', 'this', 'me', 'so', 'but', 'not', 'are', 'am', 'will', 'just', 'all', 'today', 'day', 'had', 'very'
]);

export default function JournalInsights() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  
  // Chart Data State
  const [moodData, setMoodData] = useState<any[]>([]);
  const [dayData, setDayData] = useState<any[]>([]);
  const [sentimentData, setSentimentData] = useState<any[]>([]);
  const [wordCloud, setWordCloud] = useState<{ text: string, count: number }[]>([]);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    if (!user || !db) return;
    try {
      // 1. Fetch Entries (Last 50 for performance)
      const q = query(collection(db, 'journals'), where('uid', '==', user.uid), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const entries = snapshot.docs.map(doc => ({ ...doc.data() } as JournalEntry));

      processMoodGraph(entries);
      processTriggerDays(entries);
      processSentiment(entries);
      processWordCloud(entries);

    } catch (error) {
      console.error("Error loading insights:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- PROCESSORS ---

  const processMoodGraph = (entries: JournalEntry[]) => {
    // Reverse to show oldest -> newest left to right
    const data = [...entries].reverse().map(e => ({
      date: e.createdAt?.toDate ? e.createdAt.toDate().toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' }) : '',
      mood: e.moodScore
    }));
    setMoodData(data);
  };

  const processTriggerDays = (entries: JournalEntry[]) => {
    const daySums = new Array(7).fill(0);
    const dayCounts = new Array(7).fill(0);

    entries.forEach(e => {
      if (e.createdAt?.toDate) {
        const dayIdx = e.createdAt.toDate().getDay();
        daySums[dayIdx] += e.moodScore;
        dayCounts[dayIdx] += 1;
      }
    });

    const data = DAYS.map((day, idx) => ({
      name: day,
      avgMood: dayCounts[idx] ? parseFloat((daySums[idx] / dayCounts[idx]).toFixed(1)) : 0
    }));
    setDayData(data);
  };

  const processSentiment = (entries: JournalEntry[]) => {
    let pos = 0, neg = 0, neu = 0;
    entries.forEach(e => {
      // Use explicit sentiment if available, else guess by mood
      if (e.sentiment === 'Positive') pos++;
      else if (e.sentiment === 'Negative') neg++;
      else if (e.sentiment === 'Neutral') neu++;
      else {
        // Fallback logic
        if (e.moodScore >= 7) pos++;
        else if (e.moodScore <= 4) neg++;
        else neu++;
      }
    });

    setSentimentData([
      { name: 'Positive', value: pos },
      { name: 'Negative', value: neg },
      { name: 'Neutral', value: neu }
    ].filter(d => d.value > 0));
  };

  const processWordCloud = (entries: JournalEntry[]) => {
    const wordCounts: Record<string, number> = {};
    
    entries.forEach(e => {
      // Simple tokenization: lowercase, remove punctuation
      const words = e.content.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);
      words.forEach(w => {
        if (w.length > 2 && !STOP_WORDS.has(w)) {
          wordCounts[w] = (wordCounts[w] || 0) + 1;
        }
      });
    });

    const sorted = Object.entries(wordCounts)
      .map(([text, count]) => ({ text, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 30); // Top 30

    setWordCloud(sorted);
  };

  if (loading) return <div className="text-center py-10 text-gray-400">Crunching the numbers...</div>;
  if (moodData.length === 0) return <div className="text-center py-10 text-gray-400">No entries found to analyze.</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-10">
      
      {/* 1. MOOD GRAPH */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm md:col-span-2">
         <h3 className="font-bold text-gray-900 mb-4">Mood History</h3>
         <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
               <LineChart data={moodData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{fontSize: 12}} stroke="#9ca3af" />
                  <YAxis domain={[1, 10]} hide />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="mood" 
                    stroke="#2563eb" 
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#2563eb', strokeWidth: 0 }}
                    activeDot={{ r: 6 }} 
                  />
               </LineChart>
            </ResponsiveContainer>
         </div>
      </div>

      {/* 2. TRIGGER DAYS (BAR) */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
         <h3 className="font-bold text-gray-900 mb-4">Average Mood by Day</h3>
         <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
               <BarChart data={dayData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{fontSize: 12}} stroke="#9ca3af" />
                  <YAxis domain={[0, 10]} hide />
                  <Tooltip cursor={{fill: 'transparent'}} />
                  <Bar dataKey="avgMood" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
               </BarChart>
            </ResponsiveContainer>
         </div>
      </div>

      {/* 3. SENTIMENT (PIE) */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center">
         <h3 className="font-bold text-gray-900 mb-4 self-start">Emotional Weather</h3>
         <div className="h-56 w-full flex justify-center">
            <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                  <Pie
                    data={sentimentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {/* FIXED: Renamed 'entry' to '_' to silence unused var warning */}
                    {sentimentData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
               </PieChart>
            </ResponsiveContainer>
         </div>
         <div className="flex gap-4 text-xs mt-2">
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#4ade80]"></div>Positive</div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#f87171]"></div>Negative</div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#94a3b8]"></div>Neutral</div>
         </div>
      </div>

      {/* 4. WORD CLOUD */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm md:col-span-2">
         <h3 className="font-bold text-gray-900 mb-4">Recurring Themes (Top Words)</h3>
         <div className="flex flex-wrap gap-2 justify-center p-4 min-h-[150px] content-center">
            {/* FIXED: Removed unused 'i' index from map arguments */}
            {wordCloud.map((w) => {
               // Calculate font size relative to frequency
               const max = wordCloud[0]?.count || 1;
               const size = Math.max(0.8, (w.count / max) * 2.5); // 0.8rem to 2.5rem
               const opacity = Math.max(0.5, w.count / max);
               
               return (
                  <span 
                    key={w.text} 
                    style={{ fontSize: `${size}rem`, opacity }}
                    className="text-blue-600 font-medium hover:scale-110 transition-transform cursor-default"
                    title={`${w.count} occurrences`}
                  >
                    {w.text}
                  </span>
               );
            })}
         </div>
      </div>

    </div>
  );
}