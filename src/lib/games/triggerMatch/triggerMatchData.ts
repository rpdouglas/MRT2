// src/lib/games/triggerMatch/triggerMatchData.ts
// PROJ-72 (Recovery Games), Phase 5. Static trigger-recognition scenarios for
// Walt, reusing the H.A.L.T. framework (Hungry/Angry/Lonely/Tired) already
// established as its own category in Recovery Jeopardy, plus two broader
// categories (Social, Environmental). Content is static and author-written —
// this does NOT read the player's own journal history, a deliberate scope
// decision made during Phase 5 planning to avoid a new personal-data surface.
import type { ScenarioMatchItem } from '../../../components/games/ScenarioMatchQuiz';
import type { TriggerMatchScenario, TriggerCategory } from './types';

const ALL_CATEGORIES: TriggerCategory[] = ['Hungry', 'Angry', 'Lonely', 'Tired', 'Social', 'Environmental'];

export const TRIGGER_MATCH_SCENARIOS: TriggerMatchScenario[] = [
  {
    situation: "It's been six hours since you last ate and you feel irritable.",
    category: 'Hungry',
    explanation: 'Low blood sugar can masquerade as emotional distress — a real, physical trigger, not just a mood.',
  },
  {
    situation: 'Someone criticized your work in front of others and you feel your face get hot.',
    category: 'Angry',
    explanation: 'Anger narrows focus fast and can push decisions that feel urgent but aren\'t.',
  },
  {
    situation: 'It\'s a quiet Sunday and everyone you know seems busy with their own plans.',
    category: 'Lonely',
    explanation: 'Isolation, even briefly, is one of the most common precursors to a difficult moment.',
  },
  {
    situation: "You've been up since 4am for a shift and everything feels harder than it should.",
    category: 'Tired',
    explanation: 'Exhaustion lowers the threshold for every other trigger — small things feel bigger when you\'re depleted.',
  },
  {
    situation: "You're at a party where everyone around you is drinking.",
    category: 'Social',
    explanation: 'Environments built around a substance create pressure even when no one is pressuring you directly.',
  },
  {
    situation: 'You drive past the old bar you used to go to on your way home.',
    category: 'Environmental',
    explanation: 'Places tied to old routines can trigger a response before you\'ve consciously registered why.',
  },
  {
    situation: "Your stomach is growling but you keep telling yourself you'll eat later.",
    category: 'Hungry',
    explanation: 'Delaying a basic need often shows up later as irritability or a craving that seems unrelated to food.',
  },
  {
    situation: 'A driver cut you off and you\'re gripping the wheel, jaw clenched.',
    category: 'Angry',
    explanation: 'A sudden jolt of anger from a small incident is still anger — worth noticing before it compounds.',
  },
  {
    situation: "You just moved to a new city and don't know anyone yet.",
    category: 'Lonely',
    explanation: 'A new environment without an existing support network is a well-known higher-risk window.',
  },
  {
    situation: 'You pulled an all-nighter finishing a project and can barely think straight.',
    category: 'Tired',
    explanation: 'Sleep deprivation directly affects judgment and impulse control, independent of anything else going on.',
  },
  {
    situation: 'Your old friend group is planning a night out at the place you used to drink.',
    category: 'Social',
    explanation: 'Even well-meaning social invitations can carry real risk if they\'re tied to old patterns.',
  },
  {
    situation: 'The smell of a particular restaurant reminds you of nights you\'d rather forget.',
    category: 'Environmental',
    explanation: 'Sensory cues — smell, music, a specific street — can trigger a response faster than a conscious thought.',
  },
  {
    situation: "You skipped lunch and dinner and now you're snapping at small things.",
    category: 'Hungry',
    explanation: 'Skipping meals compounds — by the second missed meal, hunger often looks like something else entirely.',
  },
  {
    situation: 'A coworker took credit for your idea in a meeting.',
    category: 'Angry',
    explanation: 'A legitimate grievance is still a trigger state worth noticing and naming as anger, not just "being right."',
  },
  {
    situation: "You're scrolling through old photos of a relationship that ended.",
    category: 'Lonely',
    explanation: 'Reminders of lost connection can surface loneliness even when you\'re not consciously feeling isolated.',
  },
];

export function buildTriggerMatchItems(): ScenarioMatchItem[] {
  return TRIGGER_MATCH_SCENARIOS.map((scenario) => {
    const distractors = ALL_CATEGORIES.filter((c) => c !== scenario.category).slice(0, 3);
    return {
      prompt: scenario.situation,
      correctOption: scenario.category,
      options: [scenario.category, ...distractors],
      explanation: scenario.explanation,
    };
  });
}
