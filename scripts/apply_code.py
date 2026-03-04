import os

FENCE = "```"

# =============================================================================
# 1. docs/ROADMAP.md
# =============================================================================
roadmap_content = r'''# 🗺️ MRT Product Roadmap

**Vision:** To build the world's most secure, persona-aware digital recovery companion.

## 📅 Q1 2026: Foundation & Security (Completed)
| Status | ID | Project Name | Owner | Impact |
| :--- | :--- | :--- | :--- | :--- |
| 🟢 **Done** | `PROJ-01` | **Security Hardening** | Admin | Critical Security Fixes |
| 🟢 **Done** | `PROJ-02` | **Task List Revamp** | Admin | High-Dopamine UX, Optimistic UI |

## 📅 Q2 2026: The "Core Polish" Phase (Completed)
| Status | ID | Project Name | Owner | Impact |
| :--- | :--- | :--- | :--- | :--- |
| 🟢 **Done** | `PROJ-03` | **Wisdom (Workbook) Polish** | Admin | Premium Reading Experience |
| 🟢 **Done** | `PROJ-04` | **The Frictionless Core** | Admin | Auth, UX Bugs, Search, and VitePress |
| 🟢 **Done** | `PROJ-04.5`| **The Crucible** | Admin | QA, Unit Tests, and Hardening |

## 📅 Q3 2026: Expansion (Active)
| Status | ID | Project Name | Owner | Impact |
| :--- | :--- | :--- | :--- | :--- |
| 🟡 **Active** | `PROJ-05` | **The "Lisa" Service Module**| Admin | Sponsee Management (Encrypted) |

## 📅 Q4 2026: Memory & Business (Planned)
| Status | ID | Project Name | Owner | Impact |
| :--- | :--- | :--- | :--- | :--- |
| ⚪ Planned | `PROJ-06` | **Rich Media & Memory** | Admin | Encrypted Photos & Voice Memos |
| ⚪ Planned | `PROJ-07` | **The Launch Engine** | Admin | Stripe, Demo Mode, & TWA Wrapper |
| ⚪ Planned | `PROJ-08` | **Recovery Tools** | Admin | CBT tools, mindfulness aids, and exercises |
'''

# =============================================================================
# 2. docs/SPRINT_BOARD.md
# =============================================================================
sprint_board_content = r'''# 🏃 Active Sprint Board
**Sprint:** 4.8 "The Crucible: Dogfooding & Polish"
**Start Date:** 2026-03-04
**Goal:** Perform rigorous manual QA ("Dogfooding") to identify and eradicate UX friction in Tasks, Vitality, Wisdom, and Insights before beginning the Service Module.

## ✅ Sprints 1-3: Foundation & Core Polish (Completed)
- [x] Auth UI, Onboarding Redirect, Dashboard Identity, Journal Cache, and basic UI density.

## ✅ Sprint 4.0 - 4.7: Hardening & Visuals (Completed)
- [x] Unit Tests (`useJournalOperations`, `useTaskOperations`).
- [x] Wake Lock API for Breathwork.
- [x] Gradient Charts & Word Cloud Filters.
- [x] Triage Inbox Rework (Accordion Grouping).

## 🟡 Sprint 4.8: The Dogfooding Phase (Active)
- [ ] **Sector 4: The Ledger (Tasks):** Test recurring edge cases, overdue states, and AI action routing.
- [ ] **Sector 5: The Pulse (Vitality):** Test real-world feel of the breathwork pacer, mobile rendering, and bio-rhythm edge cases.
- [ ] **Sector 6: The Compass (Wisdom):** Test auto-save latency, mobile keyboard UX, and AI coaching prompt quality.
- [ ] **Sector 7: Insights Log:** Test rendering of long AI responses, markdown parsing, and filter interactions.

## 🧊 Backlog (Sprint 5+)
- [ ] **PROJ-05:** The "Lisa" Service Module (Encrypted Rolodex).
- [ ] **PROJ-06:** Rich Media & Memory (Photo Attachments).
- [ ] **PROJ-07:** The Launch Engine (Stripe, Demo Mode).
- [ ] **PROJ-08:** Recovery Tools (CBT & Mindfulness aids).
'''

# =============================================================================
# 3. docs/specs/11_DASHBOARD.md
# =============================================================================
dashboard_spec_content = r'''# 📐 Feature Spec: Dashboard (The Hub)

**Status:** Live (v2.2)
**Architecture:** Client-Side Aggregator
**Primary Code:** `src/pages/Dashboard.tsx`

## 1. Overview
The Dashboard is the central command center. It aggregates data from all other modules (Journal, Tasks, Workbooks, Vitality) to generate a real-time "Health Snapshot" of the user's recovery, emphasizing high density and immediate visual feedback.

## 2. Technical Architecture

### A. Data Aggregation
The Dashboard executes 4 concurrent queries on mount:
1.  **Profile:** Fetches `sobrietyDate`, `displayName` (for reactivity), and `lastExportAt`.
2.  **Journals:** Fetches *all* history to calculate streaks and consistency.
3.  **Tasks:** Fetches active tasks to calculate "Fire" scores.
4.  **Workbooks:** Fetches answer count for "Wisdom" score.

**Performance Note:** Queries are set to `refetchOnMount: 'always'` to ensure gamification stats update immediately after a user performs an action in another tab.

### B. The Calculation Engine
Inside a `useMemo` hook, the Dashboard passes raw data to the **Gamification Engine** (`src/lib/gamification.ts`) to derive:
* **User Level:** Based on total XP from all sources.
* **Archetype:** (Scholar, Doer, Monk, etc.) based on activity distribution.
* **Streaks:** Current consecutive activity chains.

### C. The Backup Sentinel
* **Logic:** Compares `userProfile.lastExportAt` to `Date.now()`.
* **Trigger:** If > 7 days since last export.
* **UI:** Displays an amber "Backup Needed" alert card linking to the Profile.

## 3. UI Components
* **Header:** True flex-centered `VibrantHeader` displaying globally mirrored icons and a dynamic daily recovery Slogan as the subtitle.
* **Unified Identity Hero (`SobrietyHero.tsx`):** A highly dense, asymmetrical textured card displaying:
  * "Clean Time" (Years/Months/Days) with `leading-none` for tight vertical rhythm.
  * A single-row gamification footer combining Rank, Level, Progress Bar, and XP.
  * Mirrored Calendar icons wrapping the Total Days counter.
* **Bento Grid:** 6-tile layout linking to core modules:
  * **Active Modules:** Journal (Streak & Consistency), Habits (Rate & Fire Score), Vitality (Bio-Streak & Logs), Wisdom (Mastery % & Total Score).
  * **Teaser Modules:** Service Portal and Recovery Tools (Rendered with 50% opacity and 'Coming Soon' state).

## 4. Verification Checklist
* [ ] **Clean Time:** Change sobriety date in Profile. Does Dashboard update?
* [ ] **Gamification:** Complete a task. Does the "Fire" score in the Bento Grid increment?
* [ ] **Backup Alert:** If new user (no export), is the amber alert visible?
* [ ] **Responsiveness:** Does the single-row Gamification footer gracefully truncate on devices narrower than 350px (e.g., iPhone SE)?
'''

# =============================================================================
# 4. docs-site/guide/02-dashboard.md
# =============================================================================
user_guide_dashboard_content = r'''# 🌅 The Horizon Dashboard

Your Dashboard is the central command center for your recovery journey. It aggregates data from across the app to give you a real-time snapshot of your health.

## 1. The Identity Card (Time & Rank)
At the very top of your dashboard is your unified Identity Card. 
* **Clean Time:** Tracks your exact sobriety time in Years, Months, and Days based on the date set in your Profile. 
* **Gamification Rank:** Right below your time, you will see your current Level, Archetype (e.g., Scholar, Doer, Monk), and your XP Progress Bar. As you complete tasks and write journal entries, this bar will fill up!

## 2. The Bento Grid
Quickly view your active streaks and completion rates across your core pillars:
* **Journal:** View your consecutive day streak and weekly consistency.
* **Habits:** View your overall completion rate and "Fire" score (the combined sum of all your active habit streaks).
* **Vitality:** View your biological regulation streak.
* **Wisdom:** View your workbook mastery percentage.
* **Coming Soon:** You will also see visual placeholders for our upcoming features: The Service Portal (for managing sponsees) and Recovery Tools (CBT exercises & mindfulness aids).

## 3. The Gamification Engine
Recovery is a high-performance lifestyle. MRT tracks your positive actions and assigns you an **Archetype** and **Level**.
* **Earning XP:** You earn XP by writing journals (+25 XP), completing tasks (+10 to +50 XP based on priority), and logging vitality metrics.
* **Archetypes:** Depending on where you spend your time, the system will assign you a persona: *Scholar* (Workbooks), *Doer* (Tasks), *Monk* (Vitality), or *Philosopher* (Journaling).
'''

# =============================================================================
# 5. src/pages/Dashboard.tsx (UI Update)
# =============================================================================
dashboard_ui_content = r'''/**
 * src/pages/Dashboard.tsx
 * GITHUB COMMENT:
 * [Dashboard.tsx]
 * UX: Rebranded "Recovery Games" placeholder to "Recovery Tools" (PROJ-08).
 */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  doc, 
  getDoc, 
  Timestamp,
  type Firestore 
} from 'firebase/firestore';
import { useQuery } from '@tanstack/react-query';
import { 
  calculateJournalStats, 
  calculateTaskStats, 
  calculateWorkbookStats, 
  calculateVitalityStats,
  calculateUserLevel
} from '../lib/gamification';
import VibrantHeader from '../components/VibrantHeader';
import SobrietyHero from '../components/SobrietyHero';
import { 
  HomeIcon, 
  FireIcon, 
  ChartBarIcon, 
  SparklesIcon, 
  HeartIcon, 
  ArrowDownTrayIcon,
  UserGroupIcon,
  PuzzlePieceIcon
} from '@heroicons/react/24/outline';
import { THEME } from '../lib/theme';
import { RECOVERY_SLOGANS } from '../data/slogans';

const TOTAL_WORKBOOK_QUESTIONS = 45;

export default function Dashboard() {
  const { user } = useAuth();
  
  // Lazy init the daily slogan
  const [slogan] = useState(() => {
      const randomIndex = Math.floor(Math.random() * RECOVERY_SLOGANS.length);
      return RECOVERY_SLOGANS[randomIndex];
  });

  // --- QUERY 1: USER PROFILE ---
  const { data: userProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', user?.uid],
    queryFn: async () => {
        if (!user || !db) return null;
        const ref = doc(db, 'users', user.uid);
        const snap = await getDoc(ref);
        return snap.exists() ? snap.data() : null;
    },
    enabled: !!user,
    refetchOnMount: 'always', 
  });

  // --- QUERY 2: JOURNALS ---
  const { data: journals = [], isLoading: journalLoading } = useQuery({
    queryKey: ['journals', user?.uid],
    queryFn: async () => {
        if (!user || !db) return [];
        const database: Firestore = db;
        const q = query(
            collection(database, 'journals'), 
            where('uid', '==', user.uid),
            orderBy('createdAt', 'desc')
        );
        const snap = await getDocs(q);
        return snap.docs.map(d => ({
            ...d.data(),
            createdAt: d.data().createdAt
        }));
    },
    enabled: !!user,
    refetchOnMount: 'always', 
  });

  // --- QUERY 3: TASKS ---
  const { data: tasks = [], isLoading: taskLoading } = useQuery({
    queryKey: ['tasks', user?.uid],
    queryFn: async () => {
        if (!user || !db) return [];
        const database: Firestore = db;
        const q = query(collection(database, 'tasks'), where('uid', '==', user.uid));
        const snap = await getDocs(q);
        return snap.docs.map(d => d.data());
    },
    enabled: !!user,
    refetchOnMount: 'always', 
  });

  // --- QUERY 4: WORKBOOKS ---
  const { data: workbookCount = 0, isLoading: workbookLoading } = useQuery({
    queryKey: ['workbooks', user?.uid],
    queryFn: async () => {
        if (!user || !db) return 0;
        const database: Firestore = db;
        const q = query(collection(database, 'users', user.uid, 'workbook_answers'));
        const snap = await getDocs(q);
        return snap.size;
    },
    enabled: !!user,
    refetchOnMount: 'always', 
  });

  // --- CALCULATE STATS ---
  const stats = useMemo(() => {
    if (journalLoading || taskLoading || workbookLoading || profileLoading) return null;

    let daysClean = 0;
    if (userProfile?.sobrietyDate) {
        const start = userProfile.sobrietyDate.toDate ? userProfile.sobrietyDate.toDate() : new Date(userProfile.sobrietyDate);
        const diffTime = Math.abs(new Date().getTime() - start.getTime());
        daysClean = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    /* eslint-disable @typescript-eslint/no-explicit-any */
    const jStats = calculateJournalStats(journals as any);
    const tStats = calculateTaskStats(tasks as any);
    const wStats = calculateWorkbookStats(workbookCount, TOTAL_WORKBOOK_QUESTIONS);
    const vStats = calculateVitalityStats(journals as any);
    const level = calculateUserLevel(journals as any, tasks as any, workbookCount, daysClean);
    /* eslint-enable @typescript-eslint/no-explicit-any */

    const lastExport = userProfile?.lastExportAt as Timestamp | undefined;
    
    // eslint-disable-next-line react-hooks/purity
    const nowMs = Date.now(); 
    const showBackup = !lastExport || lastExport.toMillis() < nowMs - (7 * 24 * 60 * 60 * 1000);

    return {
        journal: { streak: jStats.journalStreak, consistency: jStats.consistencyRate },
        task: { rate: tStats.completionRate, fire: tStats.habitFire },
        workbook: { wisdom: wStats.wisdomScore, completion: wStats.masterCompletion },
        vitality: { bioStreak: vStats.bioStreak, totalLogs: vStats.totalLogs },
        level,
        showBackup
    };
  }, [journals, tasks, workbookCount, userProfile, journalLoading, taskLoading, workbookLoading, profileLoading]);

  const loading = journalLoading || taskLoading || workbookLoading || profileLoading;

  if (loading || !stats) return <div className="p-8 text-center text-gray-500">Loading your recovery hub...</div>;

  return (
    <div className={`h-[100dvh] flex flex-col ${THEME.dashboard.page}`}>
      
      {/* 1. FIXED HEADER */}
      <div className="flex-shrink-0 z-10">
        <VibrantHeader 
            title="Dashboard" 
            subtitle={slogan}
            icon={HomeIcon}
            fromColor={THEME.dashboard.header.from}
            viaColor={THEME.dashboard.header.via}
            toColor={THEME.dashboard.header.to}
        />
      </div>

      {/* 2. FLOATING HERO: Clean Time + Gamification Unified */}
      <div className="px-4 -mt-12 relative z-30 flex-shrink-0 animate-slideUp">
         <SobrietyHero 
            date={userProfile?.sobrietyDate} 
            levelData={stats.level.levelData}
            archetype={stats.level.archetype}
         />
      </div>

      {/* 3. SCROLLABLE CONTENT */}
      <div className="flex-1 overflow-y-auto px-4 pt-6 pb-24 space-y-6">
        
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

        {/* 6-TILE BENTO GRID */}
        <div className="grid grid-cols-2 gap-4">
            
            {/* 1. JOURNAL */}
            <Link to="/journal" className="relative overflow-hidden rounded-2xl px-5 py-4 bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-200 transition-transform active:scale-95 hover:shadow-xl">
                <div className="absolute right-0 top-0 p-3 opacity-20 transform translate-x-2 -translate-y-2">
                    <ChartBarIcon className="h-16 w-16 rotate-12" />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 bg-white/20 backdrop-blur-sm rounded-lg">
                            <ChartBarIcon className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-sm font-bold uppercase tracking-wider opacity-90">Journal</span>
                    </div>
                    <div className="flex items-baseline gap-2 mb-2">
                        <div className="text-3xl font-black">{stats.journal.streak}</div>
                        <div className="text-base font-bold opacity-80 uppercase tracking-wide">Days</div>
                    </div>
                    
                    <div className="mt-2 pt-2 border-t border-white/20 flex items-center justify-between">
                        <span className="text-base font-bold opacity-75">Consistency</span>
                        <span className="text-base font-bold">{stats.journal.consistency}/wk</span>
                    </div>
                </div>
            </Link>

            {/* 2. HABITS */}
            <Link to="/tasks" className="relative overflow-hidden rounded-2xl px-5 py-4 bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-lg shadow-cyan-200 transition-transform active:scale-95 hover:shadow-xl">
                <div className="absolute right-0 top-0 p-3 opacity-20 transform translate-x-2 -translate-y-2">
                    <FireIcon className="h-16 w-16 rotate-12" />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 bg-white/20 backdrop-blur-sm rounded-lg">
                            <FireIcon className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-sm font-bold uppercase tracking-wider opacity-90">Habits</span>
                    </div>
                    <div className="flex items-baseline gap-2 mb-2">
                        <div className="text-3xl font-black">{stats.task.fire}</div>
                        <div className="text-base font-bold opacity-80 uppercase tracking-wide">Fire</div>
                    </div>

                    <div className="mt-2 pt-2 border-t border-white/20 flex items-center justify-between">
                        <span className="text-base font-bold opacity-75">Rate</span>
                        <span className="text-base font-bold">{stats.task.rate}%</span>
                    </div>
                </div>
            </Link>

            {/* 3. VITALITY */}
            <Link to="/vitality" className="relative overflow-hidden rounded-2xl px-5 py-4 bg-gradient-to-br from-orange-400 to-rose-500 text-white shadow-lg shadow-orange-200 transition-transform active:scale-95 hover:shadow-xl">
                <div className="absolute right-0 top-0 p-3 opacity-20 transform translate-x-2 -translate-y-2">
                    <HeartIcon className="h-16 w-16 rotate-12" />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 bg-white/20 backdrop-blur-sm rounded-lg">
                            <HeartIcon className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-sm font-bold uppercase tracking-wider opacity-90">Vitality</span>
                    </div>
                    <div className="flex items-baseline gap-2 mb-2">
                        <div className="text-3xl font-black">{stats.vitality.bioStreak}</div>
                        <div className="text-base font-bold opacity-80 uppercase tracking-wide">Rhythm</div>
                    </div>

                    <div className="mt-2 pt-2 border-t border-white/20 flex items-center justify-between">
                        <span className="text-base font-bold opacity-75">Logs</span>
                        <span className="text-base font-bold">{stats.vitality.totalLogs}</span>
                    </div>
                </div>
            </Link>

            {/* 4. WISDOM */}
            <Link to="/workbooks" className="relative overflow-hidden rounded-2xl px-5 py-4 bg-gradient-to-br from-emerald-500 to-lime-600 text-white shadow-lg shadow-emerald-200 transition-transform active:scale-95 hover:shadow-xl">
                <div className="absolute right-0 top-0 p-3 opacity-20 transform translate-x-2 -translate-y-2">
                    <SparklesIcon className="h-16 w-16 rotate-12" />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 bg-white/20 backdrop-blur-sm rounded-lg">
                            <SparklesIcon className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-sm font-bold uppercase tracking-wider opacity-90">Wisdom</span>
                    </div>
                    <div className="flex items-baseline gap-2 mb-2">
                        <div className="text-3xl font-black">{stats.workbook.completion}%</div>
                        <div className="text-base font-bold opacity-80 uppercase tracking-wide">Done</div>
                    </div>

                    <div className="mt-2 pt-2 border-t border-white/20 flex items-center justify-between">
                        <span className="text-base font-bold opacity-75">Score</span>
                        <span className="text-base font-bold">{stats.workbook.wisdom}</span>
                    </div>
                </div>
            </Link>

            {/* 5. SERVICE PORTAL (Placeholder) */}
            <div className="relative overflow-hidden rounded-2xl px-5 py-4 bg-slate-200 text-slate-400 border border-slate-300 opacity-60 cursor-not-allowed">
                <div className="absolute right-0 top-0 p-3 opacity-10 transform translate-x-2 -translate-y-2">
                    <UserGroupIcon className="h-16 w-16 rotate-12" />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 bg-slate-300/50 rounded-lg">
                            <UserGroupIcon className="h-4 w-4 text-slate-500" />
                        </div>
                        <span className="text-sm font-bold uppercase tracking-wider">Service</span>
                    </div>
                    <div className="text-xs font-bold mt-3 mb-1 uppercase tracking-wider text-slate-500">
                        Coming Soon
                    </div>
                    <p className="text-[10px] leading-tight pr-2">Encrypted sponsee management.</p>
                </div>
            </div>

            {/* 6. RECOVERY TOOLS (Placeholder - PROJ-08) */}
            <div className="relative overflow-hidden rounded-2xl px-5 py-4 bg-slate-200 text-slate-400 border border-slate-300 opacity-60 cursor-not-allowed">
                <div className="absolute right-0 top-0 p-3 opacity-10 transform translate-x-2 -translate-y-2">
                    <PuzzlePieceIcon className="h-16 w-16 rotate-12" />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 bg-slate-300/50 rounded-lg">
                            <PuzzlePieceIcon className="h-4 w-4 text-slate-500" />
                        </div>
                        <span className="text-sm font-bold uppercase tracking-wider">Tools</span>
                    </div>
                    <div className="text-xs font-bold mt-3 mb-1 uppercase tracking-wider text-slate-500">
                        Coming Soon
                    </div>
                    <p className="text-[10px] leading-tight pr-2">CBT exercises & mindfulness aids.</p>
                </div>
            </div>

        </div>

      </div>
    </div>
  );
}
'''

def write_file(path, content):
    dirname = os.path.dirname(path)
    if dirname: 
        os.makedirs(dirname, exist_ok=True)
    final_content = content.replace("__FENCE__", FENCE).strip() + "\n"
    with open(path, "w", encoding="utf-8") as f:
        f.write(final_content)
    print(f"✅ Updated Docs & UI: {path}")

if __name__ == "__main__":
    write_file("docs/ROADMAP.md", roadmap_content)
    write_file("docs/SPRINT_BOARD.md", sprint_board_content)
    write_file("docs/specs/11_DASHBOARD.md", dashboard_spec_content)
    write_file("docs-site/guide/02-dashboard.md", user_guide_dashboard_content)
    write_file("src/pages/Dashboard.tsx", dashboard_ui_content)
    print("✨ Rebranding to PROJ-08: 'Recovery Tools' complete.")
