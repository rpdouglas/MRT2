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
    },
    // Screenshot pipeline (TD-31): a future-dated task so /tasks?mockUser=ned's "Later"
    // tab has real content instead of an empty state.
    {
        id: 'ned-task-5',
        uid: 'mock-uid-ned',
        title: 'Prepare a share for Friday\'s meeting',
        completed: false,
        status: 'pending',
        isRecurring: false,
        frequency: 'once',
        currentStreak: 0,
        priority: 'Low',
        category: 'Recovery',
        createdAt: daysAgo(0),
        dueDate: daysAgo(-3)
    },
    {
        id: 'ned-task-6',
        uid: 'mock-uid-ned',
        title: '60-Day Milestone Check-in with Sponsor',
        completed: false,
        status: 'pending',
        isRecurring: false,
        frequency: 'once',
        currentStreak: 0,
        priority: 'Medium',
        category: 'Recovery',
        createdAt: daysAgo(0),
        dueDate: daysAgo(-15)
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
    },
    // Screenshot pipeline (TD-31): SMART Tool completions save into `journals` as a
    // stringified { metadata: { type }, data } envelope (see smartToolPayload.ts) —
    // these give /tools/:toolType/history?mockUser=maya real content instead of an
    // empty state, via useToolHistory's array-contains-tag query.
    {
        id: 'maya-journal-cba-1',
        uid: 'mock-uid-maya',
        content: JSON.stringify({
            metadata: { type: 'CBA', version: '1', lastSaved: daysAgo(6).toISOString() },
            data: {
                behavior: 'Skipping my evening walk when I feel overwhelmed',
                advantagesDoing: ['More time to decompress alone', 'Avoids small talk with neighbors'],
                disadvantagesDoing: ['Loses my main stress outlet', 'Sleep gets worse within a day or two'],
                advantagesStopping: ['Better sleep', 'Keeps my mood more stable through the week'],
                disadvantagesStopping: ['Requires motivation I don’t always have after a long day'],
            },
        }),
        moodScore: 7,
        tags: ['CBA', 'cbt'],
        createdAt: createMockTimestamp(daysAgo(6)),
        isEncrypted: false,
    },
    {
        id: 'maya-journal-abc-1',
        uid: 'mock-uid-maya',
        content: JSON.stringify({
            metadata: { type: 'ABC', version: '1', lastSaved: daysAgo(9).toISOString() },
            data: {
                activatingEvent: 'A coworker cancelled our 1:1 at the last minute for the second week running.',
                beliefs: 'She must be avoiding me because of something I did.',
                consequences: 'Spent the afternoon anxious and distracted, replayed our last conversation twice.',
                dispute: 'She rescheduled, not cancelled outright, and mentioned a packed sprint deadline in her message.',
                effectiveBelief: 'Her calendar is genuinely full right now — this isn’t about me.',
            },
        }),
        moodScore: 6,
        tags: ['ABC', 'cbt'],
        createdAt: createMockTimestamp(daysAgo(9)),
        isEncrypted: false,
    },
];

// Screenshot pipeline (TD-31): 'guided-cbt'/'identifying-triggers'/etc. below were never
// real workbook/section/question ids (src/data/workbooks.ts's WORKBOOKS only has
// general_recovery/12_steps/recovery_dharma/womens_recovery) — WorkbookDetail rendered
// "Workbook not found" for Maya the moment a screenshot target actually exercised this
// fixture. Remapped to the real General Recovery Workbook's 'main' section and its
// actual gen_* question ids, content adjusted to genuinely answer those prompts.
const MAYA_WORKBOOK_ANSWERS: WorkbookAnswer[] = [
    // General Recovery Workbook — "What emotions trigger your desire to use?"
    {
        uid: 'mock-uid-maya',
        workbookId: 'general_recovery',
        sectionId: 'main',
        questionId: 'gen_4',
        answer: 'Heavy stress at work, feeling isolated on weekends, and fatigue late in the day.',
        isEncrypted: false,
        updatedAt: daysAgo(10)
    },
    // General Recovery Workbook — "How has your addiction affected your relationships..."
    {
        uid: 'mock-uid-maya',
        workbookId: 'general_recovery',
        sectionId: 'main',
        questionId: 'gen_3',
        answer: 'I withdrew from my closest friends for almost a year and missed my sister\'s move without explanation. Rebuilding that trust is still in progress.',
        isEncrypted: false,
        updatedAt: daysAgo(10)
    },
    // General Recovery Workbook — "What are your biggest fears about living sober?"
    {
        uid: 'mock-uid-maya',
        workbookId: 'general_recovery',
        sectionId: 'main',
        questionId: 'gen_8',
        answer: 'That I\'ll lose the identity I built around always having an escape hatch, and won\'t know who I am without it.',
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
        isEncrypted: false
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

// Screenshot pipeline (TD-31): Walt's Recovery Capital/ROSC trend requires 2+ assessments
// to render a real trajectory instead of "Insufficient Data" — matches his existing
// long-history/Insights persona fit (WALT_INSIGHTS above).
const WALT_ROSC_ASSESSMENTS: ROSCAssessment[] = [
    {
        id: 'walt-rosc-2',
        uid: 'mock-uid-walt',
        createdAt: createMockTimestamp(daysAgo(3)),
        periodStart: createMockTimestamp(daysAgo(33)),
        periodEnd: createMockTimestamp(daysAgo(3)),
        scores: {
            health: { score: 8, selfReportedScore: 4, evidenceCount: 3 },
            home: { score: 9, selfReportedScore: 5, evidenceCount: 2 },
            purpose: { score: 7, selfReportedScore: 4, evidenceCount: 4 },
            community: { score: 7, selfReportedScore: 4, evidenceCount: 2 },
        },
        totalScore: 31,
        trajectory: 'Improving',
        journalEntriesAnalysed: 24,
        encryptedAIContext: JSON.stringify({
            narrative: 'The last 30 days show a steady climb across every domain, most notably Home and Health. Your evening meditation streak (120 days) continues to anchor your emotional baseline.',
            strengths: ['Resilience', 'Meditation consistency', 'Proactive journaling'],
            growth_areas: ['Community — slightly behind the other three domains'],
            evidence: {
                health: ['Consistent sleep-schedule entries', 'No fatigue mentions in the last 2 weeks'],
                home: ['Describes home as "settled" in 3 separate entries'],
                purpose: ['Two entries reference mentoring newer AA members'],
                community: ['One meeting attendance mentioned this period'],
            },
            actions: {
                health: 'Keep the current sleep routine — it\'s working.',
                home: 'No action needed — this domain is strong.',
                purpose: 'Consider formalizing the mentoring into a regular commitment.',
                community: 'One additional meeting or Recovery Dharma sit this month would round this out.',
            },
        }),
    },
    {
        id: 'walt-rosc-1',
        uid: 'mock-uid-walt',
        createdAt: createMockTimestamp(daysAgo(33)),
        periodStart: createMockTimestamp(daysAgo(63)),
        periodEnd: createMockTimestamp(daysAgo(33)),
        scores: {
            health: { score: 7, selfReportedScore: 4, evidenceCount: 2 },
            home: { score: 8, selfReportedScore: 4, evidenceCount: 2 },
            purpose: { score: 6, selfReportedScore: 3, evidenceCount: 3 },
            community: { score: 6, selfReportedScore: 3, evidenceCount: 1 },
        },
        totalScore: 27,
        trajectory: 'Stable',
        journalEntriesAnalysed: 19,
        encryptedAIContext: JSON.stringify({
            narrative: 'A stable period overall, with Purpose and Community trailing Health and Home slightly.',
            strengths: ['Consistent daily practice'],
            growth_areas: ['Purpose', 'Community'],
            evidence: { health: [], home: [], purpose: [], community: [] },
            actions: {
                health: 'Maintain current routine.',
                home: 'Maintain current routine.',
                purpose: 'Look for a next service commitment.',
                community: 'Re-engage with the weekly Recovery Dharma group.',
            },
        }),
    },
];

// ----------------------------------------------------
// 5. JORDAN: Stabiliser (MAT, Day 200, Free, Sky Theme)
// ----------------------------------------------------
const JORDAN_PROFILE: UserProfile = {
    uid: 'mock-uid-jordan',
    email: 'jordan@mrt.mock',
    displayName: 'Jordan',
    photoURL: null,
    sobrietyDate: createMockTimestamp(daysAgo(200)),
    createdAt: createMockTimestamp(daysAgo(210)),
    role: 'user',
    hasCompletedOnboarding: true,
    tier: 'free',
    heroColor: 'sky',
    anchorSettings: {
        notifyCheckIn: true,
        notifyReading: false,
        defaultFellowship: 'Smart Recovery',
    }
};

const JORDAN_TASKS: Task[] = [
    {
        id: 'jordan-task-1',
        uid: 'mock-uid-jordan',
        title: 'Morning routine check-in',
        completed: true,
        status: 'completed',
        isRecurring: true,
        frequency: 'daily',
        currentStreak: 34,
        priority: 'High',
        category: 'Health',
        createdAt: daysAgo(34),
        dueDate: daysAgo(0),
        lastCompletedAt: daysAgo(0)
    },
    {
        id: 'jordan-task-2',
        uid: 'mock-uid-jordan',
        title: 'MARA online meeting',
        completed: false,
        status: 'pending',
        isRecurring: true,
        frequency: 'weekly',
        currentStreak: 6,
        priority: 'Medium',
        category: 'Recovery',
        createdAt: daysAgo(42),
        dueDate: daysAgo(0)
    }
];

const JORDAN_JOURNALS: JournalEntry[] = [
    {
        id: 'jordan-journal-1',
        uid: 'mock-uid-jordan',
        content: 'Stable week. Craving intensity has been low outside of the usual Thursday-afternoon dip. Sleep has been the biggest lever for how the rest of the day goes.',
        moodScore: 7,
        tags: ['stability', 'craving-log'],
        createdAt: createMockTimestamp(hoursAgo(6)),
        isEncrypted: false
    }
];

// ----------------------------------------------------
// 6. LISA: Service Superstar (7 Years, Premium, Rose Theme)
// ----------------------------------------------------
const LISA_PROFILE: UserProfile = {
    uid: 'mock-uid-lisa',
    email: 'lisa@mrt.mock',
    displayName: 'Lisa',
    photoURL: null,
    sobrietyDate: createMockTimestamp(daysAgo(2555)),
    createdAt: createMockTimestamp(daysAgo(2600)),
    role: 'user',
    hasCompletedOnboarding: true,
    tier: 'premium',
    heroColor: 'rose',
    anchorSettings: {
        notifyCheckIn: true,
        notifyReading: true,
    }
};

const LISA_TASKS: Task[] = [
    {
        id: 'lisa-task-1',
        uid: 'mock-uid-lisa',
        title: 'Check in with sponsees',
        completed: true,
        status: 'completed',
        isRecurring: true,
        frequency: 'daily',
        currentStreak: 210,
        priority: 'High',
        category: 'Recovery',
        createdAt: daysAgo(210),
        dueDate: daysAgo(0),
        lastCompletedAt: daysAgo(0)
    },
    {
        id: 'lisa-task-2',
        uid: 'mock-uid-lisa',
        title: 'My own self-care check-in',
        completed: false,
        status: 'pending',
        isRecurring: true,
        frequency: 'daily',
        currentStreak: 3,
        priority: 'Medium',
        category: 'Health',
        createdAt: daysAgo(3),
        dueDate: daysAgo(0)
    }
];

const LISA_JOURNALS: JournalEntry[] = [
    {
        id: 'lisa-journal-1',
        uid: 'mock-uid-lisa',
        content: 'Reminded myself again tonight that I can\'t pour from an empty cup. Five sponsees is my real capacity, not four and "just one more."',
        moodScore: 7,
        tags: ['boundaries', 'service', 'self-care'],
        createdAt: createMockTimestamp(hoursAgo(5)),
        isEncrypted: false
    }
];

// Helper functions for easy querying
export function getMockProfile(email: string): UserProfile | null {
    if (email.startsWith('ned')) return NED_PROFILE;
    if (email.startsWith('maya')) return MAYA_PROFILE;
    if (email.startsWith('david')) return DAVID_PROFILE;
    if (email.startsWith('walt')) return WALT_PROFILE;
    if (email.startsWith('jordan')) return JORDAN_PROFILE;
    if (email.startsWith('lisa')) return LISA_PROFILE;
    return null;
}

export function getMockTasks(email: string): Task[] {
    if (email.startsWith('ned')) return NED_TASKS;
    if (email.startsWith('maya')) return MAYA_TASKS;
    if (email.startsWith('david')) return DAVID_TASKS;
    if (email.startsWith('walt')) return WALT_TASKS;
    if (email.startsWith('jordan')) return JORDAN_TASKS;
    if (email.startsWith('lisa')) return LISA_TASKS;
    return [];
}

export function getMockJournals(email: string): JournalEntry[] {
    if (email.startsWith('ned')) return NED_JOURNALS;
    if (email.startsWith('maya')) return MAYA_JOURNALS;
    if (email.startsWith('david')) return DAVID_JOURNALS;
    if (email.startsWith('walt')) return WALT_JOURNALS;
    if (email.startsWith('jordan')) return JORDAN_JOURNALS;
    if (email.startsWith('lisa')) return LISA_JOURNALS;
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

// Screenshot pipeline (TD-31): backs the mock branch added to useROSCAssessments.ts.
export function getMockROSCAssessments(email: string): ROSCAssessment[] {
    if (email.startsWith('walt')) return WALT_ROSC_ASSESSMENTS;
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
