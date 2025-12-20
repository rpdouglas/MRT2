// src/data/workbooks.ts

export interface Question {
  id: string;
  text: string;
  context?: string; // Optional context/quote from literature (The Insight)
  type?: 'input' | 'read_only'; // Defaults to 'input' if undefined
}

export interface WorkbookSection {
  id: string;
  title: string;
  description?: string;
  questions: Question[];
}

export interface Workbook {
  id: string;
  title: string;
  description: string;
  type: 'linear' | 'steps' | 'general';
  sections: WorkbookSection[];
}

// Helper to generate generic questions for sections we don't fully populate in this snippet
const generateQuestions = (count: number, prefix: string): Question[] => {
  return Array.from({ length: count }).map((_, i) => ({
    id: `${prefix}_q${i + 1}`,
    text: `Question ${i + 1}: Reflection point regarding ${prefix.replace(/_/g, ' ')}.`,
    type: 'input'
  }));
};

// --- 1. GENERAL RECOVERY WORKBOOK (25 Questions) ---
const generalQuestions: Question[] = [
  { id: 'gen_1', text: "What are the specific consequences of your addiction that led you to seek recovery?" },
  { id: 'gen_2', text: "Describe a time when you tried to control your using but failed." },
  { id: 'gen_3', text: "How has your addiction affected your relationships with family and friends?" },
  { id: 'gen_4', text: "What emotions trigger your desire to use?" },
  { id: 'gen_5', text: "List 5 things you are grateful for today." },
  { id: 'gen_6', text: "What does 'rock bottom' mean to you, and do you feel you hit it?" },
  { id: 'gen_7', text: "How does honesty play a role in your recovery?" },
  { id: 'gen_8', text: "What are your biggest fears about living sober?" },
  { id: 'gen_9', text: "Who are the people in your support network?" },
  { id: 'gen_10', text: "What hobbies or activities did you neglect during active addiction?" },
  { id: 'gen_11', text: "Describe your physical health during active addiction versus now." },
  { id: 'gen_12', text: "What lies did you tell yourself to justify your using?" },
  { id: 'gen_13', text: "How has your addiction impacted your career or education?" },
  { id: 'gen_14', text: "What specific boundaries do you need to set to protect your sobriety?" },
  { id: 'gen_15', text: "How do you handle stress without substances?" },
  { id: 'gen_16', text: "What does a 'spiritual awakening' mean to you?" },
  { id: 'gen_17', text: "List 3 short-term goals for your recovery." },
  { id: 'gen_18', text: "List 3 long-term goals for your life." },
  { id: 'gen_19', text: "How can you be of service to others?" },
  { id: 'gen_20', text: "What resentments are you holding onto, and how do they affect you?" },
  { id: 'gen_21', text: "Describe a situation where you successfully navigated a craving." },
  { id: 'gen_22', text: "What does 'taking it one day at a time' look like in practice?" },
  { id: 'gen_23', text: "How do you practice self-care?" },
  { id: 'gen_24', text: "What advice would you give to your past self?" },
  { id: 'gen_25', text: "Why is recovery worth it for you?" },
];

// --- 2. 12-STEP WORKBOOK (12 Steps, ~15 Qs each) ---
const step1Questions: Question[] = [
  { id: 's1_q1', text: "Do you accept that you have a disease of addiction?", context: "We admitted we were powerless over our addiction..." },
  { id: 's1_q2', text: "How has the disease of addiction manifested in your life?" },
  { id: 's1_q3', text: "Have you ever tried to stop on your own and found you couldn't?" },
  { id: 's1_q4', text: "What specific incidents indicate you have lost control over your usage?" },
  { id: 's1_q5', text: "How has your thinking been distorted by addiction (denial, rationalization)?" },
  { id: 's1_q6', text: "In what ways have you been powerless over your behavior?" },
  { id: 's1_q7', text: "Have you lost self-respect due to your addiction?" },
  { id: 's1_q8', text: "How has your addiction affected you physically?" },
  { id: 's1_q9', text: "How has your addiction affected you mentally?" },
  { id: 's1_q10', text: "How has your addiction affected you spiritually?" },
  { id: 's1_q11', text: "How has your addiction affected you emotionally?" },
  { id: 's1_q12', text: "What is unmanageability to you?" },
  { id: 's1_q13', text: "What are some examples of unmanageability in your life?" },
  { id: 's1_q14', text: "Are you ready to admit you are an addict?" },
  { id: 's1_q15', text: "What reservations do you still have about staying clean?" },
];

const twelveStepSections: WorkbookSection[] = [
  { id: 'step_1', title: 'Step 1', description: 'Powerlessness & Unmanageability', questions: step1Questions },
  { id: 'step_2', title: 'Step 2', description: 'Came to believe', questions: generateQuestions(15, 'step_2') },
  { id: 'step_3', title: 'Step 3', description: 'Turning it over', questions: generateQuestions(15, 'step_3') },
  { id: 'step_4', title: 'Step 4', description: 'Searching and fearless moral inventory', questions: generateQuestions(15, 'step_4') },
  { id: 'step_5', title: 'Step 5', description: 'Admitted to God, ourselves, and another', questions: generateQuestions(15, 'step_5') },
  { id: 'step_6', title: 'Step 6', description: 'Entirely ready', questions: generateQuestions(15, 'step_6') },
  { id: 'step_7', title: 'Step 7', description: 'Humbly asked Him', questions: generateQuestions(15, 'step_7') },
  { id: 'step_8', title: 'Step 8', description: 'List of persons we had harmed', questions: generateQuestions(15, 'step_8') },
  { id: 'step_9', title: 'Step 9', description: 'Direct amends', questions: generateQuestions(15, 'step_9') },
  { id: 'step_10', title: 'Step 10', description: 'Continued to take personal inventory', questions: generateQuestions(15, 'step_10') },
  { id: 'step_11', title: 'Step 11', description: 'Sought through prayer and meditation', questions: generateQuestions(15, 'step_11') },
  { id: 'step_12', title: 'Step 12', description: 'Spiritual awakening', questions: generateQuestions(15, 'step_12') },
];

// --- 3. RECOVERY DHARMA WORKBOOK (The Four Noble Truths) ---

// 1. First Noble Truth
const dharmaTruth1: Question[] = [
  { 
    id: 'rd_t1_intro', 
    type: 'read_only', 
    text: `The First Noble Truth is not a pessimistic claim that "life is miserable." rather, it is a realistic assessment that dissatisfaction, stress, and pain are part of the human experience.\n\nIn the context of addiction, this truth is the acknowledgment of our struggle. It is the realization that our compulsive behaviors—whether to substances, people, or processes—have become a source of suffering rather than a solution to it.\n\nWe admit that despite our best efforts to control it, the cycle has become unmanageable and painful.` 
  },
  { 
    id: 'rd_t1_q1', 
    type: 'input',
    text: "In what specific ways has my main coping mechanism (my addiction) stopped working for me?", 
    context: "We acknowledge that the things we used to cope with our pain have turned on us. What once provided relief now creates more suffering." 
  },
  { 
    id: 'rd_t1_q2', 
    type: 'input',
    text: "Can I identify the difference between 'pain' (the inevitable events of life) and 'suffering' (my reaction and resistance to those events)?", 
    context: "Pain is inevitable; suffering is optional. We suffer when we cling to how we want things to be, rather than accepting how they are." 
  },
  { 
    id: 'rd_t1_q3', 
    type: 'input',
    text: "Where in my body do I feel the physical sensation of 'unsatisfactoriness' or restlessness when I am not using/acting out?", 
    context: "Mindfulness begins with the body. The First Truth asks us to turn toward the discomfort we have been running from, rather than away from it." 
  },
  { 
    id: 'rd_t1_q4', 
    type: 'input',
    text: "How has my refusal to accept the reality of my situation prolonged my cycle of addiction?", 
    context: "Denial is a form of protection, but eventually, it becomes a prison. Acceptance is the first step toward unlocking the door." 
  },
  { 
    id: 'rd_t1_q5', 
    type: 'input',
    text: "Looking back, can I see how my 'solution' eventually became the primary problem in my life?", 
    context: "We realize that we have been trying to fill a spiritual void with material things, substances, or validation, and it simply does not work." 
  }
];

// 2. Second Noble Truth
const dharmaTruth2: Question[] = [
  { 
    id: 'rd_t2_intro', 
    type: 'read_only', 
    text: `The Second Truth teaches us that the root cause of our suffering is craving (thirst) and clinging.\n\nIt isn't just the drugs, the alcohol, or the behavior that is the problem; it is the underlying drive to fix the way we feel instantly. It is the deep-seated belief that "this moment is not enough" and that we need something external to make us whole.\n\nWe suffer because we cling to pleasure and push away pain, creating a constant tug-of-war in our minds.` 
  },
  { 
    id: 'rd_t2_q1', 
    type: 'input',
    text: "What is the specific feeling or emotion I am usually trying to escape when the craving arises?", 
    context: "Craving often arises as a response to an underlying discomfort—loneliness, fear, boredom, or shame. We use addiction to numb these feelings." 
  },
  { 
    id: 'rd_t2_q2', 
    type: 'input',
    text: "Can I identify a time recently when I clung to a pleasant experience so tightly that I ruined it when it naturally ended?", 
    context: "Impermanence is a law of nature. Suffering arises when we demand that temporary pleasure lasts forever." 
  },
  { 
    id: 'rd_t2_q3', 
    type: 'input',
    text: "What \"stories\" does my mind tell me about what will happen if I don't give in to the craving?", 
    context: "The mind creates catastrophic narratives to justify acting on impulse. We learn to observe these thoughts without believing them." 
  },
  { 
    id: 'rd_t2_q4', 
    type: 'input',
    text: "How does my attachment to a specific identity (e.g., 'the victim,' 'the addict,' 'the tough one') keep me stuck in old patterns?", 
    context: "We often cling to our suffering because it is familiar. Letting go of who we think we are allows us to become who we can be." 
  },
  { 
    id: 'rd_t2_q5', 
    type: 'input',
    text: "In what ways do I demand that the world conform to my expectations, and how does that lead to anger or resentment?", 
    context: "Expectations are resentments waiting to happen. When we stop fighting reality, the craving to escape reality diminishes." 
  }
];

// 3. Third Noble Truth
const dharmaTruth3: Question[] = [
  { 
    id: 'rd_t3_intro', 
    type: 'read_only', 
    text: `The Third Truth is the good news: Recovery is possible.\n\nSuffering is not permanent, and because it has a cause (craving), it can end. This is the truth of Cessation. It doesn’t mean we will never feel pain again, but it means we don't have to be enslaved by our reactions to it.\n\nWe can find a freedom that isn't dependent on external circumstances. We can experience peace right now, even in the midst of difficulty, by letting go of the demand for things to be different.` 
  },
  { 
    id: 'rd_t3_q1', 
    type: 'input',
    text: "Can I recall a moment in my recovery (or life) where I felt a sense of peace without needing to change anything?", 
    context: "Freedom is available in any moment where we stop fighting. This is the glimpse of Nirvana—the cooling of the flames of desire." 
  },
  { 
    id: 'rd_t3_q2', 
    type: 'input',
    text: "What would my life look like if I believed, truly, that I am already 'whole' and don't need to be 'fixed'?", 
    context: "Our true nature is wise and compassionate. Recovery is not about building a new you, but uncovering the you that was there all along." 
  },
  { 
    id: 'rd_t3_q3', 
    type: 'input',
    text: "If I let go of the need to control the outcome of my current situation, what specific burden would be lifted off my shoulders?", 
    context: "Surrender is not giving up; it is giving over. We let go of the illusion of control and find safety in the present moment." 
  },
  { 
    id: 'rd_t3_q4', 
    type: 'input',
    text: "How does the idea of 'impermanence' give me hope regarding my current struggles or cravings?", 
    context: "This too shall pass. Knowing that cravings are like weather—storms that come and go—helps us ride them out without drowning." 
  },
  { 
    id: 'rd_t3_q5', 
    type: 'input',
    text: "Who in my life (or in my Sangha/community) represents the possibility of freedom to me, and what qualities do they embody?", 
    context: "We take refuge in the Sangha. Seeing the recovery of others proves that the Third Noble Truth is a reality, not just a theory." 
  }
];

// 4. Fourth Noble Truth
const dharmaTruth4: Question[] = [
  { 
    id: 'rd_t4_intro', 
    type: 'read_only', 
    text: `The Fourth Truth is the Eightfold Path—the practical "how-to" guide for recovery.\n\nIt is a set of practices that helps us live ethically, train our minds, and cultivate wisdom. It covers Wisdom (Right View, Intention), Ethics (Right Speech, Action, Livelihood), and Meditation (Right Effort, Mindfulness, Concentration).\n\nThis is not a linear set of steps but a wheel of practice where each part supports the others. It is the daily discipline of recovery.` 
  },
  { 
    id: 'rd_t4_q1', 
    type: 'input',
    text: "Right Intention: Am I approaching my recovery today with an intention of kindness toward myself, or am I being harsh and critical?", 
    context: "Renunciation is not about punishment; it is an act of love. We let go of harmful behaviors because we care about our own well-being." 
  },
  { 
    id: 'rd_t4_q2', 
    type: 'input',
    text: "Right Speech: How have I used my words (to others or myself) to cause harm recently, and how can I practice honesty without cruelty?", 
    context: "Truthfulness is the foundation of trust. We cannot recover while hiding behind lies, but our truth must be spoken with compassion." 
  },
  { 
    id: 'rd_t4_q3', 
    type: 'input',
    text: "Right Action: What is one small, ethical action I can take today that aligns with the person I want to become?", 
    context: "Recovery is lived in the small moments. Every time we choose not to harm, we are strengthening our path to freedom." 
  },
  { 
    id: 'rd_t4_q4', 
    type: 'input',
    text: "Right Mindfulness: specific situations trigger me to go on 'autopilot,' and how can I bring more awareness to those moments?", 
    context: "Mindfulness is the pause between the trigger and the reaction. In that pause lies our freedom to choose a different response." 
  },
  { 
    id: 'rd_t4_q5', 
    type: 'input',
    text: "Right Effort: Am I striving too hard (restlessness) or not hard enough (complacency)? How can I find the 'Middle Way' in my recovery today?", 
    context: "The Middle Way is the path of balance. We avoid the extremes of indulgence and severe asceticism. We practice with gentle persistence." 
  }
];

const dharmaSections: WorkbookSection[] = [
  { id: 'rd_truth_1', title: 'First Noble Truth', description: 'There is suffering', questions: dharmaTruth1 },
  { id: 'rd_truth_2', title: 'Second Noble Truth', description: 'The cause of suffering', questions: dharmaTruth2 },
  { id: 'rd_truth_3', title: 'Third Noble Truth', description: 'The end of suffering', questions: dharmaTruth3 },
  { id: 'rd_truth_4', title: 'Fourth Noble Truth', description: 'The path', questions: dharmaTruth4 },
];

// --- MASTER REGISTRY ---
export const WORKBOOKS: Workbook[] = [
  {
    id: 'general_recovery',
    title: 'General Recovery Workbook',
    description: 'A comprehensive 25-question guide to explore the foundations of your recovery journey.',
    type: 'general',
    sections: [{ id: 'main', title: 'Core Questions', questions: generalQuestions }]
  },
  {
    id: '12_steps',
    title: '12-Step Workbook',
    description: 'A rigorous journey through the 12 Steps. 15 questions per step to prepare for sponsor work.',
    type: 'steps',
    sections: twelveStepSections
  },
  {
    id: 'recovery_dharma',
    title: 'Recovery Dharma',
    description: 'Buddhist-inspired path to recovery focusing on the Four Noble Truths and Eightfold Path.',
    type: 'steps',
    sections: dharmaSections
  }
];

export function getWorkbook(id: string): Workbook | undefined {
  return WORKBOOKS.find(w => w.id === id);
}