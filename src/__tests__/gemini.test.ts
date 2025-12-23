import { describe, it, expect, vi, beforeEach } from 'vitest';
import { analyzeJournalEntries, analyzeWorkbookContent } from '../lib/gemini';

// --- MOCKS ---

const mockGenerateContent = vi.fn();

// Mock the Google Generative AI SDK
vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: vi.fn().mockReturnValue({
      generateContent: mockGenerateContent
    })
  }))
}));

describe('AI Service (Gemini)', () => {
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('truncates extremely long inputs to prevent token limit errors', async () => {
    // Create a string longer than our 12,000 char limit
    const longEntry = 'a'.repeat(15000); 
    
    // Setup success response
    mockGenerateContent.mockResolvedValueOnce({
      response: {
        text: () => JSON.stringify({
          summary: "Truncated test",
          mood: "Neutral",
          sentiment: "Neutral",
          risk_analysis: "None",
          positive_reinforcement: "None",
          tool_suggestions: []
        })
      }
    });

    await analyzeJournalEntries([longEntry]);
    
    // Verify that generateContent was called
    expect(mockGenerateContent).toHaveBeenCalled();
    
    // Inspect the argument passed to generateContent
    const calledArg = mockGenerateContent.mock.calls[0][0];
    
    // Expect the prompt to contain the truncation marker
    expect(calledArg).toContain('...(truncated for analysis)');
    // Expect the length to be roughly limit + prompt overhead, definitely not 15k+
    expect(calledArg.length).toBeLessThan(15000);
  });

  it('handles JSON parsing errors gracefully', async () => {
    // Simulate AI returning broken JSON (common with LLMs)
    mockGenerateContent.mockResolvedValueOnce({
      response: {
        text: () => "This is not JSON, just plain text."
      }
    });

    // Should catch the error internally and return null, not crash
    const result = await analyzeWorkbookContent("Test content", "section", "Test");
    
    expect(result).toBeNull();
  });

  it('removes markdown code blocks before parsing', async () => {
    // Simulate AI returning markdown formatted JSON
    const jsonString = JSON.stringify({
      summary: "Markdown test",
      mood: "Good",
      sentiment: "Positive",
      risk_analysis: "None",
      positive_reinforcement: "None",
      tool_suggestions: []
    });

    mockGenerateContent.mockResolvedValueOnce({
      response: {
        text: () => "```json\n" + jsonString + "\n```"
      }
    });

    const result = await analyzeJournalEntries(["Test"]);
    
    // If logic works, it strips ```json and parses correctly
    expect(result).not.toBeNull();
    expect(result?.mood).toBe("Good");
  });
});