/**
 * src/lib/gemini.ts
 * GITHUB COMMENT:
 * [gemini.ts]
 * UPDATED: Standardized Audio Analysis to use 'gemini-2.5-flash'.
 * FIX: Removed deprecated 'gemini-1.5-flash' from model cascade.
 */
import { GoogleGenerativeAI } from '@google/generative-ai';
import { auth } from './firebase'; // To capture current user for logging
import { logAIUsage } from './analytics';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');

// --- Configuration ---
const GENERATION_CONFIG = {
  temperature: 0.7,
  topP: 0.8,
  topK: 40,
  maxOutputTokens: 8192,
};

// --- Model Cascade Configuration ---
const MODEL_CASCADE = [
  'gemini-2.5-flash', 
  'gemini-2.5-pro', 
  'gemini-2.0-flash'
];

// --- Interfaces ---

export interface AIAnalysisResult {
    sentiment: 'Positive' | 'Neutral' | 'Negative';
    moodScore: number;
    summary: string;
    actionableSteps: string[];
    risks: string[];
}
// Alias for backward compatibility
export type AnalysisResult = AIAnalysisResult;

export interface AudioAnalysisResult {
    transcription: string;
    sentiment_label: 'Positive' | 'Neutral' | 'Negative';
    mood_score: number; // 1-10
    tags: string[];
}

export interface ComparativeAnalysisResult {
    trajectory: 'Improving' | 'Stable' | 'Declining' | 'Fluctuating';
    key_themes: string[];
    comparison_summary: string;
    wins: string[];
    blind_spots: string[];
    actionable_advice: string[];
}

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

// Deep Pattern Recognition Interface
export interface DeepPatternResult {
    core_triggers: string[];
    emotional_velocity: string; 
    hidden_correlations: string[];
    relapse_risk_level: 'Low' | 'Moderate' | 'High' | 'Critical';
    long_term_advice: string[];
    pattern_summary: string;
}

// System Health Interface
export interface SystemHealthAnalysis {
    status: 'Critical' | 'Warning' | 'Stable';
    summary: string;
    top_issues: {
        error_signature: string;
        occurrence_count: number;
        suspected_root_cause: string;
        suggested_fix: string;
    }[];
    environment_patterns: string; // e.g. "Mostly iOS devices"
}

// --- Core Helper: Smart Cascade Generation ---
async function generateWithCascade(prompt: string, contextTag: string, specificModel?: string): Promise<string> {
    const modelsToTry = specificModel 
        ? [specificModel, ...MODEL_CASCADE.filter(m => m !== specificModel)]
        : MODEL_CASCADE;
    
    let lastError: Error | null = null;

    for (let i = 0; i < modelsToTry.length; i++) {
        const currentModelName = modelsToTry[i];
        
        try {
            if (import.meta.env.DEV) {
                // eslint-disable-next-line no-console
                console.log(`🤖 AI Attempt ${i + 1}/${modelsToTry.length}: Using ${currentModelName}`);
            }

            const model = genAI.getGenerativeModel({ 
                model: currentModelName, 
                generationConfig: GENERATION_CONFIG 
            });
            
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            
            if (!text) throw new Error(`Empty response from ${currentModelName}`);
            
            // --- LOGGING ---
            const uid = auth?.currentUser?.uid || 'anonymous';
            logAIUsage(uid, currentModelName, contextTag, response.usageMetadata);
            // ----------------
            
            return text;

        } catch (error) {
            console.warn(`⚠️ Attempt failed with ${currentModelName}:`, error);
            lastError = error as Error;
            await new Promise(resolve => setTimeout(resolve, 500 * (i + 1))); 
        }
    }

    throw new Error(`All AI models failed. Last error: ${lastError?.message}`);
}

function cleanJSON(text: string): string {
    return text.replace(/```json\n?|```/g, '').trim();
}

// ============================================================================
//  EXPOSED FUNCTIONS
// ============================================================================

/**
 * VOICE-TO-VAULT: Multimodal Analysis
 * Sends audio blob data to Gemini for transcription and analysis.
 */
export async function generateAudioAnalysis(base64Audio: string, mimeType: string): Promise<AudioAnalysisResult> {
    // UPDATED: Switched to 2.5 Flash as primary multimodal model
    const modelName = 'gemini-2.5-flash'; 
    const model = genAI.getGenerativeModel({ model: modelName });

    const prompt = `
    Listen to this audio journal entry.
    1. Transcribe the audio verbatim.
    2. Analyze the sentiment and mood.
    3. Generate 3-5 relevant tags.

    Return JSON format:
    {
      "transcription": "Full text here...",
      "sentiment_label": "Positive" | "Neutral" | "Negative",
      "mood_score": 1-10,
      "tags": ["Tag1", "Tag2"]
    }
    `;

    try {
        const result = await model.generateContent([
            {
                inlineData: {
                    mimeType: mimeType,
                    data: base64Audio
                }
            },
            { text: prompt }
        ]);
        
        const response = await result.response;
        const text = response.text();

        // Logging
        const uid = auth?.currentUser?.uid || 'anonymous';
        logAIUsage(uid, modelName, 'voice_to_vault', response.usageMetadata);

        return JSON.parse(cleanJSON(text)) as AudioAnalysisResult;

    } catch (error) {
        console.error("Audio Analysis Failed:", error);
        throw new Error("Failed to process audio.");
    }
}

export async function analyzeSystemHealth(errorLogs: string): Promise<SystemHealthAnalysis> {
    const prompt = `
    You are a Senior React & Firebase Engineer. I am providing you with a raw dump of client-side error logs.
    Your job is to triage these errors, group duplicates, and identify root causes.

    RAW ERROR LOGS:
    ${errorLogs}

    Return a JSON object with this EXACT structure:
    {
        "status": "Critical" | "Warning" | "Stable",
        "summary": "A 1-sentence executive summary of the system health.",
        "top_issues": [
            {
                "error_signature": "Short description (e.g. 'Undefined in JournalEditor')",
                "occurrence_count": 0 (Integer estimate based on logs provided),
                "suspected_root_cause": "Technical explanation",
                "suggested_fix": "Code-level recommendation"
            }
        ],
        "environment_patterns": "Note any patterns (e.g., 'Only failing on Mobile Safari' or 'Across all devices')."
    }
    IMPORTANT: Return ONLY valid JSON. No Markdown.
    `;

    const text = await generateWithCascade(prompt, 'system_health_analysis', 'gemini-2.5-pro');
    return JSON.parse(cleanJSON(text)) as SystemHealthAnalysis;
}

export async function generateDeepPatternAnalysis(
    journalHistory: string
): Promise<DeepPatternResult> {
    const prompt = `
    Perform a "Deep Pattern Recognition" analysis on the following 90 days of journal entries.
    Use your advanced reasoning to identify subtle correlations, triggers, and emotional velocity that a human might miss.

    JOURNAL DATA:
    ${journalHistory}

    Return a JSON object with this EXACT structure:
    {
        "pattern_summary": "A comprehensive paragraph describing the user's psychological landscape over this period.",
        "core_triggers": ["Trigger 1", "Trigger 2", "Trigger 3"],
        "emotional_velocity": "A brief description of how quickly their mood shifts (e.g. 'Stable but low', 'Volatile spikes').",
        "hidden_correlations": ["Correlation 1 (e.g. 'Poor sleep correlates with high anxiety 2 days later')", "Correlation 2"],
        "relapse_risk_level": "Low" | "Moderate" | "High" | "Critical",
        "long_term_advice": ["Action 1", "Action 2", "Action 3"]
    }
    IMPORTANT: Provide EXACTLY 3 distinct, high-impact "long_term_advice" items. No more, no less.
    Return ONLY raw JSON.
    `;

    const text = await generateWithCascade(prompt, 'deep_pattern_analysis', 'gemini-2.5-pro');
    return JSON.parse(cleanJSON(text)) as DeepPatternResult;
}

export async function generateComparativeAnalysis(
    currentSet: string, 
    previousSet: string | null, 
    scope: 'weekly' | 'monthly' | 'all-time'
): Promise<ComparativeAnalysisResult> {
    
    let promptContext = "";

    if (scope === 'all-time') {
        promptContext = `
        Perform a holistic review of this entire journal history.
        Identify long-term patterns and the overall arc of recovery.
        
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
        "actionable_advice": ["Step 1", "Step 2", "Step 3"]
    }
    IMPORTANT: Provide EXACTLY 3 distinct "actionable_advice" items. No more, no less.
    DO NOT use Markdown formatting. Return ONLY the raw JSON string.
    `;

    const text = await generateWithCascade(systemPrompt + promptContext, `comparative_analysis_${scope}`);
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
      IMPORTANT: "actionableSteps" must contain EXACTLY 3 items.
      Return ONLY raw JSON.
    `;
    
    const text = await generateWithCascade(prompt, 'journal_analysis');
    return JSON.parse(cleanJSON(text)) as AIAnalysisResult;
}

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
        "suggested_actions": ["Action 1", "Action 2", "Action 3"]
    }
    IMPORTANT: "suggested_actions" must contain EXACTLY 3 items.
    Return ONLY raw JSON.
    `;

    const text = await generateWithCascade(prompt, 'workbook_analysis', 'gemini-2.5-pro');
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
    
    return await generateWithCascade(prompt, 'workbook_coach');
}