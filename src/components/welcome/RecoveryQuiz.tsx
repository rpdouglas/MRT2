import { useState } from 'react';
import { scoreQuiz } from '../../lib/welcomeQuizScoring';
import type { QuizAnswers, QuizQ1Answer, QuizQ2Answer, QuizQ3Answer, QuizQ4Answer, RecoveryPersona } from '../../lib/welcomeQuizScoring';
import { WELCOME_PERSONAS } from '../../data/welcomePersonas';
import PersonaCtaButtons from './PersonaCtaButtons';
import { trackQuizStarted, trackQuizQuestionAnswered, trackQuizCompleted } from '../../lib/telemetry';

interface Question<TAnswer extends string> {
  prompt: string;
  options: { label: string; value: TAnswer }[];
}

// SPEC-WELCOMEPAGE-002 §7.2. Q1's "Calm, low friction" wording is a known
// open item (spec §9 item 1 / docs/projects/116_WELCOME_PAGE_PERSONA_QUIZ.md
// §6) pending a persona-safe copy pass — not an architectural blocker.
const Q1: Question<QuizQ1Answer> = {
  prompt: 'What does your mind need right now?',
  options: [
    { label: 'Calm, low friction', value: 'david' },
    { label: 'Daily momentum', value: 'ned' },
    { label: 'Structured study', value: 'maya' },
    { label: 'Deep reflection', value: 'walt' },
    { label: 'Physical stability', value: 'jordan' },
    { label: "Supporting someone else's recovery", value: 'lisa' },
  ],
};

const Q2: Question<QuizQ2Answer> = {
  prompt: 'What approach fits you?',
  options: [
    { label: '12-Step', value: '12step' },
    { label: 'SMART Recovery', value: 'smart' },
    { label: 'Recovery Dharma', value: 'dharma' },
    { label: 'MAT (Medication-Assisted Treatment)', value: 'mat' },
    { label: 'Secular / CBT', value: 'secular_cbt' },
  ],
};

const Q3: Question<QuizQ3Answer> = {
  prompt: "What's gotten in the way before?",
  options: [
    { label: 'Shame when a streak breaks', value: 'streak_shame' },
    { label: 'Worries about data privacy', value: 'privacy' },
    { label: 'Preachy language', value: 'preachy' },
    { label: 'Feeling overwhelmed', value: 'overwhelmed' },
  ],
};

const Q4: Question<QuizQ4Answer> = {
  prompt: 'How much time do you actually have?',
  options: [
    { label: '30 seconds at 2 AM', value: 'late_night' },
    { label: '5 minutes between errands', value: 'errand' },
    { label: '30 minutes of deep morning reflection', value: 'morning_reflection' },
  ],
};

const QUESTIONS = [Q1, Q2, Q3, Q4] as const;

interface RecoveryQuizProps {
  onWebSignupClick: (persona: RecoveryPersona) => void;
}

export default function RecoveryQuiz({ onWebSignupClick }: RecoveryQuizProps) {
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<QuizAnswers>>({});
  const [result, setResult] = useState<RecoveryPersona | null>(null);

  const handleStart = () => {
    setStarted(true);
    trackQuizStarted();
  };

  const handleAnswer = (value: string) => {
    const questionNumber = (step + 1) as 1 | 2 | 3 | 4;
    const key = (['q1', 'q2', 'q3', 'q4'] as const)[step];
    const nextAnswers = { ...answers, [key]: value } as Partial<QuizAnswers>;
    setAnswers(nextAnswers);
    trackQuizQuestionAnswered(questionNumber);

    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      const persona = scoreQuiz(nextAnswers as QuizAnswers);
      setResult(persona);
      trackQuizCompleted(persona);
    }
  };

  if (!started) {
    return (
      <div className="max-w-xl mx-auto text-center rounded-[2rem] border border-slate-100 bg-slate-50 p-8 sm:p-12">
        <h3 className="text-2xl font-extrabold text-slate-900 mb-3">Find Your Recovery Season</h3>
        <p className="text-slate-500 mb-6">4 quick questions — see which of the six MRT tools was built for you.</p>
        <button
          type="button"
          onClick={handleStart}
          className="bg-blue-600 text-white px-8 py-3.5 rounded-2xl font-bold hover:bg-blue-700 transition-colors"
        >
          Start the quiz
        </button>
      </div>
    );
  }

  if (result) {
    const persona = WELCOME_PERSONAS.find((p) => p.id === result);
    if (!persona) return null;
    return (
      <div className="max-w-xl mx-auto rounded-[2rem] border border-slate-100 bg-slate-50 p-8 sm:p-10">
        <div className="flex items-center gap-4 mb-5">
          <img
            src={persona.headshot}
            alt={persona.altDesc}
            className="w-16 h-16 rounded-full object-cover shadow-sm bg-white"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-blue-600">You're a match for</p>
            <h3 className="text-2xl font-extrabold text-slate-900">{persona.name} — {persona.title}</h3>
          </div>
        </div>
        <ul className="text-sm text-slate-600 space-y-1.5 mb-2">
          {persona.resultStrengths.map((line) => (
            <li key={line} className="flex gap-2">
              <span className="text-blue-500">•</span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
        <PersonaCtaButtons persona={persona.id} personaName={persona.name} onWebSignupClick={onWebSignupClick} />
      </div>
    );
  }

  const question = QUESTIONS[step];
  return (
    <div className="max-w-xl mx-auto rounded-[2rem] border border-slate-100 bg-slate-50 p-8 sm:p-10">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Question {step + 1} of {QUESTIONS.length}</p>
      <h3 className="text-xl font-bold text-slate-900 mb-6">{question.prompt}</h3>
      <div className="flex flex-col gap-3">
        {question.options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => handleAnswer(option.value)}
            className="text-left px-5 py-3.5 rounded-xl bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-colors font-medium text-slate-700"
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
