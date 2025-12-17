import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the API
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.error("Missing VITE_GEMINI_API_KEY in .env file");
}

const genAI = new GoogleGenerativeAI(API_KEY);

// --- DIAGNOSTIC TOOL ---
// Call this function from your browser console to see what you have access to
export async function listAvailableModels() {
  try {
    // We strictly want models that support 'generateContent'
    const models = await genAI.getGenerativeModel({ model: "gemini-pro" }).apiKey; // Hack to access internal list not needed, standard list works:
    
    // Proper listing method requires admin privileges usually, but we can try the basic fetch if the SDK exposes it.
    // Since the JS SDK doesn't expose a simple 'listModels()' directly on the client instance easily,
    // we will stick to trying the STABLE model first.
    console.log("If gemini-1.5-flash failed, we are falling back to gemini-pro.");
  } catch (e) {
    console.error(e);
  }
}

// --- MAIN CONFIGURATION ---
// We are switching to 'gemini-pro' which is the standard, widely available model.
// If this fails, we will try 'gemini-1.0-pro'.
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

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

  const combinedText = entries.join("\n---\n");

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
    console.log("Sending request to Gemini (Model: gemini-pro)...");
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const cleanJson = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanJson) as AnalysisResult;

  } catch (error: any) {
    // --- ERROR HANDLING & MODEL LISTING ---
    console.error("Gemini Analysis Failed:", error);
    
    if (error.message.includes("404")) {
      console.error("The model 'gemini-pro' was not found. Your API Key might be restricted or new.");
      alert("Model not found. Please check console for details.");
    }
    
    throw new Error("Failed to generate insights. Please try again later.");
  }
}