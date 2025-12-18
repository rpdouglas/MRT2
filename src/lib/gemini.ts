import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

// --- 1. JOURNAL ANALYSIS ---

export interface AnalysisResult {
  analysis: string;
  mood: string;
  sentiment: string; // <--- ADDED THIS FIELD
  actionableSteps: string[];
}

export async function analyzeJournalEntries(journalEntries: string[]): Promise<AnalysisResult> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      You are a compassionate, wise, and experienced Recovery Coach and Sponsor. 
      Analyze the following journal entries from a user in recovery from addiction.
      
      Entries:
      ${JSON.stringify(journalEntries)}

      Return a JSON object with the following structure (do NOT use Markdown formatting, just raw JSON):
      {
        "analysis": "A 2-3 sentence summary of their emotional state and progress.",
        "mood": "One word summary (e.g., Hopeful, Struggling, Determined)",
        "sentiment": "Positive, Neutral, or Negative", 
        "actionableSteps": ["Step 1", "Step 2", "Step 3"]
      }

      The actionable steps should be practical, recovery-focused suggestions (e.g., "Call your sponsor", "Go to a meeting", "Practice self-care").
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean up potential markdown code blocks if the model adds them
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();

    return JSON.parse(cleanText) as AnalysisResult;

  } catch (error) {
    console.error("Gemini API Error:", error);
    // Fallback if API fails or key is missing
    return {
      analysis: "Great job keeping up with your journaling. Keep coming back!",
      mood: "Stable",
      sentiment: "Positive", // <--- ADDED FALLBACK
      actionableSteps: ["Attend a meeting", "Call a friend", "Meditate for 5 mins"]
    };
  }
}

// --- 2. WORKBOOK ANALYSIS ---

export interface WorkbookInsight {
  feedback: string;
  encouragement: string;
}

export async function analyzeWorkbook(sectionTitle: string, qaPairs: { question: string, answer: string }[]): Promise<WorkbookInsight> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      You are a compassionate Recovery Sponsor reviewing a sponsee's workbook answers.
      
      Workbook Section: "${sectionTitle}"
      
      User's Q&A:
      ${JSON.stringify(qaPairs)}

      Please analyze their answers for honesty, depth, and recovery understanding.
      Return a JSON object with this structure (no Markdown):
      {
        "feedback": "A warm, insightful paragraph (3-4 sentences) reflecting on what they wrote. Highlight a specific strength you see in their answers.",
        "encouragement": "A short, punchy closing statement of support."
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();

    return JSON.parse(cleanText) as WorkbookInsight;

  } catch (error) {
    console.error("Gemini Workbook Error:", error);
    return {
      feedback: "You're doing important work here. Honest self-reflection is the key to freedom. Keep pushing forward.",
      encouragement: "One day at a time!"
    };
  }
}