// src/lib/distortions.ts
// PROJ-50's CBT tools (CognitiveDistortionPicker.tsx) and PROJ-72's Thought
// Challenge game (Recovery Games, Phase 5) both need the same 12 cognitive
// distortions — extracted here as the single source of truth instead of
// duplicating the list.
export interface Distortion {
  label: string;
  definition: string;
}

export const DISTORTIONS: Distortion[] = [
  { label: 'All-or-Nothing', definition: 'Seeing things in black-and-white categories, with no middle ground.' },
  { label: 'Overgeneralisation', definition: 'Treating a single setback as proof of a never-ending pattern.' },
  { label: 'Mental Filter', definition: 'Dwelling on one negative detail while ignoring everything positive.' },
  { label: 'Disqualifying the Positive', definition: 'Rejecting good experiences by insisting they "don\'t count."' },
  { label: 'Mind Reading', definition: 'Assuming you know what someone else is thinking, without evidence.' },
  { label: 'Fortune Telling', definition: 'Predicting things will turn out badly before they happen.' },
  { label: 'Catastrophising', definition: 'Expecting the worst-case outcome and treating it as certain.' },
  { label: 'Emotional Reasoning', definition: 'Assuming a feeling must be true just because it feels true.' },
  { label: 'Should Statements', definition: 'Holding yourself or others to rigid "should"/"must" rules.' },
  { label: 'Labelling', definition: 'Attaching a harsh global label to yourself instead of describing the behavior.' },
  { label: 'Personalisation', definition: 'Blaming yourself for something you weren\'t fully responsible for.' },
  { label: 'Magnification', definition: 'Blowing a mistake or flaw out of proportion.' },
];
