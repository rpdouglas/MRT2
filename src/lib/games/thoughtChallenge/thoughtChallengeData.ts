// src/lib/games/thoughtChallenge/thoughtChallengeData.ts
// PROJ-72 (Recovery Games), Phase 5. Burnout-flavored thoughts for Lisa
// (sponsor/service persona), each tagged with the cognitive distortion it
// exemplifies. Reuses the shared distortion bank (src/lib/distortions.ts)
// instead of redefining it — see __tests__/thoughtChallengeData.test.ts for
// the structural guard that every tag is a real, valid distortion label.
import type { ScenarioMatchItem } from '../../../components/games/ScenarioMatchQuiz';
import type { ThoughtChallengeScenario } from './types';
import { DISTORTIONS } from '../../distortions';

export const THOUGHT_CHALLENGE_SCENARIOS: ThoughtChallengeScenario[] = [
  {
    thought: "If I don't answer every sponsee's call within a few minutes, I'm not doing my job.",
    distortion: 'Should Statements',
    distractors: ['Personalisation', 'Catastrophising', 'Labelling'],
    explanation: 'This is a rigid rule about how you "should" always be available, not an actual requirement of good sponsorship.',
  },
  {
    thought: 'One of my sponsees relapsed, so I must be failing everyone I sponsor.',
    distortion: 'Overgeneralisation',
    distractors: ['Mind Reading', 'Magnification', 'Emotional Reasoning'],
    explanation: "A single setback with one person is being treated as proof of a pattern across everyone you sponsor.",
  },
  {
    thought: 'She said the meeting helped her, but she was probably just being polite.',
    distortion: 'Disqualifying the Positive',
    distractors: ['Fortune Telling', 'Mental Filter', 'All-or-Nothing'],
    explanation: 'A genuinely positive piece of feedback is being explained away instead of taken at face value.',
  },
  {
    thought: "He hasn't texted back in two days — he must think I did something wrong.",
    distortion: 'Mind Reading',
    distractors: ['Personalisation', 'Catastrophising', 'Labelling'],
    explanation: "There's no actual evidence for what he's thinking — this fills in a story about someone else's mind.",
  },
  {
    thought: "If I set a boundary with my sponsee, they'll definitely leave the program.",
    distortion: 'Fortune Telling',
    distractors: ['Overgeneralisation', 'Magnification', 'Should Statements'],
    explanation: 'This predicts a specific bad outcome and treats it as a certainty before anything has actually happened.',
  },
  {
    thought: 'I forgot to follow up with one sponsee this week — I\'m a terrible sponsor.',
    distortion: 'Labelling',
    distractors: ['Mental Filter', 'Emotional Reasoning', 'Disqualifying the Positive'],
    explanation: 'One missed follow-up gets turned into a harsh global label instead of being described as what it is — one missed task.',
  },
  {
    thought: "My sponsee's relapse is entirely my fault for not calling more often.",
    distortion: 'Personalisation',
    distractors: ['Mind Reading', 'All-or-Nothing', 'Catastrophising'],
    explanation: "Someone else's choices and circumstances are being taken on as your own responsibility.",
  },
  {
    thought: 'If this one sponsee struggles, my whole approach to sponsorship must be wrong.',
    distortion: 'All-or-Nothing',
    distractors: ['Overgeneralisation', 'Fortune Telling', 'Should Statements'],
    explanation: 'One difficult case is being framed as a total verdict on your approach, with no middle ground.',
  },
  {
    thought: "I feel anxious about this meeting, so something must be going wrong.",
    distortion: 'Emotional Reasoning',
    distractors: ['Labelling', 'Magnification', 'Mind Reading'],
    explanation: 'A feeling is being treated as proof of a fact, even though anxiety alone doesn\'t tell you anything actually went wrong.',
  },
  {
    thought: 'I missed one detail in step work with a sponsee, so I clearly led the whole session badly.',
    distortion: 'Mental Filter',
    distractors: ['Disqualifying the Positive', 'Personalisation', 'Catastrophising'],
    explanation: 'One negative detail is being dwelt on while everything that went well in the session gets filtered out.',
  },
  {
    thought: "If I ever cancel a commitment, everyone will lose faith in me.",
    distortion: 'Catastrophising',
    distractors: ['Should Statements', 'Mental Filter', 'Overgeneralisation'],
    explanation: 'This jumps straight to the worst-case social outcome and treats it as certain rather than possible.',
  },
  {
    thought: "A tiny disagreement with my sponsee means the whole relationship is falling apart.",
    distortion: 'Magnification',
    distractors: ['Fortune Telling', 'Labelling', 'Emotional Reasoning'],
    explanation: 'A small, ordinary disagreement is being blown up into a much bigger deal than it actually is.',
  },
  {
    thought: 'I should never need a break from service work.',
    distortion: 'Should Statements',
    distractors: ['All-or-Nothing', 'Personalisation', 'Disqualifying the Positive'],
    explanation: 'This holds you to a rigid, unrealistic rule rather than acknowledging that rest is a normal part of sustainable service.',
  },
  {
    thought: 'I had one rough sponsorship call, so I must not be cut out for this.',
    distortion: 'Overgeneralisation',
    distractors: ['Mind Reading', 'Catastrophising', 'Mental Filter'],
    explanation: 'One difficult call is being generalized into a conclusion about your overall fitness for the role.',
  },
  {
    thought: "Either I give a sponsee unlimited time, or I'm not really helping them.",
    distortion: 'All-or-Nothing',
    distractors: ['Magnification', 'Emotional Reasoning', 'Labelling'],
    explanation: 'This frames support as an all-or-nothing choice, with no room for a sustainable middle ground.',
  },
];

export function buildThoughtChallengeItems(): ScenarioMatchItem[] {
  return THOUGHT_CHALLENGE_SCENARIOS.map((scenario) => ({
    prompt: scenario.thought,
    correctOption: scenario.distortion,
    options: [scenario.distortion, ...scenario.distractors],
    explanation: scenario.explanation,
  }));
}

export const VALID_DISTORTION_LABELS = new Set(DISTORTIONS.map((d) => d.label));
