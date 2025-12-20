import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { 
    HeartIcon, 
    FireIcon, 
    BeakerIcon, // For Nutrition/Water
    BoltIcon,   // For Energy
    //ClockIcon,
    CheckCircleIcon,
    PlayIcon,
    PauseIcon,
    ArrowPathIcon
} from '@heroicons/react/24/outline';

export default function Vitality() {
    const { user } = useAuth();
    const [saving, setSaving] = useState(false);
    
    // --- MOVEMENT STATE ---
    const [moveActivity, setMoveActivity] = useState('');
    const [moveDuration, setMoveDuration] = useState('');
    const [moveIntensity, setMoveIntensity] = useState('Moderate');
    const [moveNote, setMoveNote] = useState('');

    // --- NUTRITION STATE ---
    const [mealType, setMealType] = useState('Lunch');
    const [hungerType, setHungerType] = useState('Physical'); // vs Emotional
    const [waterCount, setWaterCount] = useState(0); // Just a daily counter visual
    const [nutriNote, setNutriNote] = useState('');

    // --- BREATHWORK STATE ---
    const [breathActive, setBreathActive] = useState(false);
    const [breathPhase, setBreathPhase] = useState('Idle'); // Inhale, Hold, Exhale
    const [breathTime, setBreathTime] = useState(0); // Seconds elapsed
    const [breathNote, setBreathNote] = useState('');

    // --- ACTIONS ---

    const saveVitalityEntry = async (category: string, title: string, contentDetails: string, note: string, tags: string[]) => {
        if (!user || !db) return;
        setSaving(true);

        const fullContent = `**${title}**\n${contentDetails}\n\n**Somatic Check-in:**\n${note || "No specific notes recorded."}`;

        try {
            await addDoc(collection(db, 'journals'), {
                uid: user.uid,
                content: fullContent,
                moodScore: 5, // Default neutral, or we could add a slider
                tags: ['Vitality', category, ...tags],
                sentiment: 'Pending',
                createdAt: Timestamp.now()
            });
            alert(`${category} Log Saved to Journal!`);
            // Reset specific fields handled by callers
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
        
        const details = `*Meal:* ${mealType}\n*Hunger Type:* ${hungerType}`;
        await saveVitalityEntry('Nutrition', 'Fuel Log 🍎', details, nutriNote, [mealType]);
        
        setNutriNote('');
    };

    // --- BREATHWORK TIMER LOGIC ---
    useEffect(() => {
        let interval: any;
        if (breathActive) {
            interval = setInterval(() => {
                setBreathTime(prev => {
                    const next = prev + 1;
                    // Simple 4-7-8 Cycle (19s total) for visual phase
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
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <HeartIcon className="h-8 w-8 text-rose-500" />
                Vitality & Somatic Health
            </h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* 1. MOVEMENT CARD */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center gap-2 mb-4 text-orange-600 font-bold uppercase tracking-wide text-sm">
                        <FireIcon className="h-5 w-5" /> Movement
                    </div>
                    <form onSubmit={handleLogMovement} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Activity</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. Gym, Walk" 
                                    value={moveActivity}
                                    onChange={(e) => setMoveActivity(e.target.value)}
                                    className="w-full text-sm rounded-lg border-gray-300"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Duration (min)</label>
                                <input 
                                    type="number" 
                                    placeholder="30" 
                                    value={moveDuration}
                                    onChange={(e) => setMoveDuration(e.target.value)}
                                    className="w-full text-sm rounded-lg border-gray-300"
                                    required
                                />
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Intensity</label>
                            <select 
                                value={moveIntensity}
                                onChange={(e) => setMoveIntensity(e.target.value)}
                                className="w-full text-sm rounded-lg border-gray-300"
                            >
                                <option>Low (Restorative)</option>
                                <option>Moderate (Steady)</option>
                                <option>High (Intense)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Somatic Check-In</label>
                            <textarea 
                                rows={2}
                                placeholder="How did this feel in your body? Did it shift your mood?"
                                value={moveNote}
                                onChange={(e) => setMoveNote(e.target.value)}
                                className="w-full text-sm rounded-lg border-gray-300"
                            />
                        </div>

                        <button 
                            type="submit" 
                            disabled={saving}
                            className="w-full py-2 bg-orange-50 text-orange-600 hover:bg-orange-100 font-semibold rounded-lg transition-colors flex justify-center items-center gap-2"
                        >
                            <CheckCircleIcon className="h-5 w-5" />
                            Log Movement
                        </button>
                    </form>
                </div>

                {/* 2. NUTRITION CARD */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center gap-2 mb-4 text-green-600 font-bold uppercase tracking-wide text-sm">
                        <BeakerIcon className="h-5 w-5" /> Fuel & Hydration
                    </div>
                    
                    {/* Water Widget */}
                    <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg mb-4 border border-blue-100">
                        <span className="text-sm font-medium text-blue-800">Hydration</span>
                        <div className="flex items-center gap-2">
                             <button onClick={() => setWaterCount(Math.max(0, waterCount - 1))} className="p-1 hover:bg-blue-100 rounded">-</button>
                             <span className="text-xl font-bold text-blue-600">{waterCount}</span>
                             <button onClick={() => setWaterCount(waterCount + 1)} className="p-1 hover:bg-blue-100 rounded">+</button>
                             <span className="text-xs text-blue-400">glasses</span>
                        </div>
                    </div>

                    <form onSubmit={handleLogNutrition} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Meal</label>
                                <select 
                                    value={mealType}
                                    onChange={(e) => setMealType(e.target.value)}
                                    className="w-full text-sm rounded-lg border-gray-300"
                                >
                                    <option>Breakfast</option>
                                    <option>Lunch</option>
                                    <option>Dinner</option>
                                    <option>Snack</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Hunger Source</label>
                                <select 
                                    value={hungerType}
                                    onChange={(e) => setHungerType(e.target.value)}
                                    className="w-full text-sm rounded-lg border-gray-300"
                                >
                                    <option>Physical (Need Fuel)</option>
                                    <option>Emotional (Comfort)</option>
                                    <option>Boredom</option>
                                    <option>Clock (Habit)</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Mindful Eating Note</label>
                            <textarea 
                                rows={2}
                                placeholder="Did you eat mindfully? How satisfied are you?"
                                value={nutriNote}
                                onChange={(e) => setNutriNote(e.target.value)}
                                className="w-full text-sm rounded-lg border-gray-300"
                            />
                        </div>

                        <button 
                            type="submit" 
                            disabled={saving}
                            className="w-full py-2 bg-green-50 text-green-600 hover:bg-green-100 font-semibold rounded-lg transition-colors flex justify-center items-center gap-2"
                        >
                            <CheckCircleIcon className="h-5 w-5" />
                            Log Fuel
                        </button>
                    </form>
                </div>

                {/* 3. BREATHWORK CARD */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:col-span-2">
                    <div className="flex items-center gap-2 mb-4 text-sky-600 font-bold uppercase tracking-wide text-sm">
                        <BoltIcon className="h-5 w-5" /> Breath & Regulation
                    </div>
                    
                    <div className="flex flex-col md:flex-row items-center gap-8">
                        {/* Visualizer */}
                        <div className="relative flex items-center justify-center w-40 h-40">
                             <div className={`absolute inset-0 bg-sky-100 rounded-full transition-all duration-[4000ms] ease-in-out ${breathPhase.includes('Inhale') ? 'scale-100 opacity-100' : breathPhase.includes('Hold') ? 'scale-100 opacity-80' : 'scale-50 opacity-50'}`}></div>
                             <div className="relative z-10 text-center">
                                 <div className="text-2xl font-bold text-sky-800">
                                     {Math.floor(breathTime / 60)}:{(breathTime % 60).toString().padStart(2, '0')}
                                 </div>
                                 <div className="text-xs font-medium text-sky-600 uppercase tracking-wider mt-1">{breathPhase}</div>
                             </div>
                        </div>

                        {/* Controls & Note */}
                        <div className="flex-1 w-full space-y-4">
                            <div className="flex gap-4">
                                <button 
                                    onClick={toggleBreath}
                                    className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors ${breathActive ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-sky-600 text-white hover:bg-sky-700'}`}
                                >
                                    {breathActive ? <><PauseIcon className="h-5 w-5" /> Pause</> : <><PlayIcon className="h-5 w-5" /> Start Breathing</>}
                                </button>
                                <button 
                                    onClick={() => { setBreathActive(false); setBreathTime(0); setBreathPhase('Idle'); }}
                                    className="px-4 rounded-xl border border-gray-300 text-gray-500 hover:bg-gray-50"
                                >
                                    <ArrowPathIcon className="h-5 w-5" />
                                </button>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Post-Session Reflection</label>
                                <textarea 
                                    rows={2}
                                    placeholder="What is the quality of your mind right now?"
                                    value={breathNote}
                                    onChange={(e) => setBreathNote(e.target.value)}
                                    className="w-full text-sm rounded-lg border-gray-300"
                                />
                            </div>

                            <button 
                                onClick={handleLogBreath}
                                disabled={breathTime < 5 || saving}
                                className="w-full py-2 bg-sky-50 text-sky-600 hover:bg-sky-100 font-semibold rounded-lg transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
                            >
                                <CheckCircleIcon className="h-5 w-5" />
                                Log Session to Journal
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

// ---