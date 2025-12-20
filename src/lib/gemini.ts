import { 
  GoogleGenerativeAI, 
  HarmCategory, 
  HarmBlockThreshold,
  type GenerationConfig,
  type SafetySetting
} from "@google/generative-ai";

// --- Configuration ---
// Ensure your VITE_GEMINI_API_KEY is set in .env
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
if (!API_KEY) {
  console.error("Missing VITE_GEMINI_API_KEY in environment variables");
}

const genAI = new GoogleGenerativeAI(API_KEY);

// Master Build Guide v2.6 specifies Gemini 2.5 Flash
const MODEL_NAME = "gemini-2.5-flash"; 

const generationConfig: GenerationConfig = {
  temperature: 0.7, // Balanced for creative but structured analysis
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: "application/json", // Enforce JSON mode
};

// Safety Settings: Adjusted for Recovery Context
const safetySettings: SafetySetting[] = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

// --- 1. JOURNAL ANALYSIS (Recovery Compass) ---

export interface AnalysisResult {
  sentiment: 'Positive' | 'Neutral' | 'Negative';
  mood: string;
  summary: string;
  risk_analysis: string;
  positive_reinforcement: string;
  tool_suggestions: string[];
}

/**
 * Analyzes journal entries using the "Recovery Compass" framework.
 */
export async function analyzeJournalEntries(journalEntries: string[]): Promise<AnalysisResult> {
  try {
    const model = genAI.getGenerativeModel({ 
      model: MODEL_NAME,
      generationConfig,
      safetySettings
    });

    const prompt = `
      You are an expert recovery sponsor and therapist proxy for a user in addiction recovery. 
      Analyze the following journal entries and provide a structured "Recovery Compass" analysis.
      
      Entries:
      ${JSON.stringify(journalEntries)}

      Return a JSON object with this EXACT structure (no Markdown):
      {
        "sentiment": "Positive" | "Neutral" | "Negative",
        "mood": "Two word description of the emotional tone (e.g. Anxious Hope)",
        "summary": "A brief, 2-3 sentence synthesis of the user's current headspace.",
        "risk_analysis": "Identify potential relapse triggers, cognitive distortions, or HALT (Hungry, Angry, Lonely, Tired) signs. Be gentle but direct.",
        "positive_reinforcement": "Highlight specific examples of resilience, gratitude, or good recovery work found in the text.",
        "tool_suggestions": ["Tool 1", "Tool 2", "Tool 3"]
      }

      The tool_suggestions must be practical, recovery-focused actions.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean up potential markdown code blocks
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();

    return JSON.parse(cleanText) as AnalysisResult;

  } catch (error) {
    console.error("Gemini Journal Analysis Failed:", error);
    // Fallback if API fails
    return {
      sentiment: 'Neutral',
      mood: 'System Offline',
      summary: "Unable to generate analysis. Keep writing!",
      risk_analysis: 'None detected.',
      positive_reinforcement: 'Your commitment to journaling is a strength.',
      tool_suggestions: ['Check internet connection', 'Try again later']
    };
  }
}

// --- 2. WORKBOOK ANALYSIS (Restored Original Structure) ---

export interface WorkbookInsight {
  feedback: string;
  encouragement: string;
}

export async function analyzeFullWorkbook(workbookTitle: string, fullContent: string | Record<string, string>): Promise<WorkbookInsight> {
  try {
    const model = genAI.getGenerativeModel({ 
        model: MODEL_NAME,
        generationConfig,
        safetySettings
    });

    // Handle both string and Record input types for flexibility
    const contentString = typeof fullContent === 'string' 
        ? fullContent 
        : Object.entries(fullContent).map(([k, v]) => `Q: ${k}\nA: ${v}`).join('\n');

    const prompt = `
      You are a compassionate Recovery Sponsor reviewing a sponsee's entire workbook.
      
      Workbook: "${workbookTitle}"
      
      User's Answers:
      ${contentString}

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

// --- 3. LEGACY SUPPORT ---

// Deprecated single-section analyzer (kept for type safety if referenced elsewhere)
export async function analyzeWorkbook(sectionTitle: string, qaPairs: { question: string, answer: string }[]): Promise<WorkbookInsight> {
  return analyzeFullWorkbook(sectionTitle, JSON.stringify(qaPairs));
}