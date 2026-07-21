import { useMemo, useRef, useState, useEffect } from 'react';
import { Timestamp } from 'firebase/firestore';
import { CalendarDaysIcon, ShareIcon, BanknotesIcon, SparklesIcon, SwatchIcon } from '@heroicons/react/24/outline';
import { useQuery } from '@tanstack/react-query';
import { collection, query, where, orderBy, limit, getDocs, type Firestore } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { calculateSobrietyDuration } from '../lib/dateUtils';
import { calculateSavings } from '../lib/financial';
import { getMilestone, getMilestoneLabel, getMilestoneImage } from '../lib/milestones';
import type { UserProfile, HeroColorKey } from '../lib/db';
import { HERO_COLORS, getHeroColorTheme } from '../lib/heroColors';
import { useHeroColor } from '../hooks/useHeroColor';
import { useShareImage } from '../hooks/useShareImage';
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
    const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
    const { updateHeroColor } = useHeroColor();
    const { shareImage } = useShareImage();
    const heroTheme = getHeroColorTheme(userProfile?.heroColor);

    const handleSelectColor = (key: HeroColorKey) => {
        setIsColorPickerOpen(false);
        updateHeroColor.mutate(key);
    };

    const { data: latestInsight } = useQuery({
        queryKey: ['latest-insight', userProfile?.uid],
        queryFn: async () => {
            if (userProfile?.uid?.includes('mock')) {
                return { summary: "One day at a time. The horizon is bright." };
            }
            if (!userProfile?.uid || !db) return null;
            const insightsRef = collection(db as Firestore, 'insights');
            const q = query(
                insightsRef,
                where('uid', '==', userProfile.uid),
                where('type', 'in', ['journal', 'workbook']),
                orderBy('createdAt', 'desc'),
                limit(1)
            );
            const snapshot = await getDocs(q);
            if (snapshot.empty) return null;
            return snapshot.docs[0].data() as { summary: string };
        },
        enabled: !!userProfile?.uid,
        staleTime: 1000 * 60 * 5, // Cache for 5 minutes to prevent redundant reads
    });

    const displayInsight = latestInsight?.summary || "Growing stronger every day.";

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
    const activeMilestoneImage = stats ? getMilestoneImage(stats.totalDays) : null;

    // --- THE PRELOADER FIX ---
    // Forces the browser to fetch the milestone image into cache silently on mount 
    // so it renders instantly when html-to-image takes the snapshot.
    useEffect(() => { if (activeMilestoneImage) { const img = new Image(); img.src = activeMilestoneImage; }
    }, [activeMilestoneImage]);

    const handleShare = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            setIsExporting(true);
            await shareImage(heroRef, {
                filename: 'mrt-milestone.png',
                title: 'My Recovery Milestone',
                text: 'Tracking my journey with My Recovery Toolkit. 🛡️',
            });
        } finally {
            setIsExporting(false);
        }
    };

    if (!stats) {
        return (
            <div className={`${heroTheme.gradient} rounded-3xl p-4 text-center text-white ${heroTheme.shadow} border border-white/20`}>
                <div className="opacity-90 mb-1.5 font-bold uppercase tracking-widest text-xs drop-shadow-sm">Begin the Journey</div>
                <p className="text-sm font-medium drop-shadow-sm">Set your sobriety date in Profile to track your freedom.</p>
            </div>
        );
    }

    return (
        <div
            ref={heroRef}
            className={`${heroTheme.gradient} rounded-3xl p-4 text-white ${heroTheme.shadow} relative overflow-hidden group border border-white/20 w-full ${isExporting ? 'aspect-square p-6 sm:p-8 transition-none' : ''}`}
        >
            {/* Color Picker Button (Hidden during export to keep it clean) */}
            {!isExporting && (
                <div className="absolute top-3 left-3 z-20">
                    <button
                        onClick={() => setIsColorPickerOpen(open => !open)}
                        className="p-2 rounded-full backdrop-blur-sm transition-all bg-white/20 hover:bg-white/30 text-white opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                        title="Change Hero Color"
                    >
                        <SwatchIcon className="h-4 w-4" />
                    </button>

                    {isColorPickerOpen && (
                        <>
                            {/* Backdrop to catch outside taps and close the popover */}
                            <div className="fixed inset-0 z-10" onClick={() => setIsColorPickerOpen(false)} />
                            <div className="absolute top-11 left-0 z-20 flex gap-2 p-2.5 rounded-2xl bg-white shadow-xl border border-gray-200">
                                {(Object.keys(HERO_COLORS) as HeroColorKey[]).map((key) => (
                                    <button
                                        key={key}
                                        onClick={() => handleSelectColor(key)}
                                        title={HERO_COLORS[key].label}
                                        aria-label={`Use ${HERO_COLORS[key].label} theme`}
                                        className={`h-7 w-7 rounded-full ${HERO_COLORS[key].swatchClass} shadow-sm transition-transform hover:scale-110 ${
                                            (userProfile?.heroColor ?? 'amber') === key ? 'ring-2 ring-offset-2 ring-slate-400' : ''
                                        }`}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Share Button (Hidden during export to keep it clean) */}
            {!isExporting && (
                <button
                    onClick={handleShare}
                    className={`absolute top-3 right-3 z-20 p-2 rounded-full backdrop-blur-sm transition-all ${
                        activeMilestone
                            ? `bg-white ${heroTheme.accentText} animate-pulse shadow-[0_0_20px_rgba(255,255,255,0.6)] opacity-100`
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
            <div className={`absolute -top-24 -right-24 w-64 h-64 ${heroTheme.glow} opacity-20 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-1000`}></div>

            <div className="relative z-10 flex flex-col h-full justify-between">
                
                {/* VIRAL WATERMARK & MEDALLION (HEADER) */}
                {isExporting && (
                    <div className="flex flex-col items-center justify-start pb-4 animate-fadeIn">
                        {activeMilestoneImage ? (
                            <div className="mb-2 drop-shadow-2xl">
                                <img 
                                    src={activeMilestoneImage} 
                                    alt={`${activeMilestoneLabel} Milestone Medallion`} 
                                    className="h-32 w-32 object-contain" 
                                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                />
                            </div>
                        ) : (
                            <>
                                <div className="bg-white p-2.5 rounded-2xl shadow-xl mb-3">
                                    <img 
                                        src="/pwa-192x192.png" 
                                        alt="MRT Logo" 
                                        className="h-10 w-10 object-contain" 
                                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                    />
                                </div>
                                <h2 className="text-2xl font-black tracking-tight drop-shadow-md">My Recovery Toolkit</h2>
                            </>
                        )}
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
                                    <div className={`flex items-center gap-1 text-[10px] font-bold bg-white ${heroTheme.accentText} px-3 py-1.5 rounded-full shadow-sm animate-pulse`}>
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
                        <div className="flex items-start gap-2 mb-4 max-w-[90%] bg-black/10 p-3 rounded-xl border border-white/10 backdrop-blur-sm shadow-inner">
                            <SparklesIcon className="h-5 w-5 text-white/90 shrink-0 mt-0.5 animate-pulse" aria-hidden="true" />
                            <p className="text-white/90 text-sm font-medium drop-shadow-sm italic leading-snug text-left">
                                "{displayInsight}"
                            </p>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest bg-black/30 px-4 py-1.5 rounded-full border border-white/20 shadow-sm">
                            myrecoverytoolkit.ca
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
