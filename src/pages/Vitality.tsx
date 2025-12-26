import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, addDoc, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import VibrantHeader from '../components/VibrantHeader';
import { 
    HeartIcon, 
    FireIcon, 
    BeakerIcon, 
    BoltIcon,    
    CheckCircleIcon,
    PlayIcon,
    PauseIcon,
    ArrowPathIcon,
    SparklesIcon 
} from '@heroicons/react/24/outline';

interface VitalityLog {
    id: string;
    tags: string[];
    createdAt: Timestamp;
}

export default function Vitality() {
    const { user } = useAuth();
    const [saving, setSaving] = useState(false);
    
    // --- DATA STATE ---
    const [todaysLogs, setTodaysLogs] = useState<VitalityLog[]>([]);
    
    // --- MOVEMENT STATE ---
    const [moveActivity, setMoveActivity] = useState('');
    const [moveDuration, setMoveDuration] = useState('');
    const [moveIntensity, setMoveIntensity] = useState('Moderate');
    const [moveNote, setMoveNote] = useState('');

    // --- NUTRITION STATE ---
    const [mealType, setMealType] = useState('Lunch');
    const [hungerType, setHungerType] = useState('Physical'); 
    const [waterCount, setWaterCount] = useState(0); 
    const [nutriNote, setNutriNote] = useState('');

    // --- BREATHWORK STATE ---
    const [breathActive, setBreathActive] = useState(false);
    const [breathPhase, setBreathPhase] = useState('Idle'); // Inhale, Hold, Exhale
    const [breathTime, setBreathTime] = useState(0); 
    const [breathNote, setBreathNote] = useState('');

    // --- 1. FETCH TODAY'S LOGS ---
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


    // --- 2. ACTIONS ---

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
            if (navigator.vibrate) navigator.vibrate(50);
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

    // --- BREATHWORK TIMER LOGIC ---
    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | undefined;
        if (breathActive) {
            interval = setInterval(() => {
                setBreathTime(prev => {
                    const next = prev + 1;
                    const cycle = next % 19; 
                    if (cycle < 4) setBreathPhase('Inhale (4s)');
                    else if (cycle < 11) setBreathPhase('Hold (7s)');
                    else setBreathPhase('Exhale (8s)');
                    return next;
                });
            }, 1000);
        } else {
            setBreathPhase('Idle');
        }
        return () => clearInterval(interval);
    }, [breathActive]);

    const toggleBreath = () => setBreathActive(!breathActive);
    
    const handleLogBreath = async () => {
        const mins = Math.floor(breathTime / 60);
        const secs = breathTime % 60;
        const details = `*Session Duration:* ${mins}m ${secs}s\n*Technique:* 4-7-8 Relaxing Breath`;
        
        await saveVitalityEntry('Mindfulness', 'Breathwork Session 🌬️', details, breathNote, ['Meditation']);
        
        setBreathTime(0);
        setBreathNote('');
        setBreathActive(false);
    };

    return (
        <div className="pb-24 relative min-h-screen bg-gray-50/50">
            
            {/* VIBRANT HEADER (CENTERED) */}
            <VibrantHeader 
                title="Vitality & Health"
                subtitle={new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                icon={HeartIcon}
                fromColor="from-rose-600"
                viaColor="via-orange-600"
                toColor="to-amber-500"
                percentage={bioBalance}
                percentageColor="#f59e0b" // Amber for the ring
            />

            {/* --- MAIN GRID --- */}
            <div className="max-w-4xl mx-auto px-4 -mt-10 relative z-30 space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* 1. MOVEMENT CARD */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative group hover:shadow-md transition-all">
                        {/* Accent Bar */}
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-orange-400 to-red-500"></div>
                        
                        <div className="p-6">
                            <div className="flex items-center gap-2 mb-6">
                                <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
                                    <FireIcon className="h-6 w-6" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">Movement</h3>
                            </div>

                            <form onSubmit={handleLogMovement} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Activity</label>
                                        <input 
                                            type="text" 
                                            placeholder="e.g. Walk" 
                                            value={moveActivity}
                                            onChange={(e) => setMoveActivity(e.target.value)}
                                            className="w-full text-sm rounded-xl border-gray-200 focus:ring-orange-500 focus:border-orange-500 bg-gray-50"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Mins</label>
                                        <input 
                                            type="number" 
                                            placeholder="30" 
                                            value={moveDuration}
                                            onChange={(e) => setMoveDuration(e.target.value)}
                                            className="w-full text-sm rounded-xl border-gray-200 focus:ring-orange-500 focus:border-orange-500 bg-gray-50"
                                            required
                                        />
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Intensity</label>
                                    <div className="flex gap-2">
                                        {['Low', 'Moderate', 'High'].map(lvl => (
                                            <button
                                                key={lvl}
                                                type="button"
                                                onClick={() => setMoveIntensity(lvl)}
                                                className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-all ${
                                                    moveIntensity === lvl 
                                                    ? 'bg-orange-100 border-orange-200 text-orange-700' 
                                                    : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                                                }`}
                                            >
                                                {lvl}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <textarea 
                                        rows={2}
                                        placeholder="Body check-in: How do you feel?"
                                        value={moveNote}
                                        onChange={(e) => setMoveNote(e.target.value)}
                                        className="w-full text-sm rounded-xl border-gray-200 focus:ring-orange-500 focus:border-orange-500 bg-gray-50 resize-none"
                                    />
                                </div>

                                <button 
                                    type="submit" 
                                    disabled={saving}
                                    className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 flex justify-center items-center gap-2"
                                >
                                    {saving ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <CheckCircleIcon className="h-5 w-5" />}
                                    Log Movement
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* 2. NUTRITION CARD */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative group hover:shadow-md transition-all">
                        {/* Accent Bar */}
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-emerald-400 to-green-600"></div>

                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                                        <BeakerIcon className="h-6 w-6" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900">Fuel</h3>
                                </div>
                                {/* Water Widget */}
                                <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                                    <button onClick={() => setWaterCount(Math.max(0, waterCount - 1))} className="text-blue-400 hover:text-blue-600 font-bold">-</button>
                                    <span className="text-sm font-bold text-blue-700 w-4 text-center">{waterCount}</span>
                                    <button onClick={() => setWaterCount(waterCount + 1)} className="text-blue-400 hover:text-blue-600 font-bold">+</button>
                                    <span className="text-[10px] text-blue-400 uppercase font-bold">H2O</span>
                                </div>
                            </div>

                            <form onSubmit={handleLogNutrition} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Meal</label>
                                        <select 
                                            value={mealType}
                                            onChange={(e) => setMealType(e.target.value)}
                                            className="w-full text-sm rounded-xl border-gray-200 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50"
                                        >
                                            <option>Breakfast</option>
                                            <option>Lunch</option>
                                            <option>Dinner</option>
                                            <option>Snack</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Hunger</label>
                                        <select 
                                            value={hungerType}
                                            onChange={(e) => setHungerType(e.target.value)}
                                            className="w-full text-sm rounded-xl border-gray-200 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50"
                                        >
                                            <option>Physical</option>
                                            <option>Emotional</option>
                                            <option>Boredom</option>
                                            <option>Habit</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <textarea 
                                        rows={2}
                                        placeholder="Mindful eating check: Was I present?"
                                        value={nutriNote}
                                        onChange={(e) => setNutriNote(e.target.value)}
                                        className="w-full text-sm rounded-xl border-gray-200 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50 resize-none"
                                    />
                                </div>

                                <button 
                                    type="submit" 
                                    disabled={saving}
                                    className="w-full py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 flex justify-center items-center gap-2"
                                >
                                    {saving ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <CheckCircleIcon className="h-5 w-5" />}
                                    Log Fuel
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* 3. BREATHWORK CARD */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative group hover:shadow-md transition-all md:col-span-2">
                        {/* Accent Bar */}
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-sky-400 to-blue-600"></div>

                        <div className="p-6">
                            <div className="flex items-center gap-2 mb-6">
                                <div className="p-2 bg-sky-50 rounded-lg text-sky-600">
                                    <BoltIcon className="h-6 w-6" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">Regulation & Breath</h3>
                            </div>
                            
                            <div className="flex flex-col md:flex-row items-center gap-8">
                                {/* Visualizer */}
                                <div className="relative flex items-center justify-center w-48 h-48 flex-shrink-0">
                                     <div className={`absolute inset-0 bg-sky-100 rounded-full transition-all duration-[4000ms] ease-in-out ${breathPhase.includes('Inhale') ? 'scale-100 opacity-100' : breathPhase.includes('Hold') ? 'scale-100 opacity-80' : 'scale-50 opacity-50'}`}></div>
                                     <div className="relative z-10 text-center">
                                         <div className="text-3xl font-bold text-sky-900 tabular-nums">
                                             {Math.floor(breathTime / 60)}:{(breathTime % 60).toString().padStart(2, '0')}
                                         </div>
                                         <div className="text-xs font-bold text-sky-600 uppercase tracking-widest mt-1">{breathPhase}</div>
                                     </div>
                                </div>

                                {/* Controls & Note */}
                                <div className="flex-1 w-full space-y-5">
                                    <div className="flex gap-4">
                                        <button 
                                            onClick={toggleBreath}
                                            className={`flex-1 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 ${breathActive ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' : 'bg-sky-600 text-white hover:bg-sky-700'}`}
                                        >
                                            {breathActive ? <><PauseIcon className="h-6 w-6" /> Pause</> : <><PlayIcon className="h-6 w-6" /> Start</>}
                                        </button>
                                        <button 
                                            onClick={() => { setBreathActive(false); setBreathTime(0); setBreathPhase('Idle'); }}
                                            className="px-5 rounded-xl border-2 border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
                                        >
                                            <ArrowPathIcon className="h-6 w-6" />
                                        </button>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Reflection</label>
                                        <textarea 
                                            rows={2}
                                            placeholder="What is the quality of your mind right now?"
                                            value={breathNote}
                                            onChange={(e) => setBreathNote(e.target.value)}
                                            className="w-full text-sm rounded-xl border-gray-200 focus:ring-sky-500 focus:border-sky-500 bg-gray-50"
                                        />
                                    </div>

                                    <button 
                                        onClick={handleLogBreath}
                                        disabled={breathTime < 5 || saving}
                                        className="w-full py-3 bg-sky-50 text-sky-700 hover:bg-sky-100 font-bold rounded-xl transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
                                    >
                                        {saving ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <SparklesIcon className="h-5 w-5" />}
                                        Complete Session
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}