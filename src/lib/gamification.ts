// src/lib/gamification.ts

// --- CONFIGURATION ---
const XP_VALUES = {
    JOURNAL_ENTRY: 25,
    JOURNAL_LONG_ENTRY: 10, // Bonus for depth
    TASK_LOW: 10,
    TASK_MEDIUM: 25,
    TASK_HIGH: 50,
    WORKBOOK_QUESTION: 15,
    VITALITY_LOG: 15,
    CLEAN_DAY_MILESTONE: 500 // XP per 30 days
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
    habitFire: number; // Current streak of completed recurring tasks
}

export interface WorkbookStats {
    wisdomScore: number; // Total questions answered
    masterCompletion: number; // % of total questions
}

export interface VitalityStats {
    bioStreak: number;
    totalLogs: number;
}

export interface LevelData {
    level: number;
    title: string;
    currentXP: number;
    nextLevelXP: number;
    progressPercent: number;
}

export interface UserStats {
    totalXP: number;
    levelData: LevelData;
    archetype: string; // 'Scholar', 'Warrior', 'Monk', 'Philosopher', 'Balanced'
}

// Minimal interfaces for input data to avoid 'any'
interface ScorableJournal {
    tags?: string[];
    content?: string;
    moodScore?: number;
    createdAt: { toDate: () => Date } | Date; // flexible for Firestore Timestamp
}

interface ScorableTask {
    status?: string;
    priority?: 'High' | 'Medium' | 'Low';
    completed?: boolean;
    currentStreak?: number;
}

// --- HELPER FUNCTIONS ---

// Helper to check if two dates are the same day
const isSameDay = (d1: Date, d2: Date) => {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
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

// --- CORE CALCULATORS ---

/**
 * Calculates the holistic User Level and Archetype based on all recovery data.
 */
export const calculateUserLevel = (
    journals: ScorableJournal[], 
    tasks: ScorableTask[], 
    workbookAnswersCount: number,
    cleanDays: number
): UserStats => {
    let xp = 0;
    const xpBreakdown = { wisdom: 0, action: 0, vitality: 0, reflection: 0 };

    // 1. Calculate Journal XP
    journals.forEach(j => {
        let entryXP = XP_VALUES.JOURNAL_ENTRY;
        
        // Vitality Check (Different Bucket)
        if (j.tags && j.tags.includes('Vitality')) {
            // Vitality logs count towards vitality, not reflection
            xpBreakdown.vitality += XP_VALUES.VITALITY_LOG;
            xp += XP_VALUES.VITALITY_LOG;
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

    // 5. Determine Archetype
    const maxVal = Math.max(xpBreakdown.wisdom, xpBreakdown.action, xpBreakdown.vitality, xpBreakdown.reflection);
    let archetype = "Balanced";
    
    // Simple logic: if one category clearly dominates
    if (maxVal > 0) {
        if (maxVal === xpBreakdown.wisdom) archetype = "Scholar";
        else if (maxVal === xpBreakdown.action) archetype = "Doer";
        else if (maxVal === xpBreakdown.vitality) archetype = "Monk";
        else if (maxVal === xpBreakdown.reflection) archetype = "Philosopher";
    }

    return {
        totalXP: Math.floor(xp),
        levelData: calculateLevel(xp),
        archetype
    };
};

export const calculateJournalStats = (journals: ScorableJournal[]): GamificationStats => {
    if (!journals || journals.length === 0) {
        return { 
            streakDays: 0, 
            totalEntries: 0, 
            averageMood: 0, 
            journalStreak: 0, 
            consistencyRate: 0, 
            totalWords: 0 
        };
    }

    // Sort descending (newest first)
    // Safely handle Firestore Timestamps vs Date objects
    const sorted = [...journals].sort((a, b) => {
        const dateA = a.createdAt instanceof Date ? a.createdAt : a.createdAt.toDate();
        const dateB = b.createdAt instanceof Date ? b.createdAt : b.createdAt.toDate();
        return dateB.getTime() - dateA.getTime();
    });
    
    const today = new Date();
    
    // 1. Total Entries
    const totalEntries = journals.length;

    // 2. Average Mood
    const moodSum = journals.reduce((acc, curr) => acc + (curr.moodScore || 0), 0);
    const averageMood = totalEntries > 0 ? parseFloat((moodSum / totalEntries).toFixed(1)) : 0;

    // 3. Journal Streak
    let currentStreak = 0;
    
    // Check if posted today
    const firstEntry = sorted[0];
    const lastPostDate = firstEntry.createdAt instanceof Date ? firstEntry.createdAt : firstEntry.createdAt.toDate();
    
    const postedToday = isSameDay(lastPostDate, today);
    // If not posted today, check if posted yesterday to maintain streak
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const postedYesterday = isSameDay(lastPostDate, yesterday);

    if (postedToday || postedYesterday) {
        currentStreak = 1;
        // Iterate backwards to count consecutive days
        const uniqueDays = new Set<string>();
        journals.forEach(j => {
            const d = j.createdAt instanceof Date ? j.createdAt : j.createdAt.toDate();
            uniqueDays.add(d.toDateString());
        });
        const sortedDates = Array.from(uniqueDays).map(d => new Date(d)).sort((a, b) => b.getTime() - a.getTime());
        
        for (let i = 0; i < sortedDates.length - 1; i++) {
            const current = sortedDates[i];
            const next = sortedDates[i+1];
            
            // Difference in days
            const diffTime = Math.abs(current.getTime() - next.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays === 1) {
                currentStreak++;
            } else {
                break;
            }
        }
    }

    // 4. Consistency (Entries / Week)
    const oldestEntry = sorted[sorted.length - 1];
    const firstDate = oldestEntry.createdAt instanceof Date ? oldestEntry.createdAt : oldestEntry.createdAt.toDate();
    const timeSpanDays = Math.max(1, (today.getTime() - firstDate.getTime()) / (1000 * 3600 * 24));
    const weeksActive = Math.ceil(timeSpanDays / 7);
    const consistencyRate = parseFloat((totalEntries / weeksActive).toFixed(1));

    // 5. Total Words
    const totalWords = journals.reduce((acc, curr) => {
        const words = curr.content ? curr.content.trim().split(/\s+/).length : 0;
        return acc + words;
    }, 0);

    return {
        streakDays: currentStreak,
        totalEntries,
        averageMood,
        journalStreak: currentStreak,
        consistencyRate,
        totalWords
    };
};

export const calculateTaskStats = (tasks: ScorableTask[]): TaskStats => {
    if (!tasks || tasks.length === 0) {
        return { completionRate: 0, habitFire: 0 };
    }

    const completed = tasks.filter(t => t.completed || t.status === 'completed').length;
    const completionRate = Math.round((completed / tasks.length) * 100);

    // Habit Fire: Longest current streak among active recurring tasks
    let maxStreak = 0;
    tasks.forEach(t => {
        if (t.currentStreak && t.currentStreak > maxStreak) {
            maxStreak = t.currentStreak;
        }
    });

    return { completionRate, habitFire: maxStreak };
};

export const calculateWorkbookStats = (answersSnapshotSize: number, totalQuestionsAvailable: number = 50): WorkbookStats => {
    return {
        wisdomScore: answersSnapshotSize,
        masterCompletion: Math.round((answersSnapshotSize / totalQuestionsAvailable) * 100)
    };
};

export const calculateVitalityStats = (journals: ScorableJournal[]): VitalityStats => {
    if (!journals) return { bioStreak: 0, totalLogs: 0 };

    // Filter for entries tagged 'Vitality'
    const vitalityLogs = journals.filter(j => j.tags && j.tags.includes('Vitality'));
    
    if (vitalityLogs.length === 0) return { bioStreak: 0, totalLogs: 0 };

    // 1. Total Logs
    const totalLogs = vitalityLogs.length;

    // 2. Bio Streak (Same logic as Journal Streak)
    const sorted = [...vitalityLogs].sort((a, b) => {
        const dateA = a.createdAt instanceof Date ? a.createdAt : a.createdAt.toDate();
        const dateB = b.createdAt instanceof Date ? b.createdAt : b.createdAt.toDate();
        return dateB.getTime() - dateA.getTime();
    });
    const today = new Date();
    
    let currentStreak = 0;
    const firstEntry = sorted[0];
    const lastPostDate = firstEntry.createdAt instanceof Date ? firstEntry.createdAt : firstEntry.createdAt.toDate();
    
    const postedToday = isSameDay(lastPostDate, today);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const postedYesterday = isSameDay(lastPostDate, yesterday);

    if (postedToday || postedYesterday) {
        currentStreak = 1;
        const uniqueDays = new Set<string>();
        vitalityLogs.forEach(j => {
            const d = j.createdAt instanceof Date ? j.createdAt : j.createdAt.toDate();
            uniqueDays.add(d.toDateString());
        });
        const sortedDates = Array.from(uniqueDays).map(d => new Date(d)).sort((a, b) => b.getTime() - a.getTime());
        
        for (let i = 0; i < sortedDates.length - 1; i++) {
            const current = sortedDates[i];
            const next = sortedDates[i+1];
            const diffTime = Math.abs(current.getTime() - next.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays === 1) currentStreak++;
            else break;
        }
    }

    return { bioStreak: currentStreak, totalLogs };
};