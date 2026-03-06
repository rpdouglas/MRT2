import os

# FENCE pattern to protect markdown backticks
FENCE = chr(96) * 3

# Path Resolution Engine to guarantee we hit the project root
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)

# =============================================================================
# 1. src/pages/Vitality.tsx
# =============================================================================
vitality_content = r'''import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, addDoc, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import VibrantHeader from '../components/VibrantHeader';
import { THEME } from '../lib/theme';
import { useWakeLock } from '../hooks/useWakeLock';
import { 
    HeartIcon, 
    FireIcon, 
    BeakerIcon, 
    BoltIcon,     
    CheckCircleIcon,
    PlayIcon,
    PauseIcon,
    ArrowPathIcon,
    SparklesIcon,
    AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';

interface VitalityLog {
    id: string;
    tags: string[];
    createdAt: Timestamp;
}

type VitalityTab = 'move' | 'fuel' | 'breath';
type BreathPhase = 'Idle' | 'Inhale' | 'Hold' | 'Exhale' | 'Hold (Empty)';
type BreathPatternType = '4-7-8' | '4-4-4-4' | 'custom';

const PRESETS = {
    '4-7-8': [4, 7, 8, 0],
    '4-4-4-4': [4, 4, 4, 4]
};

// Haptic Engine
const triggerHaptic = (type: 'pulse' | 'double' | 'long') => {
    try {
        if (!navigator.vibrate) return;
        if (type === 'pulse') navigator.vibrate([30]);
        if (type === 'double') navigator.vibrate([30, 60, 30]);
        if (type === 'long') navigator.vibrate([50, 30, 50]);
    } catch {
        // Safely ignore if browser blocks haptics
    }
};

export default function Vitality() {
    const { user } = useAuth();
    const { requestWakeLock, releaseWakeLock } = useWakeLock();
    const [activeTab, setActiveTab] = useState<VitalityTab>('move');
    const [saving, setSaving] = useState(false);
    
    // --- DATA STATE ---
    const [todaysLogs, setTodaysLogs] = useState<VitalityLog[]>([]);
    
    // --- FORM STATES ---
    const [moveActivity, setMoveActivity] = useState('');
    const [moveDuration, setMoveDuration] = useState('');
    const [moveIntensity, setMoveIntensity] = useState('Moderate');
    const [moveNote, setMoveNote] = useState('');

    const [mealType, setMealType] = useState('Lunch');
    const [hungerType, setHungerType] = useState('Physical'); 
    const [waterCount, setWaterCount] = useState(0); 
    const [nutriNote, setNutriNote] = useState('');

    // --- VITALITY 2.0 ENGINE STATES ---
    const [breathPattern, setBreathPattern] = useState<BreathPatternType>('4-7-8');
    const [customPattern, setCustomPattern] = useState<[number, number, number, number]>(() => {
        const saved = localStorage.getItem('mrt_custom_breath');
        if (saved) {
            try { return JSON.parse(saved) as [number, number, number, number]; } catch { /* ignore */ }
        }
        return [5, 0, 5, 0];
    });
    const [showSettings, setShowSettings] = useState(false);
    const [breathNote, setBreathNote] = useState('');

    // Engine Core
    const [breathActive, setBreathActive] = useState(false);
    const [breathTime, setBreathTime] = useState(0);
    const [breathPhase, setBreathPhase] = useState<BreathPhase>('Idle');
    const [phaseTimeLeft, setPhaseTimeLeft] = useState(0);
    const [visualState, setVisualState] = useState({ scale: 1, duration: 0 });

    const currentPhaseIndex = useRef(0); // 0: In, 1: Hold, 2: Out, 3: HoldEmpty
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (!user || !db) return;

        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const q = query(
            collection(db, 'journals'),
            where('uid', '==', user.uid),
            where('tags', 'array-contains', 'Vitality'),
            where('createdAt', '>=', Timestamp.fromDate(startOfToday)),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const logs = snapshot.docs.map(doc => ({ 
                id: doc.id, 
                ...doc.data() 
            } as VitalityLog));
            setTodaysLogs(logs);
        });

        return () => unsubscribe();
    }, [user]);

    const bioBalance = useMemo(() => {
        const hasMove = todaysLogs.some(l => l.tags.includes('Movement'));
        const hasFood = todaysLogs.some(l => l.tags.includes('Nutrition'));
        const hasMind = todaysLogs.some(l => l.tags.includes('Mindfulness') || l.tags.includes('Meditation'));
        
        let score = 0;
        if (hasMove) score += 33.3;
        if (hasFood) score += 33.3;
        if (hasMind) score += 33.3;
        return Math.min(100, score);
    }, [todaysLogs]);

    // --- ACTIONS ---
    const saveVitalityEntry = async (category: string, title: string, contentDetails: string, note: string, tags: string[]) => {
        if (!user || !db) return;
        setSaving(true);

        const fullContent = `**${title}**\n${contentDetails}\n\n**Somatic Check-in:**\n${note || "No specific notes recorded."}`;

        try {
            await addDoc(collection(db, 'journals'), {
                uid: user.uid,
                content: fullContent,
                moodScore: 5, 
                tags: ['Vitality', category, ...tags],
                sentiment: 'Pending',
                createdAt: Timestamp.now()
            });
            triggerHaptic('double');
        } catch (e) {
            console.error(e);
            alert("Failed to save entry.");
        } finally {
            setSaving(false);
        }
    };

    const handleLogMovement = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!moveActivity) return;
        
        const details = `*Activity:* ${moveActivity}\n*Duration:* ${moveDuration} mins\n*Intensity:* ${moveIntensity}`;
        await saveVitalityEntry('Movement', 'Movement Log 🏃', details, moveNote, [moveActivity]);
        
        setMoveActivity('');
        setMoveDuration('');
        setMoveNote('');
    };

    const handleLogNutrition = async (e: React.FormEvent) => {
        e.preventDefault();
        const details = `*Meal:* ${mealType}\n*Hunger Type:* ${hungerType}\n*Hydration at log:* ${waterCount} glasses`;
        await saveVitalityEntry('Nutrition', 'Fuel Log 🍎', details, nutriNote, [mealType]);
        setNutriNote('');
    };

    // --- BREATHWORK ENGINE (Vitality 2.0) ---

    const handleCustomChange = (index: number, val: number) => {
        const newPattern = [...customPattern] as [number, number, number, number];
        newPattern[index] = Math.max(0, val);
        setCustomPattern(newPattern);
        localStorage.setItem('mrt_custom_breath', JSON.stringify(newPattern));
    };

    const applyPhase = useCallback((index: number, pattern: number[]) => {
        currentPhaseIndex.current = index;
        const duration = pattern[index];
        setPhaseTimeLeft(duration);
        
        if (index === 0) {
            setBreathPhase('Inhale');
            setVisualState({ scale: 1.5, duration });
            triggerHaptic('pulse');
        } else if (index === 1) {
            setBreathPhase('Hold');
            setVisualState({ scale: 1.5, duration });
            triggerHaptic('double');
        } else if (index === 2) {
            setBreathPhase('Exhale');
            setVisualState({ scale: 0.8, duration });
            triggerHaptic('long');
        } else if (index === 3) {
            setBreathPhase('Hold (Empty)');
            setVisualState({ scale: 0.8, duration });
            triggerHaptic('double');
        }
    }, []);

    const startEngine = useCallback(() => {
        setBreathActive(true);
        setShowSettings(false);
        setBreathTime(0);
        requestWakeLock();
        
        const pattern = breathPattern === 'custom' ? customPattern : PRESETS[breathPattern];
        
        // Find first non-zero phase
        let startIndex = 0;
        while(pattern[startIndex] === 0 && startIndex < 4) startIndex++;
        if (startIndex === 4) startIndex = 0; 
        
        applyPhase(startIndex, pattern);

        if (timerRef.current) clearInterval(timerRef.current);
        
        timerRef.current = setInterval(() => {
            setBreathTime(t => t + 1);
            setPhaseTimeLeft(prev => {
                if (prev <= 1) {
                    let nextIdx = (currentPhaseIndex.current + 1) % 4;
                    while(pattern[nextIdx] === 0) {
                        nextIdx = (nextIdx + 1) % 4;
                    }
                    applyPhase(nextIdx, pattern);
                    return pattern[nextIdx]; 
                }
                return prev - 1;
            });
        }, 1000);

    }, [breathPattern, customPattern, requestWakeLock, applyPhase]);

    const stopEngine = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        setBreathActive(false);
        setBreathPhase('Idle');
        setPhaseTimeLeft(0);
        setVisualState({ scale: 1, duration: 1 });
        releaseWakeLock();
    }, [releaseWakeLock]);

    useEffect(() => {
        return () => stopEngine();
    }, [stopEngine]);

    const handleLogBreath = async () => {
        const mins = Math.floor(breathTime / 60);
        const secs = breathTime % 60;
        const techniqueName = breathPattern === '4-7-8' ? 'Relax (4-7-8)' : breathPattern === '4-4-4-4' ? 'Box Breathing (4-4-4-4)' : `Custom (${customPattern.join('-')})`;
        const details = `*Session Duration:* ${mins}m ${secs}s\n*Technique:* ${techniqueName}`;
        
        stopEngine();
        await saveVitalityEntry('Mindfulness', 'Breathwork Session 🌬️', details, breathNote, ['Meditation']);
        
        setBreathNote('');
    };

    return (
        <div className={`h-[100dvh] flex flex-col ${THEME.vitality.page}`}>
            
            <div className="flex-shrink-0 z-10">
                <VibrantHeader 
                    title="Vitality & Health"
                    subtitle={new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                    icon={HeartIcon}
                    fromColor={THEME.vitality.header.from}
                    viaColor={THEME.vitality.header.via}
                    toColor={THEME.vitality.header.to}
                    percentage={bioBalance}
                    percentageColor={THEME.vitality.ring}
                />
            </div>

            {/* TAB NAVIGATION */}
            <div className="px-4 py-4 z-20">
                <div className="flex p-1 bg-white/80 backdrop-blur-sm rounded-xl border border-orange-200 shadow-sm">
                    <button onClick={() => setActiveTab('move')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'move' ? 'bg-orange-100 text-orange-700 shadow-sm' : 'text-gray-500'}`}>
                        Movement
                    </button>
                    <button onClick={() => setActiveTab('fuel')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'fuel' ? 'bg-emerald-100 text-emerald-700 shadow-sm' : 'text-gray-500'}`}>
                        Fuel
                    </button>
                    <button onClick={() => setActiveTab('breath')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'breath' ? 'bg-sky-100 text-sky-700 shadow-sm' : 'text-gray-500'}`}>
                        Breath
                    </button>
                </div>
            </div>

            {/* SCROLLABLE CONTENT AREA */}
            <div className="flex-1 overflow-y-auto px-4 pb-20">
                
                {/* 1. MOVEMENT CARD */}
                {activeTab === 'move' && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative animate-fadeIn">
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-orange-400 to-red-500"></div>
                        <div className="p-6">
                            <div className="flex items-center gap-2 mb-6">
                                <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
                                    <FireIcon className="h-6 w-6" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">Log Activity</h3>
                            </div>
                            <form onSubmit={handleLogMovement} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Activity</label>
                                        <input type="text" placeholder="e.g. Walk" value={moveActivity} onChange={(e) => setMoveActivity(e.target.value)} className="w-full text-sm rounded-xl border-gray-200 bg-gray-50" required />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Mins</label>
                                        <input type="number" placeholder="30" value={moveDuration} onChange={(e) => setMoveDuration(e.target.value)} className="w-full text-sm rounded-xl border-gray-200 bg-gray-50" required />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Intensity</label>
                                    <div className="flex gap-2">
                                        {['Low', 'Moderate', 'High'].map(lvl => (
                                            <button key={lvl} type="button" onClick={() => setMoveIntensity(lvl)} className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-all ${moveIntensity === lvl ? 'bg-orange-100 border-orange-200 text-orange-700' : 'bg-white border-gray-200 text-gray-500'}`}>{lvl}</button>
                                        ))}
                                    </div>
                                </div>
                                <textarea rows={2} placeholder="Body check-in..." value={moveNote} onChange={(e) => setMoveNote(e.target.value)} className="w-full text-sm rounded-xl border-gray-200 bg-gray-50 resize-none" />
                                <button type="submit" disabled={saving} className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 flex justify-center items-center gap-2">
                                    {saving ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <CheckCircleIcon className="h-5 w-5" />} Log
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* 2. NUTRITION CARD */}
                {activeTab === 'fuel' && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative animate-fadeIn">
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-emerald-400 to-green-600"></div>
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600"><BeakerIcon className="h-6 w-6" /></div>
                                    <h3 className="text-lg font-bold text-gray-900">Nutrition</h3>
                                </div>
                                <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                                    <button onClick={() => setWaterCount(Math.max(0, waterCount - 1))} className="text-blue-400 font-bold">-</button>
                                    <span className="text-sm font-bold text-blue-700 w-4 text-center">{waterCount}</span>
                                    <button onClick={() => setWaterCount(waterCount + 1)} className="text-blue-400 font-bold">+</button>
                                    <span className="text-[10px] text-blue-400 uppercase font-bold">H2O</span>
                                </div>
                            </div>
                            <form onSubmit={handleLogNutrition} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Meal</label>
                                        <select value={mealType} onChange={(e) => setMealType(e.target.value)} className="w-full text-sm rounded-xl border-gray-200 bg-gray-50"><option>Breakfast</option><option>Lunch</option><option>Dinner</option><option>Snack</option></select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Hunger</label>
                                        <select value={hungerType} onChange={(e) => setHungerType(e.target.value)} className="w-full text-sm rounded-xl border-gray-200 bg-gray-50"><option>Physical</option><option>Emotional</option><option>Boredom</option><option>Habit</option></select>
                                    </div>
                                </div>
                                <textarea rows={2} placeholder="Mindful eating check..." value={nutriNote} onChange={(e) => setNutriNote(e.target.value)} className="w-full text-sm rounded-xl border-gray-200 bg-gray-50 resize-none" />
                                <button type="submit" disabled={saving} className="w-full py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 flex justify-center items-center gap-2">
                                    {saving ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <CheckCircleIcon className="h-5 w-5" />} Log Fuel
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* 3. BREATHWORK CARD (Vitality 2.0) */}
                {activeTab === 'breath' && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative animate-fadeIn">
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-sky-400 to-blue-600"></div>
                        <div className="p-6">
                            
                            {/* Dynamic Organic Halo Styles */}
                            <style>{`
                                @keyframes organicMorph {
                                    0% { border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%; }
                                    34% { border-radius: 70% 30% 50% 50% / 30% 30% 70% 70%; }
                                    67% { border-radius: 100% 60% 60% 100% / 100% 100% 60% 60%; }
                                    100% { border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%; }
                                }
                                .organic-halo {
                                    animation: organicMorph 8s ease-in-out infinite;
                                    transition-property: transform;
                                    transition-timing-function: ease-in-out;
                                }
                            `}</style>

                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-2 bg-sky-50 rounded-lg text-sky-600"><BoltIcon className="h-6 w-6" /></div>
                                <h3 className="text-lg font-bold text-gray-900">Somatic Anchor</h3>
                            </div>

                            {/* SETTINGS MENU (Hidden when active) */}
                            {!breathActive && (
                                <div className="mb-6 flex flex-col items-center">
                                    <button onClick={() => setShowSettings(!showSettings)} className="text-xs font-bold text-sky-600 flex items-center gap-1.5 mb-2 hover:text-sky-800 transition-colors">
                                        <AdjustmentsHorizontalIcon className="h-4 w-4" /> 
                                        Pattern: {breathPattern === 'custom' ? 'Custom' : breathPattern === '4-7-8' ? 'Relax (4-7-8)' : 'Box Breathing (4-4-4-4)'}
                                    </button>
                                    
                                    {showSettings && (
                                         <div className="bg-sky-50 p-4 rounded-xl border border-sky-100 w-full max-w-sm animate-fadeIn text-left mt-2">
                                              <label className="block text-[10px] font-bold text-sky-800 uppercase tracking-widest mb-2">Select Rhythm</label>
                                              <select 
                                                  value={breathPattern} 
                                                  onChange={(e) => setBreathPattern(e.target.value as BreathPatternType)}
                                                  className="w-full text-sm rounded-lg border-sky-200 bg-white mb-4 focus:ring-sky-500 text-sky-900 font-medium"
                                              >
                                                  <option value="4-7-8">Relax (4-7-8)</option>
                                                  <option value="4-4-4-4">Box Breathing (4-4-4-4)</option>
                                                  <option value="custom">Custom Configuration</option>
                                              </select>

                                              {breathPattern === 'custom' && (
                                                  <div className="grid grid-cols-4 gap-2 text-center">
                                                      <div>
                                                          <label className="block text-[10px] font-bold text-sky-700 mb-1">In</label>
                                                          <input type="number" min="0" value={customPattern[0]} onChange={(e) => handleCustomChange(0, parseInt(e.target.value)||0)} className="w-full text-center text-xs rounded border-sky-200 p-1" />
                                                      </div>
                                                      <div>
                                                          <label className="block text-[10px] font-bold text-sky-700 mb-1">Hold</label>
                                                          <input type="number" min="0" value={customPattern[1]} onChange={(e) => handleCustomChange(1, parseInt(e.target.value)||0)} className="w-full text-center text-xs rounded border-sky-200 p-1" />
                                                      </div>
                                                      <div>
                                                          <label className="block text-[10px] font-bold text-sky-700 mb-1">Out</label>
                                                          <input type="number" min="0" value={customPattern[2]} onChange={(e) => handleCustomChange(2, parseInt(e.target.value)||0)} className="w-full text-center text-xs rounded border-sky-200 p-1" />
                                                      </div>
                                                      <div>
                                                          <label className="block text-[10px] font-bold text-sky-700 mb-1">Hold</label>
                                                          <input type="number" min="0" value={customPattern[3]} onChange={(e) => handleCustomChange(3, parseInt(e.target.value)||0)} className="w-full text-center text-xs rounded border-sky-200 p-1" />
                                                      </div>
                                                  </div>
                                              )}
                                         </div>
                                    )}
                                </div>
                            )}
                            
                            {/* THE ORGANIC HALO ENGINE */}
                            <div className="flex flex-col items-center gap-8">
                                <div className="relative flex items-center justify-center w-56 h-56 flex-shrink-0 mt-4 mb-4">
                                     {/* Base layer glow */}
                                     <div 
                                         className="absolute inset-0 bg-sky-200/40 organic-halo shadow-[0_0_40px_rgba(56,189,248,0.3)]"
                                         style={{ 
                                             transform: `scale(${visualState.scale})`,
                                             transitionDuration: `${visualState.duration}s`
                                         }}
                                     ></div>
                                     {/* Inner core layer */}
                                     <div 
                                         className="absolute inset-6 bg-sky-300/30 organic-halo"
                                         style={{ 
                                             transform: `scale(${visualState.scale})`,
                                             transitionDuration: `${visualState.duration}s`,
                                             animationDirection: 'reverse',
                                             animationDuration: '11s' // Desync the organic wobbles
                                         }}
                                     ></div>

                                     {/* Center Readout */}
                                     <div className="relative z-10 text-center bg-white/80 backdrop-blur-sm rounded-full w-28 h-28 flex flex-col items-center justify-center shadow-lg border border-white/50">
                                         <div className="text-3xl font-bold text-sky-900 tabular-nums">
                                             {Math.floor(breathTime / 60)}:{(breathTime % 60).toString().padStart(2, '0')}
                                         </div>
                                         <div className="text-[10px] font-bold text-sky-600 uppercase tracking-widest mt-1 min-h-[16px]">
                                             {breathPhase !== 'Idle' ? `${breathPhase} (${phaseTimeLeft}s)` : 'Ready'}
                                         </div>
                                     </div>
                                </div>

                                <div className="w-full space-y-4 relative z-20">
                                    <div className="flex gap-4">
                                        {breathActive ? (
                                            <button onClick={stopEngine} className="flex-1 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 bg-amber-100 text-amber-800 hover:bg-amber-200">
                                                <PauseIcon className="h-6 w-6" /> Stop
                                            </button>
                                        ) : (
                                            <button onClick={startEngine} className="flex-1 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 bg-sky-600 text-white hover:bg-sky-700">
                                                <PlayIcon className="h-6 w-6" /> Start Focus
                                            </button>
                                        )}
                                    </div>
                                    <textarea rows={2} placeholder="Reflection on session..." value={breathNote} onChange={(e) => setBreathNote(e.target.value)} className="w-full text-sm rounded-xl border-gray-200 bg-gray-50 resize-none focus:ring-sky-500 focus:border-sky-500" />
                                    <button onClick={handleLogBreath} disabled={breathTime < 5 || saving} className="w-full py-3 bg-sky-50 text-sky-700 hover:bg-sky-100 font-bold rounded-xl transition-colors flex justify-center items-center gap-2 disabled:opacity-50">
                                        {saving ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <SparklesIcon className="h-5 w-5" />} Log Session
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
'''

def write_file(relative_path, content):
    absolute_path = os.path.join(PROJECT_ROOT, relative_path)
    dirname = os.path.dirname(absolute_path)
    
    if dirname: 
        os.makedirs(dirname, exist_ok=True)
        
    # Safely replace FENCE
    final_content = content.replace("__FENCE__", FENCE).strip() + "\n"
    
    with open(absolute_path, "w", encoding="utf-8") as f:
        f.write(final_content)
    print(f"✅ Surgically patched: {absolute_path}")

if __name__ == "__main__":
    write_file("src/pages/Vitality.tsx", vitality_content)
    print("✨ SRE Fix Complete: Unused catch bindings removed safely.")