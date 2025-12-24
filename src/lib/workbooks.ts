// src/lib/workbooks.ts

export interface Question {
  id: string;
  text: string;
  helperText?: string;
}

export interface Section {
  id: string;
  title: string;
  questions: Question[];
}

export interface Workbook {
  id: string;
  title: string;
  description: string;
  sections: Section[];
  estimatedTime?: string;
}

// DATA: You can expand this or move to Firestore later
const WORKBOOKS: Workbook[] = [
  {
    id: "step1",
    title: "Step 1: Honesty",
    description: "We admitted we were powerless over our addiction - that our lives had become unmanageable.",
    estimatedTime: "45 mins",
    sections: [
        {
            id: "s1_physical",
            title: "Physical Allergy",
            questions: [
                { id: "q1", text: "Describe the last time you tried to control your using. What happened?", helperText: "Focus on the physical sensation of craving." },
                { id: "q2", text: "Have you ever tried to stop and found you couldn't stay stopped?", helperText: "List specific dates or attempts." }
            ]
        },
        {
            id: "s1_unmanageability",
            title: "Unmanageability",
            questions: [
                { id: "q3", text: "How has your addiction affected your financial situation?", helperText: "Be specific about debts or lost opportunities." },
                { id: "q4", text: "How has your addiction affected your personal relationships?", helperText: "Think about trust, reliability, and presence." }
            ]
        }
    ]
  },
  {
      id: "cbt_foundations",
      title: "CBT: Thought Records",
      description: "Learn to catch, check, and change negative thought patterns.",
      estimatedTime: "20 mins",
      sections: [
          {
              id: "cbt_catch",
              title: "Catching the Thought",
              questions: [
                  { id: "q1", text: "What was the situation?", helperText: "Who, what, where, when." },
                  { id: "q2", text: "What was the automatic negative thought?", helperText: "I am worthless, This will never work, etc." }
              ]
          }
      ]
  }
];

export async function getWorkbookById(id: string): Promise<Workbook | undefined> {
  // Simulate network delay for realism
  await new Promise(resolve => setTimeout(resolve, 50));
  return WORKBOOKS.find(wb => wb.id === id);
}

export async function getAllWorkbooks(): Promise<Workbook[]> {
    await new Promise(resolve => setTimeout(resolve, 50));
    return WORKBOOKS;
}