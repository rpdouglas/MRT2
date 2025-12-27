import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GOOGLE_AI_API_KEY || '');

// --- Configuration ---
const GENERATION_CONFIG = {
  temperature: 0.7,
  topP: 0.8,
  topK: 40,
  maxOutputTokens: 8192,
};

// --- Interfaces ---

// 1. Single/Short Journal Analysis
export interface AIAnalysisResult {
    sentiment: 'Positive' | 'Neutral' | 'Negative';
    moodScore: number;
    summary: string;
    actionableSteps: string[];
    risks: string[];
}
// Alias for backward compatibility with insights.ts
export type AnalysisResult = AIAnalysisResult;

// 2. Comparative/Wizard Analysis
export interface ComparativeAnalysisResult {
    trajectory: 'Improving' | 'Stable' | 'Declining' | 'Fluctuating';
    key_themes: string[];
    comparison_summary: string;
    wins: string[];
    blind_spots: string[];
    actionable_advice: string[];
}

// 3. Workbook Holistic Analysis (UPDATED to match UI expectations)
export interface WorkbookAnalysisResult {
    scope_context: string; 
    summary: string;
    pillars: {
        understanding: string;
        emotional_resonance: string;
        blind_spots: string;
    };
    suggested_actions: string[];
}

// --- Helper: Retry Logic ---
async function generateWithRetry(modelName: string, prompt: string, retries = 2): Promise<string> {
    const modelsToTry = [modelName, 'gemini-1.5-pro', 'gemini-1.5-flash'];
    
    for (let i = 0; i <= retries; i++) {
        try {
            const currentModelName = modelsToTry[i] || modelsToTry[modelsToTry.length - 1];
            const model = genAI.getGenerativeModel({ 
                model: currentModelName, 
                generationConfig: GENERATION_CONFIG 
            });
            
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            
            if (!text) throw new Error("Empty response from AI");
            return text;
        } catch (error) {
            console.warn(`Attempt ${i + 1} with ${modelsToTry[i]} failed:`, error);
            if (i === retries) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); 
        }
    }
    throw new Error("All AI models failed to respond.");
}

function cleanJSON(text: string): string {
    return text.replace(/```json\n?|```/g, '').trim();
}

// ============================================================================
//  CORE FUNCTIONS
// ============================================================================

export async function generateComparativeAnalysis(
    currentSet: string, 
    previousSet: string | null, 
    scope: 'weekly' | 'monthly' | 'all-time'
): Promise<ComparativeAnalysisResult> {
    
    let promptContext = "";

    if (scope === 'all-time') {
        promptContext = `
        Perform a Deep Holistic Review of this entire journal history.
        Identify long-term patterns, core triggers, and the overall arc of recovery.
        
        JOURNAL DATA:
        ${currentSet}
        `;
    } else {
        promptContext = `
        Perform a Comparative Review between two time periods (${scope}).
        Compare the "Current Period" against the "Previous Period" to identify trajectory.

        CURRENT PERIOD:
        ${currentSet}

        PREVIOUS PERIOD:
        ${previousSet || "No data available for previous period."}
        `;
    }

    const systemPrompt = `
    You are a wise and empathetic Recovery Coach specialized in pattern recognition.
    Analyze the provided journal entries and return a JSON object with this EXACT structure:
    {
        "trajectory": "Improving" | "Stable" | "Declining" | "Fluctuating",
        "key_themes": ["Theme 1", "Theme 2", "Theme 3"],
        "comparison_summary": "A 2-3 sentence narrative comparing the periods (or summarizing the journey).",
        "wins": ["Specific win 1", "Specific win 2"],
        "blind_spots": ["Potential risk or overlooked area 1", "Area 2"],
        "actionable_advice": ["Concrete step 1", "Concrete step 2", "Concrete step 3"]
    }
    DO NOT use Markdown formatting. Return ONLY the raw JSON string.
    `;

    const text = await generateWithRetry('gemini-1.5-flash', systemPrompt + promptContext);
    return JSON.parse(cleanJSON(text)) as ComparativeAnalysisResult;
}

export async function generateJournalAnalysis(content: string): Promise<AIAnalysisResult> {
    const prompt = `
      You are a Recovery AI Assistant. Analyze the following journal entries for emotional tone, risks, and actionable steps.
      ENTRIES: ${content}
      Return a JSON object with this structure:
      {
        "sentiment": "Positive" | "Neutral" | "Negative",
        "moodScore": number (1-10 integer based on tone),
        "summary": "1 sentence summary of the user's state",
        "actionableSteps": ["Step 1", "Step 2", "Step 3"],
        "risks": ["Risk 1", "Risk 2"] (If none, return empty array)
      }
      Return ONLY raw JSON.
    `;
    const text = await generateWithRetry('gemini-1.5-flash', prompt);
    return JSON.parse(cleanJSON(text)) as AIAnalysisResult;
}

/**
 * 3. WORKBOOK WIZARD (Deep Dive)
 * Analyzes a full workbook or section to generate the "Compass" report.
 */
export async function analyzeFullWorkbook(
    workbookTitle: string, 
    qaPairs: { question: string; answer: string }[]
): Promise<WorkbookAnalysisResult> {
    
    const formattedContent = qaPairs.map(qa => `Q: ${qa.question}\nA: ${qa.answer}`).join('\n\n');

    const prompt = `
    Analyze the following responses from the user's "${workbookTitle}" workbook.
    Act as a compassionate but insightful Recovery Sponsor.
    
    USER RESPONSES:
    ${formattedContent}

    Generate a JSON object with this EXACT structure:
    {
        "scope_context": "A short label for this analysis (e.g., 'Step 4 Review')",
        "summary": "A paragraph summarizing their understanding of this step/topic.",
        "pillars": {
            "understanding": "Analysis of their cognitive grasp of the concept.",
            "emotional_resonance": "Current emotional state (e.g. Resentful, Accepting).",
            "blind_spots": "Potential risks or overlooked areas."
        },
        "suggested_actions": ["Specific recovery action 1", "Specific recovery action 2", "Specific recovery action 3"]
    }
    Return ONLY raw JSON.
    `;

    const text = await generateWithRetry('gemini-1.5-pro', prompt);
    return JSON.parse(cleanJSON(text)) as WorkbookAnalysisResult;
}

// Alias for backward compatibility
export const analyzeWorkbookContent = analyzeFullWorkbook;

export async function getGeminiCoaching(
    context: string, 
    userAnswer: string
): Promise<string> {
    const prompt = `
    Context: The user is working on a recovery workbook. 
    Question Context: ${context}
    User's Answer: "${userAnswer}"
    Provide a brief, encouraging, and insightful comment (max 2 sentences). 
    `;
    return await generateWithRetry('gemini-1.5-flash', prompt);
}