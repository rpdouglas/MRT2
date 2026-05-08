import os

FENCE = chr(96) * 3

JOURNAL_INSIGHTS_CONTENT = """/**
 * src/components/journal/JournalInsights.tsx
 * GITHUB COMMENT:
 * [JournalInsights.tsx]
 * FEAT: "Emotional Velocity" upgraded to Gradient Area Chart.
 * FEAT: "Weekly Rhythm" upgraded to 'Baseline vs Reality' (Thick Bars + Dotted Line).
 * FEAT: Added smart Stop-Word filtering to Word Cloud.
 * FEAT: Added "Manage Filter" modal for user-defined blocked words (LocalStorage).
 * REFACTOR: Momentum Kinetic v3.0 (Project 54) - Walt Persona 'Glass & Glow' Integration
 */
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase';
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { 
    AreaChart, 
    Area, 
    Line, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    Legend
} from 'recharts';
import { 
    CloudIcon, 
    FireIcon, 
    CalendarDaysIcon,
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon,
    EyeSlashIcon
} from '@heroicons/react/24/outline';
import { format, subDays, getDay, startOfDay } from 'date-fns';
import ManageWordCloudModal from './ManageWordCloudModal';

// --- TYPES ---

interface DailyStats {
    date: string; 
    displayDate: string; 
    avgMood: number;
    avgTemp: number;
    entryCount: number;
}

interface WeeklyComparisonStats {
    dayName: string;
    currentAvg: number;
    prevAvg: number;
    currentCount: number;
    prevCount: number;
}

interface WordFrequency {
    text: string;
    value: number;
}

interface JournalEntryRaw {
    moodScore?: number;
    weather?: { temp: number; condition: string } | null;
    createdAt: Timestamp;
    sentiment?: string; 
    content?: string;
}

// --- DESIGN TOKENS (Walt Persona / Insights Module) ---
const TOKENS = {
    gradA: "#E879F9", 
    gradB: "#EC4899",
    glowA: "#E879F988", 
    border: "#E879F944",
    bg: "linear-gradient(145deg, #1A0528 0%, #0F0320 100%)",
    pill: "linear-gradient(135deg, #E879F9, #EC4899)",
    pillGhost: "rgba(232,121,249,0.1)",
    accent: "#E879F9", 
    accentDim: "rgba(232,121,249,0.35)",
    textHigh: "#FDF4FF", 
    textMid: "rgba(245,208,254,0.75)", 
    textLow: "rgba(245,208,254,0.35)",
};

// EXPANDED STOP WORDS
const RECOVERY_STOP_WORDS = new Set([
    'the', 'and', 'i', 'to', 'a', 'of', 'in', 'was', 'my', 'that', 'for', 'it', 'me', 'on', 
    'with', 'but', 'is', 'this', 'have', 'be', 'so', 'not', 'at', 'as', 'today', 'day', 
    'feeling', 'feel', 'am', 'just', 'had', 'very', 'really', 'will', 'up', 'out', 'from',
    'about', 'what', 'when', 'where', 'how', 'why',
    // MRT Boilerplate
    'morning', 'check-in', 'checkin', 'nightly', 'review', 'urge', 'log', 'meeting', 'reflection',
    'trigger', 'intensity', 'coping', 'strategy', 'topic', 'heard', 'resonated', 'apply',
    'well', 'challenged', 'stay', 'sober', 'focus', 'grateful', 'main', 'thing', 'went'
]);

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const STORAGE_KEY_BLOCKLIST = 'mrt_word_cloud_ignore_list';

// --- MOMENTUM KINETIC UI COMPONENTS ---

function GlassCard({ children, style = {} }: { children: React.ReactNode, style?: React.CSSProperties }) {
    return (
        <div style={{
            borderRadius: 20, overflow: "hidden", position: "relative",
            background: `linear-gradient(145deg, ${TOKENS.gradA}55, ${TOKENS.gradB}33)`,
            padding: 1.5, ...style,
            fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif"
        }}>
            <div style={{
                borderRadius: 19,
                background: "rgba(8, 4, 20, 0.62)",
                backdropFilter: "blur(24px) saturate(1.6)",
                WebkitBackdropFilter: "blur(24px) saturate(1.6)",
                padding: "24px 20px",
                position: "relative", overflow: "hidden",
            }}>
                <div style={{ position: "absolute", top: -40, right: -30, width: 140, height: 140, borderRadius: "50%", background: `radial-gradient(circle, ${TOKENS.gradA}30 0%, transparent 65%)`, pointerEvents: "none" }} />
                <div style={{ position: "absolute", bottom: -30, left: -10, width: 100, height: 100, borderRadius: "50%", background: `radial-gradient(circle, ${TOKENS.gradB}25 0%, transparent 65%)`, pointerEvents: "none" }} />
                <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
            </div>
        </div>
    );
}

function PillBar({ value, max = 10, prev = 0, segments = 10, height = 12, animate = true }: { value: number, max?: number, prev?: number, segments?: number, height?: number, animate?: boolean }) {
    const [revealed, setRevealed] = useState(animate ? 0 : value);
    const [ran, setRan] = useState(!animate);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (ran) return;
        const obs = new IntersectionObserver(([e]) => {
            if (e.isIntersecting && !ran) {
                setRan(true);
                let s = 0;
                const iv = setInterval(() => {
                    s++;
                    setRevealed(s);
                    if (s >= value) clearInterval(iv);
                }, 55);
            }
        }, { threshold: 0.3 });
        if (ref.current) obs.observe(ref.current);
        return () => obs.disconnect();
    }, [value, ran]);

    const filled = animate ? revealed : value;

    // Guard against NaN/Infinity
    const safeMax = isNaN(max) || max === 0 ? 10 : max;
    const safeValue = isNaN(value) ? 0 : value;
    
    // Calculate proportion to fill out of 'segments'
    const fillProportion = Math.min(safeValue / safeMax, 1);
    const targetSegmentsToFill = Math.round(fillProportion * segments);
    
    const prevProportion = Math.min((isNaN(prev) ? 0 : prev) / safeMax, 1);
    const prevSegmentsToFill = Math.round(prevProportion * segments);

    const segmentsArray = Array.from({ length: segments });

    return (
        <div ref={ref} style={{ display: "flex", gap: 4 }}>
            {segmentsArray.map((_, si) => {
                const isFilled = si < (animate ? Math.min(targetSegmentsToFill, revealed) : targetSegmentsToFill);
                const isPrev = si < prevSegmentsToFill;
                return (
                    <div key={si} style={{
                        flex: 1, height,
                        borderRadius: 999,
                        background: isFilled
                            ? TOKENS.pill
                            : isPrev
                                ? TOKENS.pillGhost
                                : "rgba(255,255,255,0.04)",
                        boxShadow: isFilled ? `0 0 10px ${TOKENS.glowA}` : "none",
                        border: `1px solid ${isFilled ? TOKENS.border : "rgba(255,255,255,0.06)"}`,
                        transition: isFilled ? "all 0.2s ease" : "none",
                        transform: isFilled ? "scaleY(1)" : "scaleY(0.75)",
                        transformOrigin: "center",
                    }} />
                );
            })}
        </div>
    );
}

// --- MAIN COMPONENT ---

export default function JournalInsights() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, avgMood: 0, streak: 0, trend: 0 });
  
  const [dailyTrendData, setDailyTrendData] = useState<DailyStats[]>([]);
  const [weeklyComparisonData, setWeeklyComparisonData] = useState<WeeklyComparisonStats[]>([]);
  const [wordCloudData, setWordCloudData] = useState<WordFrequency[]>([]);

  // User Blocklist State (Persisted)
  const [userBlockList, setUserBlockList] = useState<string[]>(() => {
      const stored = localStorage.getItem(STORAGE_KEY_BLOCKLIST);
      return stored ? JSON.parse(stored) : [];
  });
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // Save blocklist when it changes
  useEffect(() => {
      localStorage.setItem(STORAGE_KEY_BLOCKLIST, JSON.stringify(userBlockList));
  }, [userBlockList]);

  // Load Data Effect
  useEffect(() => {
    async function loadData() {
        if (!user || !db) return;

        try {
            const q = query(
                collection(db, 'journals'), 
                where('uid', '==', user.uid),
                orderBy('createdAt', 'asc')
            );
            
            const snapshot = await getDocs(q);
            const rawData = snapshot.docs.map(d => d.data() as JournalEntryRaw);

            // Containers
            const dailyMap = new Map<string, { moodSum: number; moodCount: number; tempSum: number; tempCount: number, timestamp: Date }>();
            const weeklyBuckets = Array.from({ length: 7 }, (_, i) => ({
                dayName: DAYS_OF_WEEK[i],
                currentTotal: 0, currentCount: 0,
                prevTotal: 0, prevCount: 0
            }));
            const wordFreq: Record<string, number> = {};

            // Dates
            const today = startOfDay(new Date());
            const thirtyDaysAgo = subDays(today, 30);
            const sixtyDaysAgo = subDays(today, 60);

            // Globals
            let totalMoodSum = 0;
            let totalEntries = 0;
            let current30Total = 0; let current30Count = 0;
            let prev30Total = 0; let prev30Count = 0;

            // Combined Block Set for Filtering
            const activeBlockSet = new Set([...Array.from(RECOVERY_STOP_WORDS), ...userBlockList]);

            rawData.forEach(entry => {
                if (!entry.createdAt) return;
                const dateObj = entry.createdAt.toDate(); 
                const dateKey = format(dateObj, 'yyyy-MM-dd'); 

                // 1. Daily Trend
                if (!dailyMap.has(dateKey)) {
                    dailyMap.set(dateKey, { moodSum: 0, moodCount: 0, tempSum: 0, tempCount: 0, timestamp: dateObj });
                }
                const dayStat = dailyMap.get(dateKey)!;

                if (entry.moodScore !== undefined) {
                    dayStat.moodSum += entry.moodScore;
                    dayStat.moodCount += 1;
                    totalMoodSum += entry.moodScore;
                    totalEntries++;

                    // 2. Weekly Comparison
                    const dayIndex = getDay(dateObj); // 0 = Sun
                    
                    if (dateObj >= thirtyDaysAgo) {
                        weeklyBuckets[dayIndex].currentTotal += entry.moodScore;
                        weeklyBuckets[dayIndex].currentCount += 1;
                        current30Total += entry.moodScore;
                        current30Count += 1;
                    } else if (dateObj >= sixtyDaysAgo && dateObj < thirtyDaysAgo) {
                        weeklyBuckets[dayIndex].prevTotal += entry.moodScore;
                        weeklyBuckets[dayIndex].prevCount += 1;
                        prev30Total += entry.moodScore;
                        prev30Count += 1;
                    }
                }

                if (entry.weather?.temp !== undefined) {
                    dayStat.tempSum += entry.weather.temp;
                    dayStat.tempCount += 1;
                }

                // 3. Word Cloud
                if (entry.content) {
                    const cleanContent = entry.content.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g,"");
                    const words = cleanContent.split(/\s+/);
                    words.forEach(word => {
                        // Check against the combined active block set
                        if (word.length > 3 && !activeBlockSet.has(word)) {
                            wordFreq[word] = (wordFreq[word] || 0) + 1;
                        }
                    });
                }
            });

            // Finalize Daily Trend
            const dailyStatsArray = Array.from(dailyMap.values()).map(stat => ({
                date: format(stat.timestamp, 'yyyy-MM-dd'),
                displayDate: format(stat.timestamp, 'MMM d'),
                avgMood: stat.moodCount > 0 ? parseFloat((stat.moodSum / stat.moodCount).toFixed(1)) : 0,
                avgTemp: stat.tempCount > 0 ? Math.round(stat.tempSum / stat.tempCount) : 0,
                entryCount: stat.moodCount
            })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            
            setDailyTrendData(dailyStatsArray.slice(-14));

            // Finalize Weekly (Reorder to Mon-Sun)
            const sunday = weeklyBuckets.shift(); 
            if (sunday) weeklyBuckets.push(sunday);
            
            const finalizedWeekly: WeeklyComparisonStats[] = weeklyBuckets.map(b => ({
                dayName: b.dayName,
                currentAvg: b.currentCount > 0 ? parseFloat((b.currentTotal / b.currentCount).toFixed(1)) : 0,
                prevAvg: b.prevCount > 0 ? parseFloat((b.prevTotal / b.prevCount).toFixed(1)) : 0,
                currentCount: b.currentCount,
                prevCount: b.prevCount
            }));
            setWeeklyComparisonData(finalizedWeekly);

            // Finalize Word Cloud
            const topWords = Object.entries(wordFreq)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 20)
                .map(([text, value]) => ({ text, value }));
            setWordCloudData(topWords);

            // Global Trend
            const current30Avg = current30Count > 0 ? current30Total / current30Count : 0;
            const prev30Avg = prev30Count > 0 ? prev30Total / prev30Count : 0;
            const trend = (prev30Count > 0 && current30Count > 0) ? parseFloat((current30Avg - prev30Avg).toFixed(1)) : 0;

            setStats({
                total: rawData.length,
                avgMood: totalEntries > 0 ? Math.round((totalMoodSum / totalEntries) * 10) / 10 : 0,
                streak: rawData.length,
                trend
            });

        } catch (error) {
            console.error("Error loading insights:", error);
        } finally {
            setLoading(false);
        }
    }

    loadData();
    // Re-run when blocklist changes to filter immediately
  }, [user, userBlockList]);

  // --- Handlers for Blocklist ---
  const handleAddBlockWord = (word: string) => {
      const lower = word.toLowerCase();
      if (!userBlockList.includes(lower)) {
          setUserBlockList(prev => [...prev, lower]);
      }
  };

  const handleRemoveBlockWord = (word: string) => {
      setUserBlockList(prev => prev.filter(w => w !== word));
  };

  if (loading) return (
      <div className="p-10 text-center" style={{ color: TOKENS.textLow }}>
          <div className="animate-pulse">Consulting the Vault...</div>
      </div>
  );

  return (
    <div className="space-y-6 pb-20" style={{ background: TOKENS.bg, minHeight: '100vh', margin: '-1rem', padding: '1rem', paddingTop: '2rem' }}>
        
        {/* --- TOP STATS (Walt Persona) --- */}
        <div className="grid grid-cols-3 gap-3">
            <GlassCard>
                <div className="flex flex-col items-center justify-center text-center">
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '28px', fontWeight: 400, color: TOKENS.textHigh, lineHeight: 1 }}>{stats.total}</div>
                    <div style={{ fontSize: '10px', color: TOKENS.textLow, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '8px' }}>Entries</div>
                </div>
            </GlassCard>
            <GlassCard>
                <div className="flex flex-col items-center justify-center text-center">
                    <div className="flex items-center gap-1.5">
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '28px', fontWeight: 400, color: TOKENS.accent, lineHeight: 1 }}>{stats.avgMood}</span>
                        {stats.trend !== 0 && (
                            <span style={{ 
                                display: 'flex', alignItems: 'center', fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '999px',
                                background: stats.trend > 0 ? 'rgba(52,211,153,0.12)' : 'rgba(251,113,133,0.12)',
                                color: stats.trend > 0 ? '#34D399' : '#FB7185'
                            }}>
                                {stats.trend > 0 ? <ArrowTrendingUpIcon className="h-3 w-3 mr-0.5" /> : <ArrowTrendingDownIcon className="h-3 w-3 mr-0.5" />}
                                {Math.abs(stats.trend)}
                            </span>
                        )}
                    </div>
                    <div style={{ fontSize: '10px', color: TOKENS.textLow, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '8px' }}>Avg Mood</div>
                </div>
            </GlassCard>
             <GlassCard>
                <div className="flex flex-col items-center justify-center text-center h-full">
                    <FireIcon style={{ height: '24px', width: '24px', color: '#F59E0B', marginBottom: '4px' }} />
                    <div style={{ fontSize: '10px', color: TOKENS.textLow, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Active</div>
                </div>
            </GlassCard>
        </div>

        {/* --- 1. WEEKLY RHYTHM (Baseline vs Reality with PillBar) --- */}
        <GlassCard>
            <div className="flex items-center justify-between mb-6">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: TOKENS.textHigh, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    <CalendarDaysIcon style={{ height: '16px', width: '16px', color: TOKENS.accent }} />
                    Weekly Rhythm
                </h3>
                <div className="flex gap-3 text-[10px] font-bold">
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: TOKENS.textLow }}>
                        <div style={{ width: '16px', height: '2px', background: 'transparent', borderBottom: `2px dashed ${TOKENS.textLow}` }}></div> Prev 30
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: TOKENS.accent }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: TOKENS.accent }}></div> Last 30
                    </span>
                </div>
            </div>
            
            <div className="flex flex-col gap-4">
                {weeklyComparisonData.map((day, i) => (
                    <div key={i} className="flex items-center gap-3">
                        <span style={{ fontSize: '11px', color: TOKENS.textLow, width: '28px', flexShrink: 0 }}>{day.dayName}</span>
                        <div className="flex-1">
                            <PillBar 
                                value={day.currentAvg} 
                                max={10} 
                                prev={day.prevAvg} 
                                segments={10} 
                                height={10} 
                                animate={true} 
                            />
                        </div>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', fontWeight: 400, color: TOKENS.accent, width: '22px', textAlign: 'right' }}>
                            {day.currentAvg.toFixed(1)}
                        </span>
                    </div>
                ))}
            </div>
            <p style={{ textAlign: 'center', fontSize: '10px', color: TOKENS.textLow, marginTop: '16px' }}>Avg Mood Score per Day</p>
        </GlassCard>

        {/* --- 2. EMOTIONAL VELOCITY (Gradient Area) --- */}
        <GlassCard>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: TOKENS.textHigh, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '24px' }}>
                ✦ Emotional Velocity
            </h3>
            
            <div className="h-72 w-full min-w-0" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dailyTrendData} margin={{ top: 20, right: 0, bottom: 0, left: -20 }}>
                        <defs>
                            <linearGradient id="colorMoodArea" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={TOKENS.gradA} stopOpacity={0.15}/>
                                <stop offset="95%" stopColor={TOKENS.gradA} stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                        <XAxis 
                            dataKey="displayDate" 
                            tick={{fontSize: 10, fill: TOKENS.textLow}} 
                            axisLine={false}
                            tickLine={false}
                            minTickGap={30}
                        />
                        <YAxis yAxisId="left" domain={[0, 10]} hide />
                        <YAxis yAxisId="right" orientation="right" hide domain={['auto', 'auto']} />

                        <Tooltip 
                            contentStyle={{borderRadius: '16px', background: 'rgba(8,4,20,0.9)', border: `1px solid ${TOKENS.border}`, backdropFilter: 'blur(12px)', color: TOKENS.textHigh}} 
                            itemStyle={{color: TOKENS.textHigh}}
                            labelStyle={{fontSize: '12px', fontFamily: "'DM Sans', sans-serif", color: TOKENS.textLow, marginBottom: '4px'}}
                            cursor={{stroke: TOKENS.textLow, strokeWidth: 1, strokeDasharray: '3 3'}}
                        />
                        <Legend wrapperStyle={{fontSize: '10px', paddingTop: '10px', color: TOKENS.textLow}} />

                        <Area 
                            yAxisId="left"
                            type="monotone" 
                            dataKey="avgMood" 
                            name="Mood Flow" 
                            stroke="url(#colorMoodArea)" 
                            fillOpacity={1} 
                            fill="url(#colorMoodArea)" 
                            strokeWidth={3} 
                            activeDot={{r: 4, fill: TOKENS.accent, stroke: '#080414', strokeWidth: 2}}
                        />
                        <Line 
                            yAxisId="right" 
                            type="monotone" 
                            dataKey="avgTemp" 
                            name="Temp" 
                            stroke={TOKENS.textLow} 
                            strokeWidth={1} 
                            dot={false} 
                            strokeDasharray="4 4" 
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </GlassCard>

        {/* --- 3. WORD CLOUD (Walt Reflection) --- */}
        <GlassCard>
            <div className="flex justify-between items-center mb-6">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: TOKENS.textHigh, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    <CloudIcon style={{ height: '16px', width: '16px', color: TOKENS.accent }} />
                    Recurring Themes
                </h3>
                
                <button 
                    onClick={() => setIsFilterModalOpen(true)}
                    style={{ padding: '6px', borderRadius: '999px', color: TOKENS.textLow, transition: 'all 0.2s', background: 'transparent', border: 'none', cursor: 'pointer' }}
                    title="Manage Ignored Words"
                >
                    <EyeSlashIcon className="h-5 w-5" />
                </button>
            </div>
            
            {wordCloudData.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0', fontSize: '13px', color: TOKENS.textLow }}>
                    Every journey starts with a first reflection.
                </div>
            ) : (
                <div className="flex flex-wrap gap-2 justify-center items-center py-4">
                    {wordCloudData.map((word, i) => {
                        const maxVal = wordCloudData[0].value;
                        
                        // Scale font size based on Walt typography constraints
                        let fontSize = '13px';
                        let color = TOKENS.textLow;
                        let fontWeight = 400;

                        if (word.value > maxVal * 0.8) {
                            fontSize = '24px';
                            color = TOKENS.accent;
                            fontWeight = 600;
                        } else if (word.value > maxVal * 0.6) {
                            fontSize = '18px';
                            color = TOKENS.textHigh;
                            fontWeight = 500;
                        } else if (word.value > maxVal * 0.4) {
                            fontSize = '15px';
                            color = TOKENS.textMid;
                        }

                        return (
                            <button
                                key={i}
                                onClick={() => navigate(`/journal?tab=history&search=${encodeURIComponent(word.text)}`)}
                                style={{
                                    fontSize, color, fontWeight, 
                                    padding: '4px 8px', borderRadius: '8px',
                                    background: 'transparent', border: 'none', cursor: 'pointer',
                                    transition: 'all 0.2s ease', fontFamily: "'DM Sans', sans-serif"
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = TOKENS.pillGhost;
                                    e.currentTarget.style.transform = 'scale(1.05)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.transform = 'scale(1)';
                                }}
                                title={`Search for "${word.text}"`}
                            >
                                {word.text}
                            </button>
                        );
                    })}
                </div>
            )}
        </GlassCard>

        {/* FILTER MODAL */}
        <ManageWordCloudModal 
            isOpen={isFilterModalOpen} 
            onClose={() => setIsFilterModalOpen(false)}
            blockedWords={userBlockList}
            onAddWord={handleAddBlockWord}
            onRemoveWord={handleRemoveBlockWord}
        />
    </div>
  );
}
"""

with open('scripts/update_feature.py', 'w') as f:
    f.write(f"""import os

def update_file():
    target_file = "src/components/journal/JournalInsights.tsx"
    
    # We are directly overwriting with the new redesigned content
    content = {repr(JOURNAL_INSIGHTS_CONTENT)}
    
    with open(target_file, "w") as f:
        f.write(content)
        
    print(f"✅ Successfully updated {{target_file}}")

if __name__ == "__main__":
    update_file()
""")
print("Generated scripts/update_feature.py successfully.")