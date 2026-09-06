// PROJ-116: shared persona marketing content for the Welcome page — the
// trimmed showcase (src/pages/Welcome.tsx) and the quiz result card
// (src/components/welcome/RecoveryQuiz.tsx) both read from here so the two
// discovery paths (quiz vs. browse) stay in sync automatically.
import { ASSETS } from './assets';
import type { RecoveryPersona } from '../lib/welcomeQuizScoring';

export interface WelcomePersonaContent {
  id: RecoveryPersona;
  name: string;
  title: string;
  quote: string;
  headshot: string;
  screen: string;
  color: string;
  altDesc: string;
  bio: {
    backstory: string;
    currentStage: string;
    sponsorStatus: string;
    keyChallenge: string;
  };
  // 2-3 short lines for the quiz result card (SPEC-WELCOMEPAGE-002 §7.4) —
  // distinct from `bio` above (the narrative showcase card), condensed from
  // each persona's "Key Feature Alignment" section in docs/PERSONAS.md.
  resultStrengths: string[];
}

export const WELCOME_PERSONAS: WelcomePersonaContent[] = [
  {
    id: 'david',
    name: 'David',
    title: 'The Fresh Start',
    quote: '"A completely private space to start over."',
    headshot: ASSETS.personas.david.headshot,
    screen: ASSETS.marketing.screenshots.scn_journal_write,
    color: 'bg-blue-50 text-blue-600',
    altDesc: 'David, representing early recovery users seeking privacy.',
    bio: {
      backstory: 'Had 2 years sober, got complacent, disastrous relapse. Lost everything.',
      currentStage: 'Day 1 (Again). Acute crisis, overwhelmed by shame & guilt.',
      sponsorStatus: 'None currently. Too ashamed to ask.',
      keyChallenge: 'Overcoming shame just to walk back into a meeting.',
    },
    resultStrengths: [
      'Urge Surfer for de-escalating a crisis right now.',
      'Voice-to-Vault journaling — vent without typing.',
      'One-tap SOS sponsor call. Zero pressure, always private.',
    ],
  },
  {
    id: 'ned',
    name: 'Ned',
    title: 'The Pink Cloud',
    quote: '"Turning manic energy into grounded momentum."',
    headshot: ASSETS.personas.ned.headshot,
    screen: ASSETS.marketing.screenshots.scn_tasks_this_week,
    color: 'bg-cyan-50 text-cyan-700',
    altDesc: 'Ned, representing users building daily habits and structure.',
    bio: {
      backstory: 'Chaotic partying, hit a wall in a holding cell. Tired of the chaos.',
      currentStage: 'Early Recovery (90 Days). High on energy & gratitude. Raw emotions.',
      sponsorStatus: 'Yes, active. Calls daily.',
      keyChallenge: 'Impatience. Risk of crashing when reality hits.',
    },
    resultStrengths: [
      'Daily tasks and streaks to channel that momentum.',
      'Milestone badges — recognition without the crash.',
      'Streak breaks handled with warmth, never guilt.',
    ],
  },
  {
    id: 'lisa',
    name: 'Lisa',
    title: 'The Service Superstar',
    quote: '"Self-care tools to prevent burnout."',
    headshot: ASSETS.personas.lisa.headshot,
    screen: ASSETS.marketing.screenshots.scn_vitality_breath,
    color: 'bg-amber-50 text-amber-700',
    altDesc: 'Lisa, representing sponsors utilizing somatic grounding tools.',
    bio: {
      backstory: 'Functional user, high-stress life. Shame of neglecting her kids drove her into recovery.',
      currentStage: 'Maintenance (7 Years). Focus on Step 12 & helping others.',
      sponsorStatus: 'Yes, and sponsors 5 others.',
      keyChallenge: 'Burnout & boundaries. Neglects her own self-care.',
    },
    resultStrengths: [
      'Encrypted sponsee rolodex, sorted by urgency.',
      'Vitality tracking for her own self-care, not just theirs.',
      'Anonymity-compliant sharing — nothing that outs anyone.',
    ],
  },
  {
    id: 'walt',
    name: 'Walt',
    title: 'The Zen Master',
    quote: '"Finding hidden patterns with AI analysis."',
    headshot: ASSETS.personas.walt.headshot,
    screen: ASSETS.marketing.screenshots.scn_journal_ai_wizard,
    color: 'bg-fuchsia-50 text-fuchsia-700',
    altDesc: 'Walt, representing long-term users seeking AI insight.',
    bio: {
      backstory: 'Vietnam veteran, decades of hard use. Recovery is a deep spiritual practice.',
      currentStage: 'Spiritual Maintenance (35+ Years). Meditates daily, calming presence.',
      sponsorStatus: '"Grand-Sponsor" / spiritual advisor.',
      keyChallenge: 'Patience with change in the program.',
    },
    resultStrengths: [
      'Deep AI pattern analysis across months and years.',
      'Full data exports — your insights stay traceable and yours.',
      'Recovery Dharma workbook for structured reflection.',
    ],
  },
  {
    id: 'maya',
    name: 'Maya',
    title: 'The Systematiser',
    quote: '"I want to master the mechanics of my own recovery."',
    headshot: ASSETS.personas.maya.headshot,
    screen: ASSETS.marketing.screenshots.scn_workbooks_compass,
    color: 'bg-emerald-50 text-emerald-700',
    altDesc: 'Maya, representing systematic, completion-driven users of the workbook tools.',
    bio: {
      backstory: 'Data-driven professional; 12-Step’s spiritual framework didn’t fit. Moved to SMART Recovery & Recovery Dharma instead.',
      currentStage: 'Early-to-Mid (8 months). Treats recovery like a curriculum to master.',
      sponsorStatus: 'No formal sponsor — 1:1 wise-friend accountability.',
      keyChallenge: 'Staying engaged once the curriculum runs out.',
    },
    resultStrengths: [
      'Structured SMART/CBT/Dharma workbooks with real completion %.',
      'Comparative AI analysis against your own past months.',
      'Auditable, exportable progress data — no black boxes.',
    ],
  },
  {
    id: 'jordan',
    name: 'Jordan',
    title: 'The Stabiliser',
    quote: '"Tools that support my recovery without judging my medication."',
    headshot: ASSETS.personas.jordan.headshot,
    // NOTE (PROJ-116): scn_dashboard_02_clean_time was reused here previously,
    // colliding with the same image used as the hero's floating badge —
    // exactly the asset-reuse problem SPEC-WELCOMEPAGE-002 §8 flags. Swapped
    // to scn_tasks_log as a same-app stand-in (daily logging, thematically
    // close to one-tap dose logging) until a real MAT/dose-tracking feature
    // screenshot is captured — see docs/projects/116_WELCOME_PAGE_PERSONA_QUIZ.md §5.
    screen: ASSETS.marketing.screenshots.scn_tasks_log,
    color: 'bg-teal-50 text-teal-700',
    altDesc: 'Jordan, representing users on medication-assisted recovery seeking non-judgmental tools.',
    bio: {
      backstory: 'Severe opioid use disorder; repeated abstinence-only relapses. Stabilised on Buprenorphine (Suboxone) MAT.',
      currentStage: 'Early-to-Mid, active MAT. Stable, employed, rebuilding family relationships.',
      sponsorStatus: 'MARA meetings online — no traditional 12-Step sponsor.',
      keyChallenge: 'Finding tools that treat medication as recovery, not "cheating."',
    },
    resultStrengths: [
      'Discreet, one-tap dose logging — no drug names on your lock screen.',
      'Side-effect correlation insights (sleep, mood, cravings).',
      'MARA and SMART Recovery templates built in.',
    ],
  },
];
