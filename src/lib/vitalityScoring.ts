export interface BioBalanceLog {
    tags: string[];
}

export function calculateBioBalance(logs: BioBalanceLog[]): number {
    const hasMove = logs.some(l => l.tags.includes('Movement'));
    const hasFood = logs.some(l => l.tags.includes('Nutrition'));
    const hasMind = logs.some(l => l.tags.includes('Mindfulness') || l.tags.includes('Meditation'));

    let score = 0;
    if (hasMove) score += 33.3;
    if (hasFood) score += 33.3;
    if (hasMind) score += 33.3;
    return Math.min(100, score);
}

export interface MoodCacheEntry {
    moodScore?: number;
}

// Averages the last 7 valid mood scores from the journal cache to infer a
// reasonable default mood for entries (Movement/Fuel/Breath logs) that don't
// ask the user to self-report one directly.
export function inferMoodFromRecentEntries(entries: MoodCacheEntry[]): number {
    if (!entries || entries.length === 0) return 5;

    const recent = entries.filter(e => typeof e.moodScore === 'number' && e.moodScore > 0).slice(0, 7);
    if (recent.length === 0) return 5;

    const sum = recent.reduce((acc, curr) => acc + (curr.moodScore || 0), 0);
    return Math.round(sum / recent.length);
}
