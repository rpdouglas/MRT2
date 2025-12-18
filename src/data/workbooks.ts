export interface Question {
  id: string;
  text: string;
  context?: string; // Optional context/quote from literature
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

// --- 3. RECOVERY DHARMA WORKBOOK ---
const dharmaSections: WorkbookSection[] = [
  { id: 'rd_truth_1', title: 'First Noble Truth', description: 'There is suffering', questions: generateQuestions(10, 'dharma_1') },
  { id: 'rd_truth_2', title: 'Second Noble Truth', description: 'The cause of suffering', questions: generateQuestions(10, 'dharma_2') },
  { id: 'rd_truth_3', title: 'Third Noble Truth', description: 'The end of suffering', questions: generateQuestions(10, 'dharma_3') },
  { id: 'rd_truth_4', title: 'Fourth Noble Truth', description: 'The path', questions: generateQuestions(10, 'dharma_4') },
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