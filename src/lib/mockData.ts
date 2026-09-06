import type { Timestamp } from 'firebase/firestore';
import type { UserProfile, JournalEntry, Task, WorkbookAnswer } from './db';
import type { SavedInsight } from './insights';
import type { ROSCAssessment } from './types/rosc';

// Helper to get relative dates
const daysAgo = (days: number): Date => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d;
};

const hoursAgo = (hours: number): Date => {
    const d = new Date();
    d.setHours(d.getHours() - hours);
    return d;
};

// Safe duck-typed wrapper for Timestamp.
// Uses type-only imports to prevent runtime module resolution or property access
// that would trigger Vitest mock loader errors during unit tests.
const createMockTimestamp = (date: Date): Timestamp => {
  return {
    toDate: () => date,
    seconds: Math.floor(date.getTime() / 1000),
    nanoseconds: (date.getTime() % 1000) * 1000000,
  } as unknown as Timestamp;
};

// ----------------------------------------------------
// 1. NED: Momentum (Day 45, Premium, Amber Theme)
// ----------------------------------------------------
const NED_PROFILE: UserProfile = {
    uid: 'mock-uid-ned',
    email: 'ned@mrt.mock',
    displayName: 'Ned',
    photoURL: null,
    sobrietyDate: createMockTimestamp(daysAgo(45)),
    createdAt: createMockTimestamp(daysAgo(50)),
    role: 'user',
    hasCompletedOnboarding: true,
    tier: 'premium',
    heroColor: 'amber',
    substanceCost: 20,
    costFrequency: 'daily',
    currencySymbol: '$',
    anchorSettings: {
        notifyCheckIn: true,
        notifyReading: true,
        defaultFellowship: 'Smart Recovery',
    }
};

const NED_TASKS: Task[] = [
    {
        id: 'ned-task-1',
        uid: 'mock-uid-ned',
        title: 'Morning Breathwork & Check-in',
        completed: true,
        status: 'completed',
        isRecurring: true,
        frequency: 'daily',
        currentStreak: 12,
        priority: 'High',
        category: 'Recovery',
        createdAt: daysAgo(12),
        dueDate: daysAgo(0),
        lastCompletedAt: daysAgo(0)
    },
    {
        id: 'ned-task-2',
        uid: 'mock-uid-ned',
        title: 'Read Daily Modality Reflections',
        completed: true,
        status: 'completed',
        isRecurring: true,
        frequency: 'daily',
        currentStreak: 8,
        priority: 'Medium',
        category: 'Recovery',
        createdAt: daysAgo(8),
        dueDate: daysAgo(0),
        lastCompletedAt: daysAgo(0)
    },
    {
        id: 'ned-task-3',
        uid: 'mock-uid-ned',
        title: 'Log Evening Journal Entry',
        completed: false,
        status: 'pending',
        isRecurring: true,
        frequency: 'daily',
        currentStreak: 4,
        priority: 'High',
        category: 'Life',
        createdAt: daysAgo(4),
        dueDate: daysAgo(0)
    },
    {
        id: 'ned-task-4',
        uid: 'mock-uid-ned',
        title: 'Attend Smart Recovery Online Meeting',
        completed: false,
        status: 'pending',
        isRecurring: false,
        frequency: 'once',
        currentStreak: 0,
        priority: 'Medium',
        category: 'Recovery',
        createdAt: daysAgo(1),
        dueDate: daysAgo(0)
    }
];

const NED_JOURNALS: JournalEntry[] = [
    {
        id: 'ned-journal-1',
        uid: 'mock-uid-ned',
        content: 'Feeling highly motivated today. Level 4 reached and the 45-day milestone feels incredibly empowering. Focused on building consistent morning routines.',
        moodScore: 9,
        tags: ['motivated', 'milestone', 'gratitude'],
        createdAt: createMockTimestamp(hoursAgo(2)),
        isEncrypted: false
    },
    {
        id: 'ned-journal-2',
        uid: 'mock-uid-ned',
        content: 'Had a slight urge after work yesterday, but rode it out using urge surfing. Grateful for the reminder that urges always pass.',
        moodScore: 6,
        tags: ['urge-surfing', 'victory'],
        createdAt: createMockTimestamp(daysAgo(1)),
        isEncrypted: false
    }
];

// ----------------------------------------------------
// 2. MAYA: Workbook (Day 120, Premium, Violet Theme)
// ----------------------------------------------------
const MAYA_PROFILE: UserProfile = {
    uid: 'mock-uid-maya',
    email: 'maya@mrt.mock',
    displayName: 'Maya',
    photoURL: null,
    sobrietyDate: createMockTimestamp(daysAgo(120)),
    createdAt: createMockTimestamp(daysAgo(130)),
    role: 'user',
    hasCompletedOnboarding: true,
    tier: 'premium',
    heroColor: 'violet',
    substanceCost: 150,
    costFrequency: 'weekly',
    currencySymbol: '$',
    anchorSettings: {
        notifyCheckIn: true,
        notifyReading: false,
    }
};

const MAYA_TASKS: Task[] = [
    {
        id: 'maya-task-1',
        uid: 'mock-uid-maya',
        title: 'Review weekly CBT Thought Record',
        completed: true,
        status: 'completed',
        isRecurring: true,
        frequency: 'weekly',
        currentStreak: 5,
        priority: 'High',
        category: 'Recovery',
        createdAt: daysAgo(35),
        dueDate: daysAgo(0),
        lastCompletedAt: daysAgo(0)
    }
];

const MAYA_JOURNALS: JournalEntry[] = [
    {
        id: 'maya-journal-1',
        uid: 'mock-uid-maya',
        content: 'Deep into the CBT exercises this week. Writing out thought records helps me slow down and dissect anxious thought patterns.',
        moodScore: 8,
        tags: ['cbt', 'reflection', 'peace'],
        createdAt: createMockTimestamp(hoursAgo(4)),
        isEncrypted: false
    }
];

const MAYA_WORKBOOK_ANSWERS: WorkbookAnswer[] = [
    // Guided CBT - Section 1, Question 1
    {
        uid: 'mock-uid-maya',
        workbookId: 'guided-cbt',
        sectionId: 'identifying-triggers',
        questionId: 'trigger-list',
        answer: 'Heavy stress at work, feeling isolated on weekends, and fatigue.',
        isEncrypted: false,
        updatedAt: daysAgo(10)
    },
    // Guided CBT - Section 1, Question 2
    {
        uid: 'mock-uid-maya',
        workbookId: 'guided-cbt',
        sectionId: 'identifying-triggers',
        questionId: 'automatic-thoughts',
        answer: '"I need an escape right now" and "I can\'t handle this pressure."',
        isEncrypted: false,
        updatedAt: daysAgo(10)
    },
    // Guided CBT - Section 2, Question 1
    {
        uid: 'mock-uid-maya',
        workbookId: 'guided-cbt',
        sectionId: 'cognitive-distortions',
        questionId: 'distortion-check',
        answer: 'Catastrophizing (expecting the worst) and All-or-Nothing thinking (feeling like a failure if a day isn\'t perfect).',
        isEncrypted: false,
        updatedAt: daysAgo(5)
    }
];

// ----------------------------------------------------
// 3. DAVID: Survival (Day 5, Free, Rose Theme)
// ----------------------------------------------------
const DAVID_PROFILE: UserProfile = {
    uid: 'mock-uid-david',
    email: 'david@mrt.mock',
    displayName: 'David',
    photoURL: null,
    sobrietyDate: createMockTimestamp(daysAgo(5)),
    createdAt: createMockTimestamp(daysAgo(6)),
    role: 'user',
    hasCompletedOnboarding: true,
    tier: 'free',
    heroColor: 'rose',
    sponsorName: 'Sarah Jenkins',
    sponsorPhone: '555-0199',
    anchorSettings: {
        notifyCheckIn: true,
        notifyReading: true,
    }
};

const DAVID_TASKS: Task[] = [
    {
        id: 'david-task-1',
        uid: 'mock-uid-david',
        title: 'Check-in with sponsor Sarah',
        completed: false,
        status: 'pending',
        isRecurring: true,
        frequency: 'daily',
        currentStreak: 2,
        priority: 'High',
        category: 'Recovery',
        createdAt: daysAgo(2),
        dueDate: daysAgo(0)
    },
    {
        id: 'david-task-2',
        uid: 'mock-uid-david',
        title: 'Complete 3-Minute Breathing Space',
        completed: true,
        status: 'completed',
        isRecurring: true,
        frequency: 'daily',
        currentStreak: 4,
        priority: 'High',
        category: 'Health',
        createdAt: daysAgo(4),
        dueDate: daysAgo(0),
        lastCompletedAt: daysAgo(0)
    }
];

const DAVID_JOURNALS: JournalEntry[] = [
    {
        id: 'david-journal-1',
        uid: 'mock-uid-david',
        content: 'Focusing entirely on today. Minute by minute. Spoke with Sarah and it helped ground me. Feeling anxious but committed.',
        moodScore: 4,
        tags: ['anxiety', 'one-day-at-a-time'],
        createdAt: createMockTimestamp(hoursAgo(1)),
        isEncrypted: false
    }
];

// ----------------------------------------------------
// 4. WALT: Insights (Year 2, Premium, Emerald Theme)
// ----------------------------------------------------
const WALT_PROFILE: UserProfile = {
    uid: 'mock-uid-walt',
    email: 'walt@mrt.mock',
    displayName: 'Walt',
    photoURL: null,
    sobrietyDate: createMockTimestamp(daysAgo(730)),
    createdAt: createMockTimestamp(daysAgo(750)),
    role: 'user',
    hasCompletedOnboarding: true,
    tier: 'premium',
    heroColor: 'emerald',
    substanceCost: 15,
    costFrequency: 'daily',
    currencySymbol: '$',
    anchorSettings: {
        notifyCheckIn: true,
        notifyReading: true,
    }
};

const WALT_TASKS: Task[] = [
    {
        id: 'walt-task-1',
        uid: 'mock-uid-walt',
        title: 'Evening self-reflection meditation',
        completed: true,
        status: 'completed',
        isRecurring: true,
        frequency: 'daily',
        currentStreak: 120,
        priority: 'Medium',
        category: 'Recovery',
        createdAt: daysAgo(200),
        dueDate: daysAgo(0),
        lastCompletedAt: daysAgo(0)
    }
];

const WALT_JOURNALS: JournalEntry[] = [
    {
        id: 'walt-journal-1',
        uid: 'mock-uid-walt',
        content: 'Two full years of clarity. Looking back, the shift in my emotional baseline has been profound. Grateful for this path.',
        moodScore: 10,
        tags: ['anniversary', 'serenity', 'growth'],
        createdAt: createMockTimestamp(hoursAgo(8)),
        isEncrypted: false,
        weather: { temp: 68, condition: 'Clear' }
    },
    {
        id: 'walt-journal-2',
        uid: 'mock-uid-walt',
        content: 'Quiet morning meditation. Noticed how much steadier my breathing has become compared to a year ago. Resilience compounds slowly.',
        moodScore: 9,
        tags: ['meditation', 'resilience'],
        createdAt: createMockTimestamp(daysAgo(1)),
        isEncrypted: false,
        weather: { temp: 65, condition: 'Clear' }
    },
    {
        id: 'walt-journal-3',
        uid: 'mock-uid-walt',
        content: 'Long walk this evening. Some fatigue from work stress, but the routine held. Gratitude for a stable week.',
        moodScore: 7,
        tags: ['gratitude', 'routine'],
        createdAt: createMockTimestamp(daysAgo(2)),
        isEncrypted: false,
        weather: { temp: 61, condition: 'Cloudy' }
    },
    {
        id: 'walt-journal-4',
        uid: 'mock-uid-walt',
        content: 'Reflected on an old thought record from years back. Struck by how far the reframing skills have come since then.',
        moodScore: 8,
        tags: ['reflection', 'growth'],
        createdAt: createMockTimestamp(daysAgo(3)),
        isEncrypted: false
    },
    {
        id: 'walt-journal-5',
        uid: 'mock-uid-walt',
        content: 'A harder day. Work deadline pressure crept in and sleep suffered. Leaning on the evening meditation routine to reset.',
        moodScore: 5,
        tags: ['stress', 'meditation'],
        createdAt: createMockTimestamp(daysAgo(4)),
        isEncrypted: false,
        weather: { temp: 58, condition: 'Rain' }
    },
    {
        id: 'walt-journal-6',
        uid: 'mock-uid-walt',
        content: 'Slept better. Mood lifted alongside it. The correlation between rest and emotional steadiness keeps showing up.',
        moodScore: 8,
        tags: ['sleep', 'stability'],
        createdAt: createMockTimestamp(daysAgo(5)),
        isEncrypted: false,
        weather: { temp: 63, condition: 'Clear' }
    },
    {
        id: 'walt-journal-7',
        uid: 'mock-uid-walt',
        content: 'Sponsorship call today. Grounding to hear someone else\'s early days and remember where this all started.',
        moodScore: 9,
        tags: ['service', 'gratitude'],
        createdAt: createMockTimestamp(daysAgo(7)),
        isEncrypted: false
    },
    {
        id: 'walt-journal-8',
        uid: 'mock-uid-walt',
        content: 'Steady week overall. Morning routine holding. Noticing fewer catastrophic thoughts creeping in during traffic.',
        moodScore: 8,
        tags: ['routine', 'progress'],
        createdAt: createMockTimestamp(daysAgo(9)),
        isEncrypted: false,
        weather: { temp: 70, condition: 'Clear' }
    },
    {
        id: 'walt-journal-9',
        uid: 'mock-uid-walt',
        content: 'Family dinner brought up an old resentment. Sat with it instead of reacting. Small win, but a real one.',
        moodScore: 6,
        tags: ['reflection', 'patience'],
        createdAt: createMockTimestamp(daysAgo(11)),
        isEncrypted: false,
        weather: { temp: 55, condition: 'Cloudy' }
    },
    {
        id: 'walt-journal-10',
        uid: 'mock-uid-walt',
        content: 'Two-week check-in with myself: energy is up, sleep is consistent, and the meditation streak feels sustainable.',
        moodScore: 9,
        tags: ['stability', 'meditation'],
        createdAt: createMockTimestamp(daysAgo(13)),
        isEncrypted: false,
        weather: { temp: 60, condition: 'Clear' }
    }
];

const WALT_INSIGHTS: SavedInsight[] = [
    {
        id: 'insight-1',
        uid: 'mock-uid-walt',
        type: 'journal',
        scope_context: 'Past 30 days of journal entries',
        summary: 'Your emotional baseline has stabilized significantly, showing a 30% reduction in high-anxiety spikes over the last quarter.',
        pillars: {
            understanding: 'Meditation acts as a powerful buffer against cognitive distortion triggers.',
            growth: 'You have shown high resilience by consistently logging and refuting automatic thoughts.',
            blind_spots: 'Late-night screen use correlates with slightly lower mood scores the following morning.'
        },
        suggested_actions: [
            'Maintain the 10-minute morning meditation habit.',
            'Review evening routines to wind down earlier.'
        ],
        strengths: ['Resilience', 'Meditation consistency', 'Proactive journaling'],
        risks: ['Sleep fatigue', 'Over-committing at work'],
        key_themes: ['mindfulness', 'routine', 'self-awareness'],
        hidden_correlations: ['Meditation streak directly offsets work fatigue'],
        relapse_risk_level: 'Low',
        trajectory: 'Highly stable and positive',
        core_triggers: ['Work stress', 'Fatigue'],
        emotional_velocity: 'Stable upward trend',
        createdAt: daysAgo(2)
    },
    {
        id: 'insight-2',
        uid: 'mock-uid-walt',
        type: 'workbook',
        scope_context: 'Guided CBT Workbook progress',
        summary: 'CBT thought records show increased efficacy in refuting catastrophizing automatic thoughts.',
        pillars: {
            understanding: 'Workbook exercises are reinforcing your ability to reframe stressful situations.',
            emotional_resonance: 'A 60% reduction in initial belief rating of negative automatic thoughts after completing thought records.',
            blind_spots: 'Slight delay in refuting automatic thoughts when away from your home environment.'
        },
        suggested_actions: [
            'Try completing a mini-thought-record immediately on your phone when stress arises.',
            'Continue identifying all-or-nothing cognitive distortions.'
        ],
        createdAt: daysAgo(9)
    }
];

// Helper functions for easy querying
export function getMockProfile(email: string): UserProfile | null {
    if (email.startsWith('ned')) return NED_PROFILE;
    if (email.startsWith('maya')) return MAYA_PROFILE;
    if (email.startsWith('david')) return DAVID_PROFILE;
    if (email.startsWith('walt')) return WALT_PROFILE;
    return null;
}

export function getMockTasks(email: string): Task[] {
    if (email.startsWith('ned')) return NED_TASKS;
    if (email.startsWith('maya')) return MAYA_TASKS;
    if (email.startsWith('david')) return DAVID_TASKS;
    if (email.startsWith('walt')) return WALT_TASKS;
    return [];
}

export function getMockJournals(email: string): JournalEntry[] {
    if (email.startsWith('ned')) return NED_JOURNALS;
    if (email.startsWith('maya')) return MAYA_JOURNALS;
    if (email.startsWith('david')) return DAVID_JOURNALS;
    if (email.startsWith('walt')) return WALT_JOURNALS;
    return [];
}

export function getMockWorkbookAnswers(email: string): WorkbookAnswer[] {
    if (email.startsWith('maya')) return MAYA_WORKBOOK_ANSWERS;
    return [];
}

export function getMockInsights(email: string): SavedInsight[] {
    if (email.startsWith('walt')) return WALT_INSIGHTS;
    return [];
}

const DAVID_VITALITY_LOGS = [
    {
        id: 'david-vitality-1',
        tags: ['Vitality', 'Breathwork'],
        createdAt: createMockTimestamp(hoursAgo(1))
    },
    {
        id: 'david-vitality-2',
        tags: ['Vitality', 'Movement'],
        createdAt: createMockTimestamp(hoursAgo(4))
    }
];

export function getMockVitalityLogs(email: string): Array<{ id: string; tags: string[]; createdAt: Timestamp }> {
    if (email.startsWith('david')) return DAVID_VITALITY_LOGS;
    return [];
}

// PROJ-63 mock mode: /insights (ROSC Recovery Capital) had no mock fallback at
// all — useROSCAssessments.ts's getROSCAssessments() always hit live
// Firestore, which returns empty for a mock-uid-* account and renders the
// "Your first snapshot awaits" onboarding empty state instead of the
// documented AI-summary card. encryptedAIContext is plaintext here — .mock
// emails get an identity encrypt/decrypt via EncryptionContext, same as every
// other "encrypted" field in this file.
const WALT_ROSC_ASSESSMENTS: ROSCAssessment[] = [
    {
        id: 'walt-rosc-2',
        uid: 'mock-uid-walt',
        createdAt: createMockTimestamp(daysAgo(2)),
        periodStart: createMockTimestamp(daysAgo(9)),
        periodEnd: createMockTimestamp(daysAgo(2)),
        scores: {
            health: { score: 8, selfReportedScore: 8, evidenceCount: 6 },
            home: { score: 9, selfReportedScore: 9, evidenceCount: 4 },
            purpose: { score: 7, selfReportedScore: 7, evidenceCount: 5 },
            community: { score: 8, selfReportedScore: 8, evidenceCount: 7 },
        },
        totalScore: 32, // sum of the four domain scores above, out of a max of 40
        trajectory: 'Improving',
        journalEntriesAnalysed: 10,
        encryptedAIContext: 'Recovery capital has climbed steadily across all four domains this period, with Home and Community showing the strongest evidence base.'
    },
    {
        id: 'walt-rosc-1',
        uid: 'mock-uid-walt',
        createdAt: createMockTimestamp(daysAgo(16)),
        periodStart: createMockTimestamp(daysAgo(23)),
        periodEnd: createMockTimestamp(daysAgo(16)),
        scores: {
            health: { score: 7, selfReportedScore: 7, evidenceCount: 5 },
            home: { score: 8, selfReportedScore: 8, evidenceCount: 3 },
            purpose: { score: 6, selfReportedScore: 6, evidenceCount: 3 },
            community: { score: 7, selfReportedScore: 7, evidenceCount: 5 },
        },
        totalScore: 28, // sum of the four domain scores above, out of a max of 40
        trajectory: 'Stable',
        journalEntriesAnalysed: 8,
        encryptedAIContext: 'A stable baseline period — Purpose scored lowest, suggesting room to add more structured goal-setting into the weekly routine.'
    }
];

export function getMockROSCAssessments(email: string): ROSCAssessment[] {
    if (email.startsWith('walt')) return WALT_ROSC_ASSESSMENTS;
    return [];
}
