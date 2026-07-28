import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Timestamp } from 'firebase/firestore';
import { useUserProfile } from '../hooks/useUserProfile';
import Confetti from 'react-confetti';
import { getMilestone } from '../lib/milestones';
import VibrantHeader from '../components/VibrantHeader';
import SobrietyHero from '../components/SobrietyHero';
import NotificationBanner from '../components/NotificationBanner';
import DynamicAnchorWidget from '../components/dashboard/DynamicAnchorWidget';
import BentoCard, { type BentoTileConfig } from '../components/dashboard/BentoCard';
import { HomeIcon, FireIcon, ChartBarIcon, SparklesIcon, HeartIcon, ArrowDownTrayIcon, TrophyIcon, PuzzlePieceIcon, InformationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { THEME } from '../lib/theme';
import { RECOVERY_SLOGANS } from '../data/slogans';
import type { UserProfile } from '../lib/db';
import { useBuildInfo } from '../lib/versioning';

const BENTO_TILES: BentoTileConfig[] = [
  { to: '/journal', icon: ChartBarIcon, title: 'My Journal', moduleKey: 'journal', shadowClass: 'shadow-indigo-200', label: 'Reflect', description: "Write down what's on your mind today." },
  { to: '/tasks', icon: FireIcon, title: 'My Tasks', moduleKey: 'tasks', shadowClass: 'shadow-cyan-200', label: "Today's Routine", description: 'Check off your recovery tasks.' },
  { to: '/vitality', icon: HeartIcon, title: 'My Vitality', moduleKey: 'vitality', shadowClass: 'shadow-orange-200', label: 'Check In', description: 'Log your sleep, movement, and energy.' },
  { to: '/workbooks', icon: SparklesIcon, title: 'My Workbooks', moduleKey: 'workbooks', shadowClass: 'shadow-emerald-200', label: 'Guided Steps', description: 'Work through your recovery workbooks.' },
  { to: '/games', icon: TrophyIcon, title: 'My Games', moduleKey: 'games', shadowClass: 'shadow-violet-200', label: 'Recovery Games', description: 'Zero-knowledge, anti-shame mini-games.' },
  { to: '/tools', icon: PuzzlePieceIcon, title: 'My Tools', moduleKey: 'tools', shadowClass: 'shadow-blue-200', label: 'Active', badgeIcon: SparklesIcon, description: 'CBT & Grounding Exercises' },
];

export default function Dashboard() {
  const { driveAccessToken } = useAuth();
  const meta = useBuildInfo();
  
  // Evaluate current time purely once on mount to satisfy react-hooks/purity
  const [nowMs] = useState(() => Date.now());
  
  const [slogan] = useState(() => {
      const randomIndex = Math.floor(Math.random() * RECOVERY_SLOGANS.length);
      return RECOVERY_SLOGANS[randomIndex];
  });

  const [showChangelogToast, setShowChangelogToast] = useState(false);
  
  // Confetti State
  const [showConfetti, setShowConfetti] = useState(false);
  const [recycleConfetti, setRecycleConfetti] = useState(true);
  const [windowSize, setWindowSize] = useState({ width: typeof window !== 'undefined' ? window.innerWidth : 0, height: typeof window !== 'undefined' ? window.innerHeight : 0, });

  // Handle window resize for Confetti
  useEffect(() => { const handleResize = () => { setWindowSize({ width: window.innerWidth, height: window.innerHeight }); };
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { profile: userProfile, isLoading: profileLoading, patchFields } = useUserProfile();
  const { mutate: patchProfileFields } = patchFields;

  // Changelog Beacon Logic
  useEffect(() => {
      if (userProfile) {
          if (!userProfile.lastSeenBuildHash) {
              patchProfileFields({ lastSeenBuildHash: meta.globalHash });
          } else if (userProfile.lastSeenBuildHash !== meta.globalHash) {
              // FIX: Wrap in setTimeout to avoid synchronous setState inside useEffect
              setTimeout(() => setShowChangelogToast(true), 0);
              patchProfileFields({ lastSeenBuildHash: meta.globalHash });
          }
      }
  }, [userProfile, meta.globalHash, patchProfileFields]);

  const stats = useMemo(() => {
    if (profileLoading) return null;

    let daysClean = 0;
    if (userProfile?.sobrietyDate) {
        const start = userProfile.sobrietyDate.toDate ? userProfile.sobrietyDate.toDate() : new Date(userProfile.sobrietyDate as unknown as string);
        const diffTime = Math.abs(nowMs - start.getTime());
        daysClean = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    const lastExport = userProfile?.lastExportAt as Timestamp | undefined;
    const showBackup = !driveAccessToken && (!lastExport || lastExport.toMillis() < nowMs - (7 * 24 * 60 * 60 * 1000));

    return {
        showBackup,
        daysClean
    };
  }, [userProfile, profileLoading, driveAccessToken, nowMs]);

  // Milestone Confetti Logic
  useEffect(() => {
      if (stats?.daysClean) {
          const milestone = getMilestone(stats.daysClean);
          if (milestone) {
              const playedKey = `mrt_milestone_${stats.daysClean}_played`;
              if (!sessionStorage.getItem(playedKey)) {
                  // FIX: Wrap in setTimeout to avoid synchronous setState inside useEffect
                  setTimeout(() => setShowConfetti(true), 0);
                  sessionStorage.setItem(playedKey, 'true');
                  setTimeout(() => setRecycleConfetti(false), 5000);
                  setTimeout(() => setShowConfetti(false), 10000);
              }
          }
      }
  }, [stats?.daysClean]);

  const loading = profileLoading;

  if (loading || !stats) return <div className="p-8 text-center text-gray-500">Loading your recovery hub...</div>;

  return (
    <div className={`h-[100dvh] flex flex-col ${THEME.dashboard.page} relative`}>
      
      {/* CONFETTI LAYER */}
      {showConfetti && (
          <div className="fixed inset-0 pointer-events-none z-[100]">
              <Confetti width={windowSize.width} height={windowSize.height} recycle={recycleConfetti} numberOfPieces={400} gravity={0.15} />
          </div>
      )}

      {/* 1. FIXED HEADER */}
      <div className="flex-shrink-0 z-10">
        <VibrantHeader 
            title="My Dashboard" 
            subtitle={slogan}
            icon={HomeIcon}
            fromColor={THEME.dashboard.header.from}
            viaColor={THEME.dashboard.header.via}
            toColor={THEME.dashboard.header.to}
        />
      </div>

      {/* 2. FLOATING HERO */}
      <div className="px-4 -mt-12 relative z-30 flex-shrink-0 animate-slideUp">
         <SobrietyHero
            date={userProfile?.sobrietyDate}
            userProfile={userProfile as UserProfile}
         />
      </div>

      {/* 3. SCROLLABLE CONTENT */}
      <div className="flex-1 overflow-y-auto px-4 pt-6 pb-24 space-y-6">

        {/* PUSH NOTIFICATION OPT-IN (PROJ-26) */}
        <NotificationBanner />

        {/* CHANGELOG TOAST BEACON */}
        {showChangelogToast && (
            <div className="bg-fuchsia-50 border border-fuchsia-200 rounded-2xl p-4 flex items-center justify-between shadow-sm animate-slideDown">
                <div className="flex items-center gap-3">
                    <div className="bg-fuchsia-100 p-2 rounded-full text-fuchsia-700 shrink-0">
                        <InformationCircleIcon className="h-5 w-5" />
                    </div>
                    <div className="text-xs text-fuchsia-900 leading-tight">
                        <strong>Update Released!</strong> Tap to see what's new.
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <a href="https://rpdouglas.github.io/MRT2/support/changelog" target="_blank" rel="noopener noreferrer" className="text-xs font-bold bg-fuchsia-600 text-white px-3 py-1.5 rounded-lg hover:bg-fuchsia-700 whitespace-nowrap transition-colors">
                        View
                    </a>
                    <button onClick={() => setShowChangelogToast(false)} className="p-1 text-fuchsia-400 hover:text-fuchsia-600">
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                </div>
            </div>
        )}
        
        {/* Backup Alert */}
        {stats.showBackup && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between shadow-sm animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="bg-amber-100 p-2 rounded-full text-amber-700">
                <ArrowDownTrayIcon className="h-5 w-5" />
              </div>
              <div className="text-xs text-amber-900">
                <strong>Backup Needed:</strong> It's been a week since your last save.
              </div>
            </div>
            <Link to="/profile" className="text-xs font-bold bg-amber-600 text-white px-3 py-1.5 rounded-lg hover:bg-amber-700">Go</Link>
          </div>
        )}

        <DynamicAnchorWidget />

        {/* 6-TILE BENTO GRID */}
        <div className="grid grid-cols-2 gap-4">
            {BENTO_TILES.map(tile => <BentoCard key={tile.to} {...tile} />)}
        </div>
      </div>
    </div>
  );
}
