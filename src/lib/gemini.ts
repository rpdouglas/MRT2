import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini
// UPDATED: Using 'gemini-1.5-flash' (standard) or your preferred 'gemini-2.5-flash' if available.
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); 

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
  scope_context: string; 
  pillars: {
    understanding: string; 
    emotional_resonance: string; 
    blind_spots: string; 
  };
  suggested_actions: string[]; 
}

// --- Helpers ---

/**
 * Robust JSON parser that strips Markdown code blocks (```json ... ```)
 * to prevent JSON.parse() from crashing.
 */
function cleanAndParseJSON(text: string): unknown {
  try {
    // 1. Remove markdown code fences
    let cleanText = text.replace(/```json/g, '').replace(/```/g, '');
    
    // 2. Trim whitespace
    cleanText = cleanText.trim();
    
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("JSON Parsing Failed:", error);
    console.log("Raw Text was:", text);
    throw new Error("Failed to parse AI response.");
  }
}

/**
 * Truncates text to a safe token limit (~12,000 characters) to prevent 429 errors.
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
      const error = err as { message?: string; status?: number };
      
      const isRateLimit = error.message?.includes('429') || error.status === 429;
      const isServerOverload = error.message?.includes('503') || error.status === 503;
      
      if ((isRateLimit || isServerOverload) && i < retries) {
        const waitTime = 2000 * (i + 1);
        console.warn(`Gemini API Busy (Attempt ${i + 1}). Retrying in ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      console.error("Gemini Generation Error:", error);
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

  const rawText = entries.join('\n---\n');
  const safeText = truncatePayload(rawText);

  try {
    const prompt = `
      Act as a compassionate, wise, and highly experienced addiction recovery sponsor.
      Analyze the following journal entries from a user in recovery.
      
      Entries:
      ${safeText}
      
      Return a JSON object with the following fields:
      - summary: A 2-3 sentence compassionate summary of the user's current state.
      - mood: A 1-word descriptor of the overall mood (e.g., "Reflective", "Anxious", "Hopeful").
      - sentiment: One of "Positive", "Neutral", "Negative", "Mixed".
      - risk_analysis: Identify any potential relapse triggers or cognitive distortions.
      - positive_reinforcement: Highlight a strength or win demonstrated in the entries.
      - tool_suggestions: A list of 3 specific, actionable recovery tools (e.g., "Call a friend", "5-min meditation").
      
      Output ONLY raw JSON. Do not use Markdown formatting.
    `;

    const textResponse = await generateWithRetry(prompt);
    if (!textResponse) return null;

    return cleanAndParseJSON(textResponse) as AnalysisResult;

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

  const safeContent = truncatePayload(content);

  try {
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
          understanding: "Assessment of how well the user grasps the concepts.",
          emotional_resonance: "Observation of emotional honesty and barriers.",
          blind_spots: "Gentle pointing out of areas they might be avoiding."
      }
      - suggested_actions: A list of 3 specific, concrete tasks to integrate this learning.
      
      Output ONLY raw JSON. Do not use Markdown formatting.
    `;

    const textResponse = await generateWithRetry(prompt);
    if (!textResponse) return null;

    return cleanAndParseJSON(textResponse) as WorkbookAnalysisResult;

  } catch (error) {
    console.error("Workbook Analysis Error:", error);
    return null;
  }
};

// --- NEW: AI Coaching (Single Question Feedback) ---

export const getGeminiCoaching = async (question: string, answer: string): Promise<string> => {
    if (!API_KEY) return "AI Coach Unavailable (Missing Key)";
    
    // Truncate if answer is massive to save tokens
    const safeAnswer = truncatePayload(answer, 2000); 

    const prompt = `
        You are a wise, compassionate recovery coach (like a 12-step sponsor or therapist).
        A user is working on a workbook and just answered this question:
        "${question}"

        Their Answer:
        "${safeAnswer}"

        Provide a short (2-3 sentences), encouraging, and insightful response.
        - Validate their honesty.
        - Gently challenge them to go deeper if the answer seems surface-level.
        - Do NOT just repeat what they said. Offer a new perspective or a follow-up reflection.
    `;

    try {
        const response = await generateWithRetry(prompt);
        return response || "Coach is taking a moment to reflect. Try again.";
    } catch (error) {
        console.error("Coaching Error:", error);
        return "Coach is currently offline.";
    }
};