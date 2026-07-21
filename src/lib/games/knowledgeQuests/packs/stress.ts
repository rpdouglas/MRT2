// src/lib/games/knowledgeQuests/packs/stress.ts
// PROJ-72 (Recovery Games), Phase 6. General, non-prescriptive psychoeducation
// on stress-response physiology — matches the master spec's own `Stress.json`
// example content pack.
import type { KnowledgeQuestPack } from '../types';

export const stressPack: KnowledgeQuestPack = {
  id: 'stress',
  title: 'Stress & The Body',
  description: 'The basics of how your body responds to stress, and why.',
  items: [
    {
      prompt: "Your heart rate spikes and your palms get sweaty before a hard conversation. What's your body doing?",
      correctOption: 'Activating a fight-or-flight stress response',
      options: ['Activating a fight-or-flight stress response', 'Entering deep sleep', 'Digesting a large meal', 'Building long-term memory'],
      explanation: 'The sympathetic nervous system prepares the body to react quickly to a perceived threat — faster heartbeat, redirected blood flow, heightened alertness.',
    },
    {
      prompt: "Which hormone is most associated with the body's stress response?",
      correctOption: 'Cortisol',
      options: ['Cortisol', 'Melatonin', 'Insulin', 'Estrogen'],
      explanation: 'Cortisol is released by the adrenal glands during stress and helps regulate energy, blood sugar, and alertness.',
    },
    {
      prompt: "What's a common physical effect of chronic, ongoing stress?",
      correctOption: 'Disrupted sleep',
      options: ['Disrupted sleep', 'Improved digestion', 'Slower heart rate at rest', 'Sharper short-term memory'],
      explanation: 'Long-term stress keeps the body in a heightened state, which commonly interferes with falling and staying asleep.',
    },
    {
      prompt: "What is the 'fight-or-flight' response designed to help with?",
      correctOption: 'Responding quickly to an immediate threat',
      options: ['Responding quickly to an immediate threat', 'Long-term planning', 'Digesting food efficiently', 'Falling asleep faster'],
      explanation: "It's an evolved survival mechanism, not built for modern chronic stressors like deadlines or finances.",
    },
    {
      prompt: 'Which of these is a body-based way to help calm the stress response?',
      correctOption: 'Slow, deep breathing',
      options: ['Slow, deep breathing', 'Holding your breath', 'Skipping meals', 'Staying in one position for hours'],
      explanation: "Slow exhales activate the parasympathetic ('rest and digest') nervous system, which counters the stress response.",
    },
    {
      prompt: 'What happens to blood flow during an acute stress response?',
      correctOption: "It's redirected toward muscles and away from digestion",
      options: ["It's redirected toward muscles and away from digestion", 'It slows down everywhere', "It stops reaching the brain", "It's redirected entirely to the skin"],
      explanation: "The body prioritizes muscles for quick action, which is why stress can make digestion feel 'off.'",
    },
    {
      prompt: 'Which nervous system branch calms the body back down after a stress response?',
      correctOption: 'The parasympathetic nervous system',
      options: ['The parasympathetic nervous system', 'The sympathetic nervous system', 'The central nervous system', 'The peripheral nervous system'],
      explanation: "The parasympathetic branch is sometimes called 'rest and digest' — it's the counterbalance to the stress response.",
    },
    {
      prompt: "What's one reason chronic stress can affect physical health over time?",
      correctOption: 'The body stays in a heightened alert state longer than it\'s built for',
      options: ['The body stays in a heightened alert state longer than it\'s built for', 'The body builds permanent immunity to stress', 'Stress hormones have no long-term effects', 'The body stops producing cortisol entirely'],
      explanation: 'Stress responses are meant to be short bursts — staying activated for weeks or months can wear on the body.',
    },
    {
      prompt: "Which of these is a well-supported way to reduce day-to-day stress load?",
      correctOption: 'Regular physical movement',
      options: ['Regular physical movement', 'Avoiding all forms of exercise', 'Caffeine right before bed', 'Skipping sleep to get more done'],
      explanation: 'Movement helps metabolize stress hormones and is one of the most consistently supported stress-reduction tools.',
    },
    {
      prompt: "What's a normal, short-term stress reaction to a single stressful event?",
      correctOption: 'A temporary spike in heart rate and alertness',
      options: ['A temporary spike in heart rate and alertness', 'A permanent change in personality', 'Complete loss of memory', 'A guaranteed illness'],
      explanation: 'Short-term stress responses are normal and typically resolve once the stressor passes.',
    },
  ],
};
