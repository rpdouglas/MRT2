/**
 * src/lib/games/fastLane/__tests__/gameData.test.ts
 * PROJ-72 (Recovery Games), Phase 4. Compliance guard (Tradition 6), same
 * pattern as Recovery Jeopardy's jeopardyData.test.ts — fails CI if a
 * fellowship name, branded program name, or verbatim literature/Step quote
 * slips into Fast Lane's job/course/item/event/apartment/difficulty text.
 * The legacy source's one literal violation ("Attend 12-Step Meeting") is
 * covered by the denylist entry below.
 */
import { describe, it, expect } from 'vitest';
import { JOB_DATA, UNIVERSITY_COURSES, SHOP_ITEMS, RANDOM_EVENTS, APARTMENT_TIERS, DIFFICULTY_LEVELS } from '../gameData';

const DENYLIST = [
  /\balcoholics anonymous\b/i,
  /\bnarcotics anonymous\b/i,
  /\bal-anon\b/i,
  /\bbig book\b/i,
  /\bbasic text\b/i,
  /\bwhite book\b/i,
  /\brecovery dharma\b/i,
  /\bsmart recovery\b/i,
  /\b12[\s-]step meeting\b/i,
  /\btwelve[\s-]step meeting\b/i,
  /\bbill wilson\b/i,
  /\bdr\.? bob\b/i,
];

function collectAllText(): string[] {
  const strings: string[] = [];
  for (const job of JOB_DATA) strings.push(job.title, job.titleRecovery);
  for (const course of UNIVERSITY_COURSES) strings.push(course.name);
  for (const item of SHOP_ITEMS) strings.push(item.name, item.descRecovery);
  for (const event of RANDOM_EVENTS) strings.push(event.description);
  for (const tier of APARTMENT_TIERS) strings.push(tier.name, tier.details);
  for (const key of Object.keys(DIFFICULTY_LEVELS) as (keyof typeof DIFFICULTY_LEVELS)[]) {
    strings.push(DIFFICULTY_LEVELS[key].name);
  }
  return strings;
}

describe('🛡️ Fast Lane compliance scrub (Tradition 6)', () => {
  it('contains no fellowship names, branded program names, or the legacy "12-Step Meeting" reference', () => {
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

  it('has 6 jobs forming a valid promotion chain ending in null', () => {
    expect(JOB_DATA).toHaveLength(6);
    for (let i = 0; i < JOB_DATA.length - 1; i++) {
      expect(JOB_DATA[i].nextJobId).toBe(JOB_DATA[i + 1].id);
    }
    expect(JOB_DATA[JOB_DATA.length - 1].nextJobId).toBeNull();
  });

  it('every difficulty targets a real job id for its career goal', () => {
    const validJobIds = JOB_DATA.map((j) => j.id);
    for (const key of Object.keys(DIFFICULTY_LEVELS) as (keyof typeof DIFFICULTY_LEVELS)[]) {
      expect(validJobIds).toContain(DIFFICULTY_LEVELS[key].goals.careerJobId);
    }
  });
});
