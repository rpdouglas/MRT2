import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini
// UPDATED: Set to 'gemini-2.5-flash' based on your available model list.
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// --- Types ---

export interface AnalysisResult {
  summary: string;
  mood: string;
  sentiment: 'Positive' | 'Neutral' | 'Negative' | 'Mixed';
  risk_analysis: string;
  positive_reinforcement: string;
  tool_suggestions: string[];
}

export interface WorkbookAnalysisResult {
  scope_context: string; // e.g., "Step 1 Review" or "Full Journey"
  pillars: {
    understanding: string; // How well they grasped the concept
    emotional_resonance: string; // The emotional tone/barriers detected
    blind_spots: string; // Things they might be missing
  };
  suggested_actions: string[]; // Concrete tasks for the habit tracker
}

// --- Helpers ---

/**
 * Truncates text to a safe token limit (~12,000 characters) to prevent 429 errors.
 * This ensures we don't blow the 'Tokens Per Minute' quota on large journals.
 */
const truncatePayload = (text: string, limit: number = 12000): string => {
  if (text.length <= limit) return text;
  return text.substring(0, limit) + "...(truncated for analysis)";
};

/**
 * Wraps the API call with a retry mechanism for 429 (Rate Limit) errors.
 */
const generateWithRetry = async (prompt: string, retries = 2): Promise<string | null> => {
  for (let i = 0; i <= retries; i++) {
    try {
      const result = await model.generateContent(prompt);
      const response = result.response;
      return response.text();
    } catch (err: unknown) {
      // Type Guard: Safely cast error to check properties
      const error = err as { message?: string; status?: number };
      
      // Check for 429 (Too Many Requests) or 503 (Service Unavailable)
      const isRateLimit = error.message?.includes('429') || error.status === 429;
      const isServerOverload = error.message?.includes('503') || error.status === 503;
      
      if ((isRateLimit || isServerOverload) && i < retries) {
        // Linear Backoff: Wait 2s, then 4s, etc.
        const waitTime = 2000 * (i + 1);
        console.warn(`Gemini API Busy (Attempt ${i + 1}). Retrying in ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      console.error("Gemini Generation Error:", error);
      // Don't retry other errors (e.g., 400 Bad Request / API Key issues)
      return null;
    }
  }
  return null;
};

// --- Journal Analysis ---

export const analyzeJournalEntries = async (entries: string[]): Promise<AnalysisResult | null> => {
  if (!API_KEY) {
    console.warn("Gemini API Key missing.");
    return null;
  }

  // 1. Optimization: Join and Truncate
  const rawText = entries.join('\n---\n');
  const safeText = truncatePayload(rawText);

  try {
    const prompt = `
      Act as a compassionate, wise, and highly experienced addiction recovery sponsor and therapist.
      Analyze the following journal entries from a user in recovery.
      
      Entries:
      ${safeText}
      
      Return a JSON object with the following fields:
      - summary: A 2-3 sentence compassionate summary of the user's current state.
      - mood: A 1-word descriptor of the overall mood (e.g., "Reflective", "Anxious", "Hopeful").
      - sentiment: One of "Positive", "Neutral", "Negative", "Mixed".
      - risk_analysis: Identify any potential relapse triggers or cognitive distortions present (be gentle but vigilant).
      - positive_reinforcement: Highlight a strength or win demonstrated in the entries.
      - tool_suggestions: A list of 3 specific, actionable recovery tools or short tasks they should try (e.g., "Call a friend", "5-min meditation", "Play the tape through").
      
      Output ONLY raw JSON. Do not use Markdown formatting.
    `;

    const textResponse = await generateWithRetry(prompt);
    
    if (!textResponse) return null;

    // Clean markdown blocks if present (Gemini sometimes adds ```json)
    const cleanedText = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanedText) as AnalysisResult;

  } catch (error) {
    console.error("Gemini Processing Error:", error);
    return null;
  }
};

// --- Workbook Analysis ---

export const analyzeWorkbookContent = async (
  content: string, 
  scope: 'section' | 'workbook' | 'global',
  contextTitle: string
): Promise<WorkbookAnalysisResult | null> => {
  if (!API_KEY) return null;

  // 1. Optimization: Truncate
  const safeContent = truncatePayload(content);

  try {
    // Tailor persona based on scope
    let persona = "a supportive 12-step sponsor";
    if (scope === 'workbook') persona = "a comprehensive recovery program director";
    if (scope === 'global') persona = "a holistic spiritual guide reviewing the entire life journey";

    const prompt = `
      Act as ${persona}.
      Review the following workbook Q&A content from a user in recovery.
      Context: ${contextTitle} (${scope} level review).
      
      Content to Analyze:
      ${safeContent}

      Return a JSON object with:
      - scope_context: A short title for this analysis (e.g., "Review of Step 1").
      - pillars: {
          understanding: "Assessment of how well the user grasps the spiritual/recovery concepts.",
          emotional_resonance: "Observation of the emotional honesty and any barriers (fear, shame, pride).",
          blind_spots: "Gentle pointing out of areas they might be avoiding or rationalizing."
      }
      - suggested_actions: A list of 3 specific, concrete, one-sentence tasks to integrate this learning into daily life (e.g., "Share this inventory with a mentor", "Practice 5 mins of silence").
      
      Output ONLY raw JSON. Do not use Markdown formatting.
    `;

    const textResponse = await generateWithRetry(prompt);

    if (!textResponse) return null;

    const cleanedText = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanedText) as WorkbookAnalysisResult;

  } catch (error) {
    console.error("Workbook Analysis Error:", error);
    return null;
  }
};