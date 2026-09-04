import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import VibrantHeader from '../VibrantHeader';
import { FireIcon, CheckCircleIcon, ArrowLeftIcon, ShieldExclamationIcon } from '@heroicons/react/24/outline';

interface Ember { id: number; left: number; delay: number; duration: number; drift: string; }

export default function ResentmentBurner() {
    const navigate = useNavigate();
    const [text, setText] = useState('');
    const [isBurning, setIsBurning] = useState(false);
    const [isBurned, setIsBurned] = useState(false);
    const [burnProgress, setBurnProgress] = useState(0);
    const [embers, setEmbers] = useState<Ember[]>([]);

    useEffect(() => {
        if (isBurning) {
            let start: number;
            let animationFrame: number;
            const duration = 2800; // 2.8 seconds

            const step = (timestamp: number) => {
                if (!start) start = timestamp;
                const elapsed = timestamp - start;
                const progress = Math.min(elapsed / duration, 1);
                
                const easeIn = progress * progress * progress;
                setBurnProgress(easeIn);

                if (progress < 1) {
                    animationFrame = requestAnimationFrame(step);
                } else {
                    setIsBurning(false);
                    setIsBurned(true);
                    setText(''); 
                    setEmbers([]);
                    setBurnProgress(0);
                }
            };

            animationFrame = requestAnimationFrame(step);
            return () => cancelAnimationFrame(animationFrame);
        }
    }, [isBurning]);

    const handleBurn = () => {
        if (!text.trim()) return;
        
        const newEmbers = Array.from({ length: 30 }).map((_, i) => ({
            id: i,
            left: Math.random() * 100,
            delay: Math.random() * 1.5,
            duration: 1 + Math.random(),
            drift: `${(Math.random() - 0.5) * 60}px`
        }));
        
        setEmbers(newEmbers);
        setIsBurning(true);
    };

    const handleReset = () => { setIsBurned(false); setText(''); setEmbers([]); };

    const scaleAmount = 1 - (burnProgress * 0.15);

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col font-sans selection:bg-rose-500/30 overflow-hidden">
            
            <svg width="0" height="0" className="absolute pointer-events-none">
                <filter id="combustion-filter" x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
                    <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="4" seed="5" result="noise" />
                    <feDisplacementMap 
                        in="SourceGraphic" 
                        in2="noise" 
                        scale={burnProgress * 200} 
                        xChannelSelector="R" 
                        yChannelSelector="G" 
                        result="displacedPaper" 
                    />
                    <feColorMatrix 
                        type="matrix" 
                        values={`
                            1 0 0 0 0
                            0 ${1 - burnProgress} 0 0 0
                            0 0 0 0 0
                            0 0 0 ${burnProgress * 4} 0
                        `} 
                        in="noise" 
                        result="embers" 
                    />
                    <feBlend mode="screen" in="displacedPaper" in2="embers" result="burningPaper" />
                    <feComponentTransfer in="burningPaper">
                        <feFuncA type="linear" slope={1 - burnProgress} />
                    </feComponentTransfer>
                </filter>
            </svg>

            <div className="flex-shrink-0 z-10">
                {/* Deliberate exception to Vibrant Momentum's "no red" rule (design-system
                    audit 2026-09-03, TD-30): this red/rose/slate header is the tool's own
                    literal fire metaphor (burn something in effigy), not a failure/overdue
                    state — the thing the "no red" rule exists to prevent. Not module drift. */}
                <VibrantHeader
                    title="Resentment Burner"
                    subtitle="Release the toxic energy. Leave no trace."
                    icon={FireIcon}
                    fromColor="from-red-900"
                    viaColor="via-rose-900"
                    toColor="to-slate-900"
                    backLink="/tools"
                />
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 relative z-20 w-full max-w-3xl mx-auto -mt-6">
                
                {!isBurned ? (
                    <div className="w-full flex flex-col h-full max-h-[700px] animate-fadeIn">
                        
                        <div className="bg-slate-800/80 backdrop-blur-md p-4 rounded-t-3xl border border-slate-700 shadow-sm flex items-start gap-3 text-rose-200 z-10 relative">
                            <ShieldExclamationIcon className="w-6 h-6 text-rose-500 shrink-0 mt-0.5" />
                            <div className="text-sm leading-relaxed font-medium">
                                <strong>Ephemeral Safe Space:</strong> What you write here exists only on your screen. It will not sync, it will not save, and it will be permanently destroyed when you press burn. Let it out.
                            </div>
                        </div>

                        <div className="relative flex-1 flex flex-col mt-4 z-0">
                            
                            <div className={`absolute inset-0 rounded-b-3xl rounded-tr-3xl bg-zinc-900 border border-zinc-800 flex flex-col transition-all duration-[2000ms] ease-in-out ${isBurning ? 'opacity-100 scale-95' : 'opacity-0 scale-100'}`}>
                            </div>

                            <textarea
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                readOnly={isBurning}
                                rows={12}
                                placeholder="I resent..."
                                style={{
                                    filter: isBurning ? 'url(#combustion-filter)' : 'none',
                                    transform: `scale(${scaleAmount}) ${isBurning ? 'rotate(-1deg)' : 'rotate(0deg)'}`,
                                    opacity: Math.max(1 - burnProgress, 0),
                                }}
                                className={`relative z-10 w-full flex-1 rounded-b-3xl rounded-tr-3xl resize-none text-lg sm:text-xl focus:outline-none placeholder:text-slate-400 text-slate-800 notebook-paper font-serif
                                    ${!isBurning ? 'shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] border border-slate-200' : 'shadow-none border-transparent'}`}
                                // eslint-disable-next-line jsx-a11y/no-autofocus -- deliberate: the sole input of this tool's screen, matching WCAG's modal-focus-management guidance (not autofocus on ordinary page load).
                                autoFocus
                            />

                            {isBurning && (
                                <div className="absolute left-0 right-0 z-20 h-32 bg-gradient-to-t from-transparent via-rose-600 to-amber-400 blur-xl mix-blend-color-dodge animate-[fire-rise_2.5s_ease-in_forwards] pointer-events-none"></div>
                            )}

                            {isBurning && (
                                <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden rounded-3xl">
                                    {embers.map((ember) => (
                                        <div 
                                            key={ember.id} 
                                            className="absolute w-2 h-2 rounded-full blur-[1px]"
                                            style={{
                                                left: `${ember.left}%`,
                                                '--drift': ember.drift,
                                                animation: `float-ember ${ember.duration}s ease-in forwards`,
                                                animationDelay: `${ember.delay}s`
                                            } as React.CSSProperties}
                                        />
                                    ))}
                                </div>
                            )}

                        </div>

                        <div className="mt-6 pt-4 flex justify-end shrink-0 z-10 relative">
                            <button
                                onClick={handleBurn}
                                disabled={!text.trim() || isBurning}
                                className={`w-full sm:w-auto px-8 py-4 font-black text-lg rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl
                                    ${text.trim() && !isBurning
                                        ? 'bg-gradient-to-r from-orange-500 to-rose-600 text-white hover:from-orange-400 hover:to-rose-500 hover:shadow-orange-500/25 active:scale-95 cursor-pointer' 
                                        : 'bg-slate-800 text-slate-600 cursor-not-allowed'}
                                    ${isBurning ? 'opacity-90 pointer-events-none' : ''}`}
                            >
                                <FireIcon className={`h-6 w-6 ${isBurning ? 'animate-pulse text-amber-300' : ''}`} />
                                {isBurning ? 'Incinerating...' : 'Burn Resentment'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="w-full flex flex-col items-center justify-center text-center space-y-8 animate-slideUp py-12">
                        <div className="bg-slate-800/50 p-8 rounded-full border border-slate-700 shadow-2xl">
                            <CheckCircleIcon className="h-20 w-20 text-emerald-500" />
                        </div>
                        
                        <div className="space-y-3">
                            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                                It is gone.
                            </h2>
                            <p className="text-slate-400 text-lg max-w-md mx-auto leading-relaxed">
                                You have surrendered the resentment. The memory has been permanently wiped from the device.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 pt-8 w-full max-w-sm">
                            <button 
                                onClick={() => navigate('/tools')}
                                className="flex-1 py-4 bg-slate-800 text-white font-bold rounded-2xl hover:bg-slate-700 transition-colors flex items-center justify-center gap-2 border border-slate-700"
                            >
                                <ArrowLeftIcon className="h-5 w-5" /> Return to Hub
                            </button>
                            <button 
                                onClick={handleReset}
                                className="flex-1 py-4 bg-white text-slate-900 font-bold rounded-2xl hover:bg-slate-100 transition-colors flex items-center justify-center gap-2"
                            >
                                <FireIcon className="h-5 w-5 text-rose-600" /> Burn Another
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
