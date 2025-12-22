import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase';
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import type { JournalEntry } from './JournalEditor';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { startOfMonth, subMonths, isSameMonth, getDay } from 'date-fns';

// --- HELPERS ---
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const COLORS = ['#4ade80', '#f87171', '#94a3b8']; // Green, Red, Gray

// Stop words for Word Cloud
const STOP_WORDS = new Set([
  'the', 'and', 'a', 'to', 'of', 'in', 'i', 'is', 'that', 'it', 'for', 'my', 'was', 'on', 'with', 'as', 'at', 'be', 'have', 'this', 'me', 'so', 'but', 'not', 'are', 'am', 'will', 'just', 'all', 'today', 'day', 'had', 'very'
]);

// --- STRICT TYPES ---
// Fix: Replaced 'any' with 'string | number | undefined' to satisfy ESLint no-explicit-any rule
// while preserving the index signature required by Recharts.
interface MoodDataPoint {
  date: string;
  mood: number;
  [key: string]: string | number | undefined; 
}

interface DayComparisonData {
  name: string; // e.g., "Mon"
  currentAvg: number;
  prevAvg: number;
  [key: string]: string | number | undefined;
}

interface SentimentDataPoint {
  name: string;
  value: number;
  [key: string]: string | number | undefined;
}

interface WordCloudItem {
  text: string;
  count: number;
}

export default function JournalInsights() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  // Chart Data State
  const [moodData, setMoodData] = useState<MoodDataPoint[]>([]);
  const [dayData, setDayData] = useState<DayComparisonData[]>([]);
  const [sentimentData, setSentimentData] = useState<SentimentDataPoint[]>([]);
  const [wordCloud, setWordCloud] = useState<WordCloudItem[]>([]);

  // --- PROCESSORS ---

  const processMoodGraph = (entries: JournalEntry[]) => {
    // Reverse to show oldest -> newest left to right
    // We limit this chart to the last 30 entries to prevent overcrowding
    const data = [...entries].reverse().slice(-30).map(e => ({
      date: e.createdAt?.toDate ? e.createdAt.toDate().toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' }) : '',
      mood: e.moodScore
    }));
    setMoodData(data);
  };

  const processDayComparison = (entries: JournalEntry[]) => {
    // Initialize aggregators
    const currentSums = new Array(7).fill(0);
    const currentCounts = new Array(7).fill(0);
    const prevSums = new Array(7).fill(0);
    const prevCounts = new Array(7).fill(0);

    const now = new Date();
    const lastMonthDate = subMonths(now, 1); // A date in the previous month

    entries.forEach(e => {
      if (!e.createdAt?.toDate) return;
      
      const entryDate = e.createdAt.toDate();
      const dayIdx = getDay(entryDate); // 0 (Sun) - 6 (Sat)
      
      if (isSameMonth(entryDate, now)) {
        // Current Month Bucket
        currentSums[dayIdx] += e.moodScore;
        currentCounts[dayIdx] += 1;
      } else if (isSameMonth(entryDate, lastMonthDate)) {
        // Previous Month Bucket
        prevSums[dayIdx] += e.moodScore;
        prevCounts[dayIdx] += 1;
      }
    });

    // Map to Chart Data
    const data: DayComparisonData[] = DAYS.map((day, idx) => ({
      name: day,
      currentAvg: currentCounts[idx] ? parseFloat((currentSums[idx] / currentCounts[idx]).toFixed(1)) : 0,
      prevAvg: prevCounts[idx] ? parseFloat((prevSums[idx] / prevCounts[idx]).toFixed(1)) : 0
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

  // --- DATA LOADING ---
  
  const loadData = useCallback(async () => {
    if (!user || !db) return;

    try {
      // 1. Calculate Date Range (Start of Last Month -> Now)
      const now = new Date();
      const startOfLastMonth = startOfMonth(subMonths(now, 1));

      // 2. Fetch Entries
      const q = query(
        collection(db, 'journals'),
        where('uid', '==', user.uid),
        where('createdAt', '>=', Timestamp.fromDate(startOfLastMonth)),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const entries = snapshot.docs.map(doc => ({ ...doc.data() } as JournalEntry));

      processMoodGraph(entries);
      processDayComparison(entries);
      processSentiment(entries);
      processWordCloud(entries);

    } catch (error) {
      console.error("Error loading insights:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) return <div className="text-center py-10 text-gray-400">Crunching the numbers...</div>;

  if (moodData.length === 0) return <div className="text-center py-10 text-gray-400">No entries found for this period. Start journaling to see insights!</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-10">
      
      {/* 1. MOOD GRAPH */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm md:col-span-2">
         <h3 className="font-bold text-gray-900 mb-4">Mood History (Last 30 Entries)</h3>
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

      {/* 2. TRIGGER DAYS (BAR - COMPARISON) */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
         <h3 className="font-bold text-gray-900 mb-4">Average Mood (This Month vs Last)</h3>
         <div className="h-56 w-full">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={dayData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{fontSize: 12}} stroke="#9ca3af" />
                  <YAxis domain={[0, 10]} hide />
                  <Tooltip cursor={{fill: 'transparent'}} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar 
                    name="Last Month" 
                    dataKey="prevAvg" 
                    fill="#cbd5e1" // Slate-300
                    radius={[4, 4, 0, 0]} 
                  />
                  <Bar 
                    name="This Month" 
                    dataKey="currentAvg" 
                    fill="#3b82f6" // Blue-500
                    radius={[4, 4, 0, 0]} 
                  />
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