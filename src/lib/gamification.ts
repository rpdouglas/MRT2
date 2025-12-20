//import { Timestamp } from 'firebase/firestore';

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

// Helper to check if two dates are the same day
const isSameDay = (d1: Date, d2: Date) => {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
};

export const calculateJournalStats = (journals: any[]): GamificationStats => {
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
    const sorted = [...journals].sort((a, b) => b.createdAt.toDate() - a.createdAt.toDate());
    const today = new Date();
    
    // 1. Total Entries
    const totalEntries = journals.length;

    // 2. Average Mood
    const moodSum = journals.reduce((acc, curr) => acc + (curr.moodScore || 0), 0);
    const averageMood = totalEntries > 0 ? parseFloat((moodSum / totalEntries).toFixed(1)) : 0;

    // 3. Journal Streak
    let currentStreak = 0;
    // Check if posted today
    const lastPostDate = sorted[0].createdAt.toDate();
    const postedToday = isSameDay(lastPostDate, today);
    // If not posted today, check if posted yesterday to maintain streak
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const postedYesterday = isSameDay(lastPostDate, yesterday);

    if (postedToday || postedYesterday) {
        currentStreak = 1;
        // Iterate backwards to count consecutive days
        // We compress entries to unique days first
        const uniqueDays = new Set<string>();
        journals.forEach(j => {
            uniqueDays.add(j.createdAt.toDate().toDateString());
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
    // Calc distinct weeks present
    const firstDate = sorted[sorted.length - 1].createdAt.toDate();
    const timeSpanDays = (today.getTime() - firstDate.getTime()) / (1000 * 3600 * 24);
    const weeksActive = Math.max(1, Math.ceil(timeSpanDays / 7));
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

export const calculateTaskStats = (tasks: any[]): TaskStats => {
    if (!tasks || tasks.length === 0) {
        return { completionRate: 0, habitFire: 0 };
    }

    const completed = tasks.filter(t => t.completed).length;
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
    // Note: totalQuestionsAvailable is defaulted to 50 for now, 
    // ideally passed from the Workbook definitions if available.
    return {
        wisdomScore: answersSnapshotSize,
        masterCompletion: Math.round((answersSnapshotSize / totalQuestionsAvailable) * 100)
    };
};

// [NEW] Calculate stats for Vitality Module
export const calculateVitalityStats = (journals: any[]): VitalityStats => {
    if (!journals) return { bioStreak: 0, totalLogs: 0 };

    // Filter for entries tagged 'Vitality'
    const vitalityLogs = journals.filter(j => j.tags && j.tags.includes('Vitality'));
    
    if (vitalityLogs.length === 0) return { bioStreak: 0, totalLogs: 0 };

    // 1. Total Logs
    const totalLogs = vitalityLogs.length;

    // 2. Bio Streak (Same logic as Journal Streak)
    const sorted = [...vitalityLogs].sort((a, b) => b.createdAt.toDate() - a.createdAt.toDate());
    const today = new Date();
    
    let currentStreak = 0;
    const lastPostDate = sorted[0].createdAt.toDate();
    const postedToday = isSameDay(lastPostDate, today);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const postedYesterday = isSameDay(lastPostDate, yesterday);

    if (postedToday || postedYesterday) {
        currentStreak = 1;
        const uniqueDays = new Set<string>();
        vitalityLogs.forEach(j => {
            uniqueDays.add(j.createdAt.toDate().toDateString());
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