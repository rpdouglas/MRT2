/**
 * src/lib/gemini.ts
 * REFACTOR: Secure AI Proxy Alignment (July 2026).
 * Routes all client-side Gemini prompts through Firebase Cloud Functions.
 */
import { getFunctions, httpsCallable } from 'firebase/functions';
import app from './firebase';
import type { SmartToolType } from './types/smart';

let functionsInstance: ReturnType<typeof getFunctions> | null = null;

function getFunctionsInstance() {
    if (!functionsInstance) {
        if (!app) {
            throw new Error("Firebase app is not initialized");
        }
        functionsInstance = getFunctions(app, 'northamerica-northeast1');
    }
    return functionsInstance;
}

// --- Interfaces ---

export interface AIAnalysisResult { sentiment: 'Positive' | 'Neutral' | 'Negative'; moodScore: number; summary: string; actionableSteps: string[]; risks: string[]; }
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
    action_contexts?: string[];
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
    action_contexts?: string[];
}

export interface DeepPatternResult {
    core_triggers: string[];
    emotional_velocity: string;
    hidden_correlations: string[];
    relapse_risk_level: 'Low' | 'Moderate' | 'High' | 'Critical';
    long_term_advice: string[];
    action_contexts?: string[];
    pattern_summary: string;
}

export interface SystemHealthAnalysis {
    status: 'Critical' | 'Warning' | 'Stable';
    summary: string;
    top_issues: {
        error_signature: string;
        occurrence_count: number;
        suspected_root_cause: string;
        suggested_fix: string;
    }[];
    environment_patterns: string;
}

export interface ROSCAnalysisResult {
  scores: {
    health: { score: number; evidence: string[] };
    home: { score: number; evidence: string[] };
    purpose: { score: number; evidence: string[] };
    community: { score: number; evidence: string[] };
  };
  trajectory: 'Improving' | 'Stable' | 'Declining' | 'Insufficient Data';
  narrative: string;
  strengths: string[];
  growth_areas: string[];
}

// --- Mock AI Fallbacks for Offline & Dev Environments ---
function getMockAIResponse(analysisType: string): string {
    switch (analysisType) {
        case 'journal_analysis':
            return JSON.stringify({
                sentiment: 'Positive',
                moodScore: 8,
                summary: 'Strong emotional momentum, gratitude for milestones, and solid habit completion.',
                actionableSteps: [
                    'Write down one key learning from today\'s reflections',
                    'Share this positive milestone with your sponsor'
                ],
                risks: ['Pink Cloud overconfidence — stay grounded in daily routines']
            });

        case 'deep_pattern_analysis':
            return JSON.stringify({
                core_triggers: ['Fatigue', 'Mid-week work pressure', 'Social withdrawal'],
                emotional_velocity: 'Stable and gradually upward, indicating nervous system regulation.',
                hidden_correlations: [
                    'Somatic breathwork frequency directly correlates with higher late-evening mood ratings.',
                    'Late screen usage correlates with a minor drop in next-day task completion.'
                ],
                relapse_risk_level: 'Low',
                long_term_advice: [
                    'Implement a digital sunset: turn off screens 30 minutes before bed',
                    'Log a Box Breathing session on high-stress Wednesdays'
                ],
                action_contexts: [
                    'A digital sunset improves sleep quality, directly lifting next-day mood.',
                    'Wednesdays are identified as your weekly work-stress day.'
                ],
                pattern_summary: 'Overall recovery trajectory is solid. The somatic breathwork habits you have built are acting as a powerful buffer against cumulative fatigue.'
            });

        case 'rosc_assessment':
            return JSON.stringify({
                scores: {
                    health: { score: 8, evidence: ['Consistent sleep logs', 'Breathwork completed daily'] },
                    home: { score: 7, evidence: ['Stable environment established'] },
                    purpose: { score: 9, evidence: ['Deeply engaged in step-work and service commitments'] },
                    community: { score: 8, evidence: ['Regular weekly connection with sponsor and peers'] }
                },
                trajectory: 'Improving',
                narrative: 'Your recovery capital shows strong improvement, especially in your sense of purpose and commitment to service. Somatic baselines show stability.',
                strengths: [
                    'Purpose: Excellent completion rate of CBT workbooks and daily reflections',
                    'Health: Proactive stress reduction through 4-7-8 breathing pacing'
                ],
                growth_areas: [
                    'Home: Establishing firmer boundaries around personal recovery time'
                ]
            });

        case 'system_health_analysis':
            return JSON.stringify({
                status: 'Stable',
                summary: 'All telemetry metrics indicate high health and fast client response times.',
                top_issues: [],
                environment_patterns: 'Across all devices'
            });

        case 'workbook_coach':
        case 'cbt_coaching_prompt':
            return 'How does it feel to notice that automatic thought in your body right now?';

        case 'cba_reflection':
            return 'Notice the tension between the immediate escape and the long-term freedom you are building.';

        default:
            return 'Mock response for ' + analysisType;
    }
}

// --- Helper calling the Firebase HTTPS Callable Function Proxy ---
async function callAIProxy(analysisType: string, dataPayload: unknown): Promise<string> {
    if (import.meta.env.VITE_USE_MOCK_AI === 'true') {
        return getMockAIResponse(analysisType);
    }

    try {
        const functions = getFunctionsInstance();
        const proxy = httpsCallable(functions, "generateAIInsights");
        const response = await proxy({ analysisType, dataPayload });
        const data = response.data as { text: string };
        return data.text;
    } catch (error) {
        console.error(`AI Proxy failed for ${analysisType}:`, error);
        throw error;
    }
}

function cleanJSON(text: string): string {
    return text.replace(/```json\n?|```/g, '').trim();
}

// ============================================================================
//  EXPOSED FUNCTIONS
// ============================================================================

export async function generateAudioAnalysis(base64Audio: string, mimeType: string): Promise<AudioAnalysisResult> {
    const text = await callAIProxy('audio_analysis', { base64Audio, mimeType });
    return JSON.parse(cleanJSON(text)) as AudioAnalysisResult;
}

export async function analyzeSystemHealth(errorLogs: string): Promise<SystemHealthAnalysis> {
    const text = await callAIProxy('system_health_analysis', { errorLogs });
    return JSON.parse(cleanJSON(text)) as SystemHealthAnalysis;
}

export async function generateDeepPatternAnalysis(journalHistory: string): Promise<DeepPatternResult> {
    const text = await callAIProxy('deep_pattern_analysis', { journalHistory });
    return JSON.parse(cleanJSON(text)) as DeepPatternResult;
}

export async function generateComparativeAnalysis(
    currentSet: string, 
    previousSet: string | null, 
    scope: 'weekly' | 'monthly' | 'all-time'
): Promise<ComparativeAnalysisResult> {
    const text = await callAIProxy('comparative_analysis', { currentSet, previousSet, scope });
    return JSON.parse(cleanJSON(text)) as ComparativeAnalysisResult;
}

async function analyzeFullWorkbook(
    workbookTitle: string, 
    qaPairs: { question: string; answer: string }[]
): Promise<WorkbookAnalysisResult> {
    const questionsAndAnswers = qaPairs.map(qa => ({ q: qa.question, a: qa.answer }));
    const text = await callAIProxy('workbook_analysis', { workbookTitle, questionsAndAnswers });
    return JSON.parse(cleanJSON(text)) as WorkbookAnalysisResult;
}

export const analyzeWorkbookContent = analyzeFullWorkbook;

export async function generateROSCAnalysis(
  selfReport: { health: number; home: number; purpose: number; community: number; resilience: number },
  journalSummary: string,
  entryCount: number
): Promise<ROSCAnalysisResult> {
  const answers = `Self-reported check-in:
- Health: ${selfReport.health}/5
- Home: ${selfReport.home}/5
- Purpose: ${selfReport.purpose}/5
- Community: ${selfReport.community}/5
- Resilience: ${selfReport.resilience}/5

Journal history has ${entryCount} entries. Summary:
${journalSummary}`;

  const text = await callAIProxy('rosc_assessment', { answers });
  return JSON.parse(cleanJSON(text)) as ROSCAnalysisResult;
}

export async function getGeminiCoaching(context: string, userAnswer: string): Promise<string> {
    return await callAIProxy('workbook_coach', { context, userAnswer });
}

export async function generateCBTCoachingPrompt(
    toolType: SmartToolType,
    stepId: string,
    userInput: string
): Promise<string> {
    const context = `Tool: ${toolType}, Step: ${stepId}`;
    return await callAIProxy('cbt_coaching_prompt', { context, input: userInput });
}

export async function generateCBAReflection(
    behavior: string,
    quadrants: {
        advantagesDoing: string[];
        disadvantagesDoing: string[];
        advantagesStopping: string[];
        disadvantagesStopping: string[];
    }
): Promise<string> {
    return await callAIProxy('cba_reflection', { behavior, quadrants });
}
