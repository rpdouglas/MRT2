// src/lib/games/knowledgeQuests/packs/habitLoops.ts
// PROJ-72 (Recovery Games), Phase 6. General psychoeducation on the
// cue-routine-reward habit-formation framework — matches the master spec's
// own `HabitLoops.json` example content pack.
import type { KnowledgeQuestPack } from '../types';

export const habitLoopsPack: KnowledgeQuestPack = {
  id: 'habit-loops',
  title: 'Habit Loops',
  description: 'How habits form, and what actually helps change them.',
  items: [
    {
      prompt: 'In habit-formation science, what are the three basic parts of a habit loop?',
      correctOption: 'Cue, routine, reward',
      options: ['Cue, routine, reward', 'Trigger, thought, feeling', 'Start, middle, end', 'Cause, effect, outcome'],
      explanation: 'This cue-routine-reward loop is the basic framework used to describe how habits form and repeat.',
    },
    {
      prompt: "What is a 'cue' in a habit loop?",
      correctOption: 'The trigger that starts the habit',
      options: ['The trigger that starts the habit', 'The habit itself', 'The good feeling afterward', 'A conscious decision'],
      explanation: "A cue can be a time, place, emotional state, or other people — it's what kicks off the loop.",
    },
    {
      prompt: 'Why do habits often feel automatic?',
      correctOption: 'The brain reduces conscious effort for repeated routines',
      options: ['The brain reduces conscious effort for repeated routines', 'Habits require increasing effort each time', 'The brain forgets the routine exists', 'Automatic habits use more willpower, not less'],
      explanation: 'As routines repeat, the brain shifts them to run with less active thought, freeing up mental effort elsewhere.',
    },
    {
      prompt: "What's a well-supported way to change an unwanted habit?",
      correctOption: 'Keep the same cue, but swap in a new routine for the same reward',
      options: ['Keep the same cue, but swap in a new routine for the same reward', 'Try to eliminate all cues from your life at once', 'Rely on willpower alone with no plan', 'Wait for the habit to disappear on its own'],
      explanation: 'Habit-change approaches generally keep the cue and reward the same and focus on replacing just the routine in between.',
    },
    {
      prompt: "What role does the 'reward' play in a habit loop?",
      correctOption: 'It reinforces the loop so the brain repeats it',
      options: ['It reinforces the loop so the brain repeats it', 'It has no real effect on repetition', 'It only matters the first time', 'It makes the cue disappear'],
      explanation: 'Rewards teach the brain that a loop is worth repeating, strengthening the association over time.',
    },
    {
      prompt: 'Why can habits be hard to change even when you want to?',
      correctOption: 'The loop can run automatically once a cue appears',
      options: ['The loop can run automatically once a cue appears', 'Habits are entirely a matter of character', "Old habits physically vanish and can't return", 'Habits require conscious permission every time'],
      explanation: "Because the loop is automatic, willpower alone often isn't enough — changing the environment or the routine tends to work better.",
    },
    {
      prompt: "What's one practical way to make a good habit easier to start?",
      correctOption: 'Make the cue obvious and the routine simple to begin',
      options: ['Make the cue obvious and the routine simple to begin', 'Make the routine as complicated as possible', 'Hide all reminders of the habit', 'Only rely on remembering by chance'],
      explanation: 'Reducing friction at the start of a routine makes it more likely the loop actually gets triggered.',
    },
    {
      prompt: "What's a common cue category in habit-formation research?",
      correctOption: 'Time of day',
      options: ['Time of day', 'Shoe size', 'Favorite color', 'Zip code'],
      explanation: 'Common cue categories include time, location, emotional state, other people, and the preceding action.',
    },
    {
      prompt: 'Why might simply removing a cue help disrupt an unwanted habit?',
      correctOption: 'Without the trigger, the loop has less chance to start',
      options: ['Without the trigger, the loop has less chance to start', 'It permanently deletes the habit from memory', 'It has no effect on the loop', 'It strengthens the reward instead'],
      explanation: 'Reducing exposure to a cue is one of the more reliable ways to interrupt an established loop.',
    },
    {
      prompt: "What's a realistic expectation when building a brand-new habit?",
      correctOption: 'It usually takes sustained repetition before it feels automatic',
      options: ['It usually takes sustained repetition before it feels automatic', 'It becomes automatic after a single repetition', 'It requires no repetition, only intention', "It's automatic immediately if you truly want it"],
      explanation: 'Consistent repetition, not intensity of willpower, is what tends to move a routine toward feeling automatic.',
    },
  ],
};
