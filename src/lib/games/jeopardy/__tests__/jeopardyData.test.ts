/**
 * src/lib/games/jeopardy/__tests__/jeopardyData.test.ts
 * PROJ-72 (Recovery Games), Phase 3. Compliance guard (Tradition 6): fails
 * CI if a fellowship name, branded program name, or copyrighted-text
 * fragment slips back into the Jeopardy category/question/answer content —
 * not just a one-time manual scrub, per
 * docs/projects/72_RECOVERY_GAMES.md §5.
 */
import { describe, it, expect } from 'vitest';
import { jeopardyData } from '../jeopardyData';

// Case-insensitive denylist. Deliberately does NOT include generic recovery
// vocabulary shared across many fellowships/approaches (e.g. "sponsor",
// "meeting", "steps", "amends", "H.A.L.T.") — only exclusive fellowship/
// program names, branded literature titles, and direct Tradition phrasing.
const DENYLIST = [
  /\balcoholics anonymous\b/i,
  /\bnarcotics anonymous\b/i,
  /\bal-anon\b/i,
  /\bbig book\b/i,
  /\bbasic text\b/i,
  /\bwhite book\b/i,
  /\brecovery dharma\b/i,
  /\bsmart recovery\b/i,
  /\bbill wilson\b/i,
  /\bdr\.? bob\b/i,
  /\blois wilson\b/i,
  /\bakron\b/i,
  // Direct Tradition-text phrasing (paraphrase instead of quoting verbatim)
  /our common welfare should come first/i,
  /the only requirement for membership/i,
  /primary purpose.{0,10}carry its message/i,
  /fully self-supporting/i,
  // Direct Step-text phrasing
  /we admitted we were/i,
  /searching and fearless moral inventory/i,
  /entirely ready to have god remove/i,
  /humbly asked him to remove/i,
];

function collectAllText(): string[] {
  const strings: string[] = [];
  for (const category of jeopardyData.categories) {
    strings.push(category.name);
    for (const q of category.questions) {
      strings.push(q.question, q.answer);
    }
  }
  strings.push(jeopardyData.finalJeopardy.category, jeopardyData.finalJeopardy.question, jeopardyData.finalJeopardy.answer);
  return strings;
}

describe('🛡️ Recovery Jeopardy compliance scrub (Tradition 6)', () => {
  it('contains no fellowship names, branded program names, or verbatim literature/Tradition/Step quotes', () => {
    const allText = collectAllText();
    const violations: Array<{ text: string; pattern: string }> = [];

    for (const text of allText) {
      for (const pattern of DENYLIST) {
        if (pattern.test(text)) {
          violations.push({ text, pattern: pattern.toString() });
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it('has exactly 24 categories, matching the legacy game’s board structure (2 rounds of 6 categories x 5 questions)', () => {
    expect(jeopardyData.categories).toHaveLength(24);
  });

  it('every category has exactly 5 questions with ascending point values 200-1000', () => {
    for (const category of jeopardyData.categories) {
      expect(category.questions).toHaveLength(5);
      expect(category.questions.map(q => q.value)).toEqual([200, 400, 600, 800, 1000]);
    }
  });

  it('every question and answer has non-empty text', () => {
    for (const category of jeopardyData.categories) {
      for (const q of category.questions) {
        expect(q.question.trim().length).toBeGreaterThan(0);
        expect(q.answer.trim().length).toBeGreaterThan(0);
      }
    }
  });
});
