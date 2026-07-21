/**
 * src/lib/games/knowledgeQuests/__tests__/packs.test.ts
 * PROJ-72 (Recovery Games), Phase 6. Structural guards for every Knowledge
 * Quest content pack (every item's correctOption is a valid, unique option
 * in its own choice set) plus the same fellowship/brand denylist compliance
 * test used by Jeopardy and Fast Lane — standing practice for every
 * content-bearing Recovery Game, not because a specific risk was found here.
 */
import { describe, it, expect } from 'vitest';
import { KNOWLEDGE_QUEST_PACKS } from '../packs';

const DENYLIST = [
  /\balcoholics anonymous\b/i,
  /\bnarcotics anonymous\b/i,
  /\bal-anon\b/i,
  /\bbig book\b/i,
  /\bbasic text\b/i,
  /\brecovery dharma\b/i,
  /\bsmart recovery\b/i,
  /\b12[\s-]step\b/i,
];

function collectAllText(): string[] {
  const strings: string[] = [];
  for (const pack of KNOWLEDGE_QUEST_PACKS) {
    strings.push(pack.title, pack.description);
    for (const item of pack.items) {
      strings.push(item.prompt, item.explanation, ...item.options);
    }
  }
  return strings;
}

describe('🧠 Knowledge Quests packs', () => {
  it('has at least 3 packs with unique ids', () => {
    expect(KNOWLEDGE_QUEST_PACKS.length).toBeGreaterThanOrEqual(3);
    const ids = KNOWLEDGE_QUEST_PACKS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every pack has a reasonable number of items', () => {
    for (const pack of KNOWLEDGE_QUEST_PACKS) {
      expect(pack.items.length).toBeGreaterThanOrEqual(8);
    }
  });

  it('every item has a unique, valid option set including the correct answer', () => {
    for (const pack of KNOWLEDGE_QUEST_PACKS) {
      for (const item of pack.items) {
        expect(item.options).toContain(item.correctOption);
        expect(new Set(item.options).size).toBe(item.options.length);
        expect(item.options.length).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it('every item has a non-empty explanation', () => {
    for (const pack of KNOWLEDGE_QUEST_PACKS) {
      for (const item of pack.items) {
        expect(item.explanation.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('contains no fellowship names or branded program references', () => {
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
});
