import { useMemo, useRef, useState } from 'react';
import { Timestamp } from 'firebase/firestore';
import { CalendarDaysIcon, ShareIcon, BanknotesIcon } from '@heroicons/react/24/outline';
import { calculateSobrietyDuration } from '../lib/dateUtils';
import { calculateSavings } from '../lib/financial';
import { getMilestone, getMilestoneLabel } from '../lib/milestones';
import { toPng } from 'html-to-image';
import type { UserProfile } from '../lib/db';
import { Link } from 'react-router-dom';

interface SobrietyHeroProps {
    date?: Timestamp | Date | null;
    levelData?: {
        level: number;
        currentXP: number;
        nextLevelXP: number;
        progressPercent: number;
    };
    archetype?: string;
    userProfile?: UserProfile | null;
}

export default function SobrietyHero({ date, levelData, archetype, userProfile }: SobrietyHeroProps) {
    const heroRef = useRef<HTMLDivElement>(null);
    const [isExporting, setIsExporting] = useState(false);

    // Calculate Time Stats
    const stats = useMemo(() => {
        if (!date) return null;
        const startDate = date instanceof Date ? date : date.toDate();
        return calculateSobrietyDuration(startDate);
    }, [date]);

    // Calculate Financial Savings
    const totalSaved = useMemo(() => {
        if (!userProfile?.substanceCost || !stats) return null;
        return calculateSavings(userProfile.substanceCost, userProfile.costFrequency, stats.totalDays);
    }, [userProfile, stats]);

    const activeMilestone = stats ? getMilestone(stats.totalDays) : null;
    const activeMilestoneLabel = stats ? getMilestoneLabel(stats.totalDays) : '';

    const handleShare = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!heroRef.current) return;
        try {
            setIsExporting(true);
            // Allow React to flush the state change and DOM resize before snapshot
            await new Promise(resolve => setTimeout(resolve, 150));
            
            const dataUrl = await toPng(heroRef.current, { cacheBust: true, pixelRatio: 2 });
            const blob = await (await fetch(dataUrl)).blob();
            const file = new File([blob], 'mrt-milestone.png', { type: 'image/png' });

            if (navigator.share && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: 'My Recovery Milestone',
                    text: 'Tracking my journey with My Recovery Toolkit. 🛡️',
                    files: [file]
                });
            } else {
                const link = document.createElement('a');
                link.download = 'mrt-milestone.png';
                link.href = dataUrl;
                link.click();
            }
        } catch (err) {
            console.error('Failed to share image', err);
        } finally {
            setIsExporting(false);
        }
    };

    if (!stats) {
        return (
            <div className="bg-gradient-to-br from-amber-400 via-orange-400 to-yellow-500 rounded-3xl p-4 text-center text-white shadow-xl shadow-orange-500/20 border border-white/20">
                <div className="opacity-90 mb-1.5 font-bold uppercase tracking-widest text-xs drop-shadow-sm">Begin the Journey</div>
                <p className="text-sm font-medium drop-shadow-sm">Set your sobriety date in Profile to track your freedom.</p>
            </div>
        );
    }

    return (
        <div 
            ref={heroRef} 
            className={`bg-gradient-to-br from-amber-400 via-orange-400 to-yellow-500 rounded-3xl p-4 text-white shadow-xl shadow-orange-500/20 relative overflow-hidden group border border-white/20 w-full ${isExporting ? 'aspect-square p-6 sm:p-8 transition-none' : ''}`}
        >
            {/* Share Button (Hidden during export to keep it clean) */}
            {!isExporting && (
                <button
                    onClick={handleShare}
                    className={`absolute top-3 right-3 z-20 p-2 rounded-full backdrop-blur-sm transition-all ${
                        activeMilestone 
                            ? 'bg-white text-orange-500 animate-pulse shadow-[0_0_20px_rgba(255,255,255,0.6)] opacity-100' 
                            : 'bg-white/20 hover:bg-white/30 text-white opacity-100 sm:opacity-0 sm:group-hover:opacity-100'
                    }`}
                    title="Share Milestone"
                >
                    <ShareIcon className="h-4 w-4" />
                </button>
            )}

            {/* Dynamic Background Texture */}
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
            {/* Decorative Glow */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-yellow-300 opacity-20 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-1000"></div>

            <div className="relative z-10 flex flex-col h-full justify-between">
                
                {/* VIRAL WATERMARK (HEADER) */}
                {isExporting && (
                    <div className="flex flex-col items-center justify-start pb-4 animate-fadeIn">
                        <div className="bg-white p-2.5 rounded-2xl shadow-xl mb-3">
                            <img 
                                src="/pwa-192x192.png" 
                                alt="MRT Logo" 
                                className="h-10 w-10 object-contain" 
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                        </div>
                        <h2 className="text-2xl font-black tracking-tight drop-shadow-md">My Recovery Toolkit</h2>
                    </div>
                )}

                {/* Content Wrapper (Centers vertically during export) */}
                <div className={`w-full flex flex-col ${isExporting ? 'flex-1 justify-center' : ''}`}>
                    {/* Main Counters */}
                    <div className="grid grid-cols-3 gap-1 text-center divide-x divide-white/30 pt-2">
                        <div className="px-1">
                            <div className="text-3xl sm:text-5xl font-black tracking-tight drop-shadow-md leading-none">{stats.years}</div>
                            <div className="text-[10px] sm:text-xs font-bold uppercase opacity-90 mt-0.5 drop-shadow-sm">Years</div>
                        </div>
                        <div className="px-1">
                            <div className="text-3xl sm:text-5xl font-black tracking-tight drop-shadow-md leading-none">{stats.months}</div>
                            <div className="text-[10px] sm:text-xs font-bold uppercase opacity-90 mt-0.5 drop-shadow-sm">Months</div>
                        </div>
                        <div className="px-1">
                            <div className="text-3xl sm:text-5xl font-black tracking-tight drop-shadow-md leading-none">{stats.days}</div>
                            <div className="text-[10px] sm:text-xs font-bold uppercase opacity-90 mt-0.5 drop-shadow-sm">Days</div>
                        </div>
                    </div>

                    {/* DYNAMIC FOOTER: Gamification OR Milestone Banner */}
                    {activeMilestone ? (
                        <div className="mt-3 pt-3 border-t border-white/20">
                            <div className="bg-white/20 p-3 rounded-xl border border-white/30 flex items-center justify-between shadow-lg backdrop-blur-md">
                                <div className="flex flex-col">
                                    <span className="text-white font-black text-lg drop-shadow-md">🎉 {activeMilestoneLabel} Milestone!</span>
                                    <span className="text-white/90 text-[10px] font-bold uppercase tracking-wider drop-shadow-sm">Inspire someone today</span>
                                </div>
                                {!isExporting && (
                                    <div className="flex items-center gap-1 text-[10px] font-bold bg-white text-orange-500 px-3 py-1.5 rounded-full shadow-sm animate-pulse">
                                        Tap Share <ShareIcon className="h-3 w-3" />
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        levelData && archetype && (
                            <div className="mt-3 pt-3 border-t border-white/20 space-y-2.5">
                                
                                {/* Gamification Stats */}
                                <div className="flex justify-between items-end text-xs sm:text-sm font-bold uppercase tracking-widest drop-shadow-sm opacity-95 gap-2">
                                    <div className="flex items-center gap-1.5 sm:gap-2 truncate">
                                        <span className="truncate">Rank: {archetype}</span>
                                        <span className="opacity-50">|</span>
                                        <span>LVL: {levelData.level}</span>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <span className="hidden sm:inline opacity-80 mr-1.5">Progress</span>
                                        <span className="font-mono tracking-normal">{levelData.currentXP.toLocaleString()} / {levelData.nextLevelXP.toLocaleString()} XP</span>
                                    </div>
                                </div>
                                    
                                {/* Shimmer Progress Bar */}
                                <div className="relative h-2 w-full bg-black/20 rounded-full overflow-hidden shadow-inner">
                                    <div 
                                        className="h-full bg-white transition-all duration-1000 ease-out relative"
                                        style={{ width: `${levelData.progressPercent}%` }}
                                    >
                                        <div className="absolute inset-0 bg-white/50 w-full -translate-x-full animate-[shimmer_2s_infinite]"></div>
                                    </div>
                                </div>

                                {/* Metrics Row (Days & Financial) */}
                                <div className="pt-1 flex items-center justify-between text-xs sm:text-sm font-medium drop-shadow-sm opacity-90">
                                    <div className="flex items-center gap-1.5 sm:gap-2">
                                        <CalendarDaysIcon className="h-4 w-4" />
                                        <span>Total Days: <span className="font-mono font-bold text-white ml-1">{stats.totalDays.toLocaleString()}</span></span>
                                    </div>
                                    
                                    <div className="flex items-center gap-1.5 sm:gap-2">
                                        {totalSaved !== null ? (
                                            <>
                                               <BanknotesIcon className="h-4 w-4" />
                                               <span>Saved: <span className="font-mono font-bold text-emerald-100 ml-1">{userProfile?.currencySymbol || '$'}{totalSaved.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span></span>
                                            </>
                                        ) : (
                                            <Link to="/profile" className="text-white hover:text-emerald-100 flex items-center gap-1 transition-colors underline decoration-white/50 underline-offset-2">
                                                <BanknotesIcon className="h-4 w-4" /> Setup Financial Freedom
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    )}
                </div>

                {/* VIRAL WATERMARK (FOOTER) */}
                {isExporting && (
                    <div className="flex flex-col items-center justify-end pt-6 animate-fadeIn">
                        <span className="text-[10px] font-bold uppercase tracking-widest bg-black/30 px-4 py-1.5 rounded-full border border-white/20 shadow-sm">
                            myrecoverytoolkit.ca
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
