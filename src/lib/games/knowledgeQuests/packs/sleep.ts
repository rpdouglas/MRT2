// src/lib/games/knowledgeQuests/packs/sleep.ts
// PROJ-72 (Recovery Games), Phase 6. General, non-prescriptive psychoeducation
// on sleep hygiene and its connection to recovery.
import type { KnowledgeQuestPack } from '../types';

export const sleepPack: KnowledgeQuestPack = {
  id: 'sleep',
  title: 'Sleep & Recovery',
  description: "Why sleep quality matters, and what actually helps it.",
  items: [
    {
      prompt: "What is 'sleep hygiene'?",
      correctOption: 'Habits and conditions that support consistent, good-quality sleep',
      options: ['Habits and conditions that support consistent, good-quality sleep', 'A specific type of pillow', 'A medication schedule', 'A term for how clean your bedroom is'],
      explanation: 'Sleep hygiene refers to the practices — like consistent timing and a calming environment — that support good sleep.',
    },
    {
      prompt: 'Why is a consistent sleep/wake schedule generally recommended?',
      correctOption: "It helps regulate the body's internal clock",
      options: ["It helps regulate the body's internal clock", 'It has no effect on sleep quality', 'It only matters on weekends', "It's mainly a productivity trick with no biological basis"],
      explanation: "Going to bed and waking around the same time helps stabilize your circadian rhythm, supporting more consistent, restorative sleep.",
    },
    {
      prompt: 'How can screens before bed affect sleep?',
      correctOption: "Light exposure can delay the body's natural wind-down signal",
      options: ["Light exposure can delay the body's natural wind-down signal", 'Screens always improve sleep quality', "Screens have no effect on the body's sleep signals", 'Screens only affect vision, not sleep'],
      explanation: "Bright light, especially blue light, can suppress melatonin release, which is part of the body's cue to wind down.",
    },
    {
      prompt: 'Why does sleep matter specifically during recovery?',
      correctOption: 'Poor sleep can lower emotional regulation and increase stress reactivity',
      options: ['Poor sleep can lower emotional regulation and increase stress reactivity', 'Sleep has no connection to mood or stress', 'Sleep only affects physical fatigue, nothing else', 'More sleep always means less motivation'],
      explanation: 'Sleep quality is closely tied to mood regulation, stress tolerance, and clear thinking — all relevant to sustaining recovery.',
    },
    {
      prompt: "What's a well-supported habit for improving sleep quality?",
      correctOption: 'Keeping a consistent wind-down routine before bed',
      options: ['Keeping a consistent wind-down routine before bed', 'Exercising vigorously right before bed', 'Napping for several hours in the afternoon', 'Drinking caffeine in the evening'],
      explanation: 'A predictable wind-down routine cues the body that sleep is coming, similar to how cues work in habit formation.',
    },
    {
      prompt: 'What effect does caffeine late in the day commonly have on sleep?',
      correctOption: 'It can delay falling asleep and reduce sleep quality',
      options: ['It can delay falling asleep and reduce sleep quality', 'It has no measurable effect if you feel tired anyway', 'It only affects people under age 20', 'It improves the depth of sleep'],
      explanation: 'Caffeine can stay active in the body for hours, which is why it\'s commonly recommended to limit it later in the day.',
    },
    {
      prompt: 'Why might irregular sleep patterns make cravings or urges harder to manage?',
      correctOption: 'Poor sleep is linked to reduced impulse control',
      options: ['Poor sleep is linked to reduced impulse control', 'Sleep patterns have no connection to impulse control', 'Irregular sleep always increases willpower', 'Sleep only affects appetite, not decision-making'],
      explanation: 'Sleep deprivation is associated with reduced regulation in areas of the brain tied to impulse control and decision-making.',
    },
    {
      prompt: "What's one reason a cool, dark room is often recommended for sleep?",
      correctOption: "It supports the body's natural signals for winding down",
      options: ["It supports the body's natural signals for winding down", 'Temperature and light have no effect on sleep', 'A bright room always improves sleep', 'A warm room is always better for sleep'],
      explanation: "Lower light and cooler temperatures align with the body's natural pre-sleep physiological changes.",
    },
    {
      prompt: "What's a reasonable response to an occasional bad night of sleep?",
      correctOption: 'Return to your normal sleep/wake schedule the next day',
      options: ['Return to your normal sleep/wake schedule the next day', 'Sleep in drastically the next day no matter what', "Stay awake an extra 24 hours to 'reset'", 'Assume your sleep is permanently damaged'],
      explanation: 'One rough night is normal — getting back to a consistent schedule is generally more helpful than overcorrecting.',
    },
    {
      prompt: "Why is sleep sometimes called 'foundational' to recovery work?",
      correctOption: 'It affects mood, stress tolerance, and decision-making all at once',
      options: ['It affects mood, stress tolerance, and decision-making all at once', 'It has no real connection to recovery', 'It only matters for physical energy', "It's unrelated to emotional regulation"],
      explanation: 'Because sleep touches so many systems at once, poor sleep can make every other part of recovery work harder than it needs to be.',
    },
  ],
};
