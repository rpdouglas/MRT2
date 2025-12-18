import { differenceInCalendarDays, startOfDay, isSameDay, subDays } from 'date-fns';
import type { JournalEntry } from './journal';

export interface GamificationStats {
  journalStreak: number;
  totalEntries: number;
  totalWords: number;
  consistencyRate: number; // Avg entries per week
  averageMood: number; // Lifetime average
}

export function calculateJournalStats(entries: JournalEntry[]): GamificationStats {
  if (entries.length === 0) {
    return { 
      journalStreak: 0, 
      totalEntries: 0, 
      totalWords: 0, 
      consistencyRate: 0,
      averageMood: 0 
    };
  }

  // 1. Sort entries by date descending (Newest first)
  const sorted = [...entries].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  
  // 2. Calculate Streak
  let streak = 0;
  const today = startOfDay(new Date());
  
  // Check if we wrote today to start the count, or if the streak ended yesterday
  const lastEntryDate = startOfDay(sorted[0].createdAt);
  
  // If the last entry was neither today nor yesterday, streak is 0.
  if (!isSameDay(lastEntryDate, today) && !isSameDay(lastEntryDate, subDays(today, 1))) {
      streak = 0;
  } else {
      // Start counting backwards
      // We create a unique set of dates strings to handle multiple entries in one day
      const uniqueDates = Array.from(new Set(sorted.map(e => startOfDay(e.createdAt).toISOString())));
      
      // Re-sort unique dates descending
      uniqueDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

      // Loop through unique dates to find consecutive days
      streak = 1;
      for (let i = 0; i < uniqueDates.length - 1; i++) {
        const current = new Date(uniqueDates[i]);
        const prev = new Date(uniqueDates[i+1]);
        
        const diff = differenceInCalendarDays(current, prev);
        
        if (diff === 1) {
            streak++;
        } else {
            break; // Streak broken
        }
      }
  }

  // 3. Word Count
  const totalWords = entries.reduce((acc, curr) => acc + (curr.content.trim().split(/\s+/).length || 0), 0);

  // 4. Consistency (Entries / Weeks active)
  const firstEntry = sorted[sorted.length - 1].createdAt;
  const daysActive = differenceInCalendarDays(today, firstEntry) || 1; // Avoid divide by zero
  const weeksActive = Math.max(daysActive / 7, 1);
  const consistencyRate = parseFloat((entries.length / weeksActive).toFixed(1));

  // 5. Average Mood (Lifetime)
  const totalMood = entries.reduce((acc, curr) => acc + (curr.moodScore || 0), 0);
  const averageMood = parseFloat((totalMood / entries.length).toFixed(1));

  return {
    journalStreak: streak,
    totalEntries: entries.length,
    totalWords,
    consistencyRate,
    averageMood
  };
}