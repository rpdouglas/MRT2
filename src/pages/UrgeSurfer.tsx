import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useJournalOperations } from '../hooks/useJournalOperations';
import { useEncryption } from '../contexts/EncryptionContext';
import { useWakeLock } from '../hooks/useWakeLock';
import { useQueryClient } from '@tanstack/react-query';
import { inferMoodFromRecentEntries, type MoodCacheEntry } from '../lib/vitalityScoring';
import VibrantHeader from '../components/VibrantHeader';
import { 
    PuzzlePieceIcon, 
    PlayIcon, 
    ArrowPathIcon,
    CheckCircleIcon,
    ShieldExclamationIcon,
    EyeIcon,
    HandRaisedIcon,
    SpeakerWaveIcon,
    SparklesIcon,
    FaceSmileIcon
} from '@heroicons/react/24/outline';

const SURF_DURATION_SECONDS = 300; // 5 minutes

export default function UrgeSurfer() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { addJournal } = useJournalOperations();
    const { encrypt, isVaultUnlocked } = useEncryption();
    const { requestWakeLock, releaseWakeLock } = useWakeLock();
    const queryClient = useQueryClient();

    const [status, setStatus] = useState<'idle' | 'surfing' | 'completed'>('idle');
    const [timeLeft, setTimeLeft] = useState(SURF_DURATION_SECONDS);
    const [reflection, setReflection] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // --- SMART MOOD INFERENCE ---
    const getSmartMood = () => {
        if (!user) return 5;
        const cache = queryClient.getQueryData<MoodCacheEntry[]>(['journals', user.uid]);
        return inferMoodFromRecentEntries(cache ?? []);
    };

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            releaseWakeLock();
        };
    }, [releaseWakeLock]);

    const startSurfing = () => {
        setStatus('surfing');
        setTimeLeft(SURF_DURATION_SECONDS);
        requestWakeLock();

        if (timerRef.current) clearInterval(timerRef.current);
        
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    if (timerRef.current) clearInterval(timerRef.current);
                    setStatus('completed');
                    releaseWakeLock();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handleSave = async () => {
        if (!user) return;
        setIsSaving(true);
        
        const plainContent = `**Urge Surfing Completed**\n\n*Reflection:*\n${reflection || "No reflection provided. But I rode the wave."}`;
        
        let contentToSave = plainContent;
        let isEncrypted = false;
        
        // Security Fallback: If David uses this during a crisis while locked, we save in plain text 
        // to prioritize his mental health recording over strict encryption.
        if (isVaultUnlocked) {
            try {
                contentToSave = await encrypt(plainContent);
                isEncrypted = true;
            } catch (err) {
                console.warn("Failed to encrypt during crisis log", err);
                contentToSave = `[Saved unencrypted during crisis]\n${plainContent}`;
            }
        } else {
            contentToSave = `[Saved unencrypted during crisis]\n${plainContent}`;
        }

        try {
            await addJournal({
                content: contentToSave,
                moodScore: getSmartMood(),
                sentiment: 'Pending',
                weather: null,
                tags: ['Urge Surfer', 'Crisis Avoided', 'Vitality'],
                isEncrypted
            });
            navigate('/dashboard');
        } catch (error) {
            console.error("Save failed", error);
            alert("Failed to save log.");
        } finally {
            setIsSaving(false);
        }
    };

    // Calculate dynamic phase
    const getPhase = () => {
        if (timeLeft > 240) return { title: 'Find 5 things you can see', desc: 'Look around you. Notice the colors, shadows, and shapes.', icon: EyeIcon, color: 'text-sky-400' };
        if (timeLeft > 180) return { title: 'Find 4 things you can touch', desc: 'Notice the texture of your clothes, the chair, or the floor.', icon: HandRaisedIcon, color: 'text-indigo-400' };
        if (timeLeft > 120) return { title: 'Find 3 things you can hear', desc: 'Listen closely. Traffic? A hum? Your own breath?', icon: SpeakerWaveIcon, color: 'text-violet-400' };
        if (timeLeft > 60) return { title: 'Find 2 things you can smell', desc: 'Take a deep breath through your nose. What do you notice?', icon: SparklesIcon, color: 'text-purple-400' };
        return { title: 'Find 1 thing you can taste', desc: 'Focus on the physical sensation in your mouth right now.', icon: FaceSmileIcon, color: 'text-fuchsia-400' };
    };

    const phase = getPhase();
    const progressPercent = ((SURF_DURATION_SECONDS - timeLeft) / SURF_DURATION_SECONDS) * 100;

    return (
        <div className="min-h-screen flex flex-col bg-slate-900 text-white font-sans selection:bg-indigo-500/30 relative overflow-hidden">
            
            {/* Background Atmosphere */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none"></div>
            
            <div className="flex-shrink-0 z-10">
                <VibrantHeader 
                    title="Urge Surfer" 
                    subtitle="5-4-3-2-1 Grounding" 
                    icon={PuzzlePieceIcon}
                    fromColor="from-slate-800/50"
                    viaColor="via-indigo-900/50"
                    toColor="to-slate-900/50"
                    backLink="/dashboard"
                />
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-20 w-full max-w-md mx-auto -mt-12">
                
                {status === 'idle' && (
                    <div className="text-center animate-fadeIn space-y-8">
                        <div className="bg-indigo-500/20 p-6 rounded-full inline-block border border-indigo-400/30 shadow-lg shadow-indigo-500/20">
                            <ShieldExclamationIcon className="h-16 w-16 text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black mb-3 text-white tracking-tight">Ride the Wave</h2>
                            <p className="text-indigo-200 text-sm leading-relaxed px-4">
                                Cravings are like ocean waves. They build, peak, and inevitably crash. They do not last forever. Let's ride this one out together for 5 minutes using the 5-4-3-2-1 grounding technique.
                            </p>
                        </div>
                        <button 
                            onClick={startSurfing}
                            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-xl shadow-indigo-600/30 transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            <PlayIcon className="h-6 w-6" /> Begin Surfing
                        </button>
                    </div>
                )}

                {status === 'surfing' && (
                    <div className="w-full text-center animate-fadeIn flex flex-col items-center justify-center h-full space-y-12">
                        
                        <div className="relative flex items-center justify-center">
                            {/* Glowing Ring */}
                            <svg className="w-64 h-64 transform -rotate-90">
                                <circle cx="128" cy="128" r="120" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-700" />
                                <circle 
                                    cx="128" cy="128" r="120" 
                                    stroke="currentColor" strokeWidth="6" fill="transparent" 
                                    className="text-indigo-500 transition-all duration-1000 ease-linear"
                                    strokeDasharray={2 * Math.PI * 120}
                                    strokeDashoffset={(2 * Math.PI * 120) * (1 - progressPercent / 100)}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute flex flex-col items-center">
                                <div className="text-5xl font-black text-white tabular-nums tracking-tighter">
                                    {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                                </div>
                            </div>
                        </div>

                        <div className="h-32 flex flex-col items-center justify-center transition-all duration-500">
                            <phase.icon className={`h-10 w-10 ${phase.color} mb-4 animate-bounce`} />
                            <h3 className="text-xl font-bold text-white mb-2">{phase.title}</h3>
                            <p className="text-sm text-indigo-200">{phase.desc}</p>
                        </div>

                    </div>
                )}

                {status === 'completed' && (
                    <div className="w-full animate-slideUp space-y-6">
                        <div className="text-center">
                            <div className="bg-emerald-500/20 p-4 rounded-full inline-block border border-emerald-400/30 mb-4 shadow-lg shadow-emerald-500/20">
                                <CheckCircleIcon className="h-12 w-12 text-emerald-400" />
                            </div>
                            <h2 className="text-2xl font-black text-white mb-2">The wave has passed.</h2>
                            <p className="text-emerald-100 text-sm">You stayed safe. Take a moment to reflect on how you feel now.</p>
                        </div>

                        <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50 backdrop-blur-sm">
                            <textarea 
                                value={reflection}
                                onChange={(e) => setReflection(e.target.value)}
                                placeholder="My craving intensity right now is..."
                                rows={4}
                                className="w-full bg-transparent border-none text-white placeholder:text-slate-500 focus:ring-0 resize-none text-sm"
                            />
                        </div>

                        <button 
                            onClick={handleSave}
                            disabled={isSaving}
                            className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl shadow-xl shadow-emerald-600/30 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isSaving ? <ArrowPathIcon className="h-6 w-6 animate-spin" /> : <CheckCircleIcon className="h-6 w-6" />}
                            Log Victory & Save
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
}
