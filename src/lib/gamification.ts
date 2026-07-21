import { Timestamp } from 'firebase/firestore';
import { DRAFT_TAG } from './types/smart';
import { WORKBOOKS } from '../data/workbooks';

// --- CONFIGURATION ---
const XP_VALUES = {
    JOURNAL_ENTRY: 25,
    JOURNAL_LONG_ENTRY: 10, // Bonus for depth
    TASK_LOW: 10,
    TASK_MEDIUM: 25,
    TASK_HIGH: 50,
    WORKBOOK_QUESTION: 15,
    VITALITY_LOG: 15,
    CLEAN_DAY_MILESTONE: 500, // XP per 30 days
    ROSC_ASSESSMENT: 25,
    SMART_TOOL_COMPLETION: 25, // Guided CBT tool completion — equivalent to a Medium-priority task (TASK_MEDIUM)
    // PROJ-72 (Recovery Games), Phase 1 foundation. Reused by future games via
    // useGameProgress rather than a parallel XP economy — see
    // docs/projects/72_RECOVERY_GAMES.md §3. Which calculateUserLevel bucket
    // this feeds is an open design question deferred until a real game ships.
    GAME_COMPLETION: 20,
};

// --- INTERFACES ---

export interface GamificationStats {
  streakDays: number;
  totalEntries: number;
  averageMood: number;
  journalStreak: number;
  consistencyRate: number; // entries per week
  totalWords: number;
}

export interface TaskStats {
    completionRate: number;
    habitFire: number; // Sum of all active streaks
}

export interface WorkbookStats {
    wisdomScore: number; // Total questions answered
    masterCompletion: number; // % of total questions
    totalQuestions: number; // Denominator used for masterCompletion
}

// Sum of every non-read_only question across all workbooks — recalculates automatically
// as workbooks/questions are added, instead of relying on a hardcoded guess.
const TOTAL_WORKBOOK_QUESTIONS = WORKBOOKS.reduce(
    (sum, wb) => sum + wb.sections.reduce(
        (s, sec) => s + sec.questions.filter(q => q.type !== 'read_only').length, 0
    ), 0
);

export interface VitalityStats { bioStreak: number; totalLogs: number; }

export interface LevelData { level: number; title: string; currentXP: number; nextLevelXP: number; progressPercent: number; }

export interface UserStats {
    totalXP: number;
    levelData: LevelData;
    archetype: string; // 'Scholar', 'Warrior', 'Monk', 'Philosopher', 'Balanced'
}

// Minimal interfaces for input data to avoid 'any'
export interface ScorableJournal { tags?: string[]; content?: string; moodScore?: number; createdAt: { toDate: () => Date } | Date | Timestamp; }

export interface ScorableTask { status?: string; priority?: 'High' | 'Medium' | 'Low'; completed?: boolean; currentStreak?: number; }

// --- HELPER FUNCTIONS ---

// Helper to check if two dates are the same day
const isSameDay = (d1: Date, d2: Date) => { 
    return d1.getFullYear() === d2.getFullYear() && 
           d1.getMonth() === d2.getMonth() && 
           d1.getDate() === d2.getDate(); 
};

// Helper to safely extract Date from Firestore Timestamp or Date object
const getNormalizedDate = (createdAt: { toDate: () => Date } | Date | Timestamp): Date => {
    return createdAt instanceof Date ? createdAt : (createdAt as Timestamp).toDate();
};

const getTitle = (level: number): string => {
    if (level >= 50) return "Elder / Sponsor";
    if (level >= 40) return "Guide";
    if (level >= 30) return "Architect";
    if (level >= 20) return "Warrior";
    if (level >= 10) return "Initiate";
    return "Seeker";
};

// Standard RPG Curve: Level = Floor(Constant * Sqrt(XP))
const calculateLevel = (xp: number): LevelData => {
    const CONSTANT = 0.07; // 0.07 makes Lvl 10 approx 20k XP
    // Level calculation (min level 1)
    const level = Math.max(1, Math.floor(CONSTANT * Math.sqrt(xp)) + 1);
    
    // XP required for current and next levels
    // Inverse formula: XP = (Level / CONSTANT)^2
    const currentLevelBaseXP = Math.pow((level - 1) / CONSTANT, 2);
    const nextLevelBaseXP = Math.pow(level / CONSTANT, 2);
    
    const neededForNext = nextLevelBaseXP - currentLevelBaseXP;
    const progressInLevel = xp - currentLevelBaseXP;

    // Safety check for divide by zero (shouldn't happen with level >= 1)
    const progressPercent = neededForNext > 0 
        ? Math.min(100, Math.round((progressInLevel / neededForNext) * 100))
        : 0;

    return {
        level,
        title: getTitle(level),
        currentXP: xp,
        nextLevelXP: Math.floor(nextLevelBaseXP),
        progressPercent
    };
};

// DRY Helper to calculate consecutive day streaks
const calculateConsecutiveStreak = (entries: ScorableJournal[]): number => {
    if (!entries || entries.length === 0) return 0;

    const today = new Date();
    const uniqueDays = new Set<string>();
    
    entries.forEach(j => {
        const d = getNormalizedDate(j.createdAt);
        uniqueDays.add(d.toDateString());
    });

    const sortedDates = Array.from(uniqueDays)
        .map(d => new Date(d))
        .sort((a, b) => b.getTime() - a.getTime());

    if (sortedDates.length === 0) return 0;

    let currentStreak = 0;
    const lastPostDate = sortedDates[0];

    const postedToday = isSameDay(lastPostDate, today);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const postedYesterday = isSameDay(lastPostDate, yesterday);

    if (postedToday || postedYesterday) {
        currentStreak = 1;
        for (let i = 0; i < sortedDates.length - 1; i++) {
            const current = sortedDates[i];
            const next = sortedDates[i+1];
            
            const diffTime = Math.abs(current.getTime() - next.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays === 1) {
                currentStreak++;
            } else {
                break;
            }
        }
    }

    return currentStreak;
};

// --- CORE CALCULATORS ---

export const calculateUserLevel = (
    journals: ScorableJournal[],
    tasks: ScorableTask[],
    workbookAnswersCount: number,
    cleanDays: number,
    roscAssessmentsCount = 0,
    gameProgressCount = 0 // PROJ-72: completed Recovery Games — an active-coping action, same bucket as tasks
): UserStats => {
    let xp = 0;
    const xpBreakdown = { wisdom: 0, action: 0, vitality: 0, reflection: 0 };

    // 1. Calculate Journal XP
    journals.forEach(j => {
        let entryXP = XP_VALUES.JOURNAL_ENTRY;
        
        // Vitality Check (Different Bucket)
        if (j.tags && j.tags.includes('Vitality')) {
            xpBreakdown.vitality += XP_VALUES.VITALITY_LOG;
            xp += XP_VALUES.VITALITY_LOG;
            return;
        }

        // SMART Tool completion (guided CBT flows) — flat XP, no depth bonus.
        // Partial saves tagged DRAFT haven't been completed yet and earn nothing.
        if (j.tags && j.tags.includes('SMART Tool')) {
            if (!j.tags.includes(DRAFT_TAG)) {
                xpBreakdown.action += XP_VALUES.SMART_TOOL_COMPLETION;
                xp += XP_VALUES.SMART_TOOL_COMPLETION;
            }
            return;
        }

        // Depth Bonus
        if (j.content && j.content.trim().split(/\s+/).length > 50) {
            entryXP += XP_VALUES.JOURNAL_LONG_ENTRY;
        }
        
        xpBreakdown.reflection += entryXP;
        xp += entryXP;
    });

    // 2. Calculate Task XP
    tasks.forEach(t => {
        if (t.status === 'completed' || t.completed) {
            let taskXP = 0;
            switch(t.priority) {
                case 'High': taskXP = XP_VALUES.TASK_HIGH; break;
                case 'Medium': taskXP = XP_VALUES.TASK_MEDIUM; break;
                default: taskXP = XP_VALUES.TASK_LOW;
            }
            xp += taskXP;
            xpBreakdown.action += taskXP;
        }
    });

    // 3. Calculate Workbook XP
    const wbXP = workbookAnswersCount * XP_VALUES.WORKBOOK_QUESTION;
    xp += wbXP;
    xpBreakdown.wisdom += wbXP;

    // 4. Clean Time Bonuses (Every 30 days)
    const milestones = Math.floor(cleanDays / 30);
    xp += (milestones * XP_VALUES.CLEAN_DAY_MILESTONE);

    // 5. ROSC Assessment XP (monthly check-ins)
    xp += roscAssessmentsCount * XP_VALUES.ROSC_ASSESSMENT;

    // 6. Recovery Games XP (PROJ-72) — active-coping action, same bucket as tasks
    const gameXP = gameProgressCount * XP_VALUES.GAME_COMPLETION;
    xp += gameXP;
    xpBreakdown.action += gameXP;

    // 5. Determine Archetype
    const maxVal = Math.max(xpBreakdown.wisdom, xpBreakdown.action, xpBreakdown.vitality, xpBreakdown.reflection);
    let archetype = "Balanced";
    
    if (maxVal > 0) {
        if (maxVal === xpBreakdown.wisdom) archetype = "Scholar";
        else if (maxVal === xpBreakdown.action) archetype = "Doer";
        else if (maxVal === xpBreakdown.vitality) archetype = "Monk";
        else if (maxVal === xpBreakdown.reflection) archetype = "Philosopher";
    }

    return { totalXP: Math.floor(xp), levelData: calculateLevel(xp), archetype };
};

export const calculateJournalStats = (journals: ScorableJournal[]): GamificationStats => {
    if (!journals || journals.length === 0) {
        return { streakDays: 0, totalEntries: 0, averageMood: 0, journalStreak: 0, consistencyRate: 0, totalWords: 0 };
    }

    const sorted = [...journals].sort((a, b) => {
        const dateA = getNormalizedDate(a.createdAt);
        const dateB = getNormalizedDate(b.createdAt);
        return dateB.getTime() - dateA.getTime();
    });
    
    const today = new Date();
    const totalEntries = journals.length;
    const moodSum = journals.reduce((acc, curr) => acc + (curr.moodScore || 0), 0);
    const averageMood = totalEntries > 0 ? parseFloat((moodSum / totalEntries).toFixed(1)) : 0;
    const currentStreak = calculateConsecutiveStreak(journals);

    const oldestEntry = sorted[sorted.length - 1];
    const firstDate = getNormalizedDate(oldestEntry.createdAt);
    const timeSpanDays = Math.max(1, (today.getTime() - firstDate.getTime()) / (1000 * 3600 * 24));
    const weeksActive = Math.ceil(timeSpanDays / 7);
    const consistencyRate = parseFloat((totalEntries / weeksActive).toFixed(1));

    const totalWords = journals.reduce((acc, curr) => { 
        const words = curr.content ? curr.content.trim().split(/\s+/).length : 0; 
        return acc + words; 
    }, 0);

    return { streakDays: currentStreak, totalEntries, averageMood, journalStreak: currentStreak, consistencyRate, totalWords };
};

export const calculateTaskStats = (tasks: ScorableTask[]): TaskStats => { 
    if (!tasks || tasks.length === 0) return { completionRate: 0, habitFire: 0 }; 

    const completed = tasks.filter(t => t.completed || t.status === 'completed').length;
    const completionRate = Math.round((completed / tasks.length) * 100);

    let totalMomentum = 0;
    tasks.forEach(t => { 
        if (t.currentStreak && t.currentStreak > 0) totalMomentum += t.currentStreak; 
    });

    return { completionRate, habitFire: totalMomentum };
};

export const calculateWorkbookStats = (answersSnapshotSize: number, totalQuestionsAvailable: number = TOTAL_WORKBOOK_QUESTIONS): WorkbookStats => {
    return {
        wisdomScore: answersSnapshotSize,
        masterCompletion: Math.round((answersSnapshotSize / totalQuestionsAvailable) * 100),
        totalQuestions: totalQuestionsAvailable,
    };
};

export const calculateVitalityStats = (journals: ScorableJournal[]): VitalityStats => {
    if (!journals) return { bioStreak: 0, totalLogs: 0 };
    const vitalityLogs = journals.filter(j => j.tags && j.tags.includes('Vitality'));
    if (vitalityLogs.length === 0) return { bioStreak: 0, totalLogs: 0 };

    const totalLogs = vitalityLogs.length;
    const currentStreak = calculateConsecutiveStreak(vitalityLogs);

    return { bioStreak: currentStreak, totalLogs };
};
