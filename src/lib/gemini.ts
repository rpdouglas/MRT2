import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the API
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.error("Missing VITE_GEMINI_API_KEY in .env file");
}

const genAI = new GoogleGenerativeAI(API_KEY);

// UPDATED: Using the model explicitly found in your list
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export interface AnalysisResult {
  analysis: string;
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed';
  actionableSteps: string[];
}

/**
 * Analyzes a list of journal text entries to find patterns and insights.
 */
export async function analyzeJournalEntries(entries: string[]): Promise<AnalysisResult> {
  if (entries.length === 0) {
    throw new Error("No entries to analyze");
  }

  // 1. Prepare the Data
  const combinedText = entries.join("\n---\n");

  // 2. Engineer the Prompt
  const prompt = `
    You are an empathetic, wise, and insightful recovery coach for someone in a 12-step program.
    Your task is to analyze the following journal entries from the user and provide a summary of their emotional state and potential blind spots.

    USER ENTRIES:
    ${combinedText}

    INSTRUCTIONS:
    1. Identify the core emotional themes (e.g., "Anxiety about work," "Gratitude for family").
    2. Look for "cognitive distortions" or patterns that might lead to relapse.
    3. Suggest 3 small, concrete, positive actions they can take.

    FORMAT:
    Return ONLY a raw JSON object (no markdown formatting, no backticks) with this structure:
    {
      "analysis": "A 2-3 sentence empathetic summary of their recent headspace.",
      "sentiment": "positive" | "neutral" | "negative" | "mixed",
      "actionableSteps": ["Step 1", "Step 2", "Step 3"]
    }
  `;

  try {
    console.log("Sending request to Gemini (Model: gemini-2.5-flash)...");
    
    // 3. Call the API
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // 4. Clean and Parse JSON
    const cleanJson = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanJson) as AnalysisResult;

  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    throw new Error("Failed to generate insights. Please try again later.");
  }
}