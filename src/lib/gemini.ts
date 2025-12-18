import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini
// Ensure your VITE_GEMINI_API_KEY is set in .env
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

// --- 1. JOURNAL ANALYSIS ---

export interface AnalysisResult {
  analysis: string;
  mood: string;
  sentiment: string;
  actionableSteps: string[];
}

export async function analyzeJournalEntries(journalEntries: string[]): Promise<AnalysisResult> {
  try {
    // UPDATED: Using 'gemini-2.5-flash' which is the stable release as of Dec 2025
    //
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

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
      sentiment: "Positive",
      actionableSteps: ["Attend a meeting", "Call a friend", "Meditate for 5 mins"]
    };
  }
}

// --- 2. WORKBOOK ANALYSIS ---

export interface WorkbookInsight {
  feedback: string;
  encouragement: string;
}

export async function analyzeFullWorkbook(workbookTitle: string, fullContent: string): Promise<WorkbookInsight> {
  try {
    // UPDATED: Using 'gemini-2.5-flash'
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      You are a compassionate Recovery Sponsor reviewing a sponsee's entire workbook.
      
      Workbook: "${workbookTitle}"
      
      User's Answers (grouped by section):
      ${fullContent}

      Please analyze their work holistically. Look for patterns across different sections, emotional trajectory, and depth of honesty.
      
      Return a JSON object with this structure (no Markdown):
      {
        "feedback": "A deep, insightful paragraph (4-6 sentences) connecting the dots between their answers. Mention specific patterns you notice across the workbook.",
        "encouragement": "A strong, motivating closing statement."
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
      feedback: "You have done a significant amount of work here. The consistency in your answers shows a real desire for change.",
      encouragement: "Keep trusting the process!"
    };
  }
}

// Deprecated single-section analyzer (kept for type safety if referenced elsewhere)
export async function analyzeWorkbook(sectionTitle: string, qaPairs: { question: string, answer: string }[]): Promise<WorkbookInsight> {
  return analyzeFullWorkbook(sectionTitle, JSON.stringify(qaPairs));
}