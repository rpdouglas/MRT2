import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { buildPlayStoreLink } from '../../lib/playStoreLink';
import type { RecoveryPersona } from '../../lib/welcomeQuizScoring';

export const QUIZ_PERSONA_STORAGE_KEY = 'mrt_welcome_quiz_persona';

interface PersonaCtaButtonsProps {
  persona: RecoveryPersona;
  personaName: string;
  onWebSignupClick: (persona: RecoveryPersona) => void;
}

/**
 * SPEC-WELCOMEPAGE-002 §6: the quiz-result CTA is a personalized variant of
 * the single base CTA string, and (per the spec's "New" scope item, confirmed
 * in docs/projects/116_WELCOME_PAGE_PERSONA_QUIZ.md §6 Decision 1) direct
 * showcase-card clicks get the same dual-path treatment — web signup stays
 * primary, Google Play is a tagged secondary option. Shared here so the quiz
 * result card and the six showcase cards can't drift out of sync.
 */
export default function PersonaCtaButtons({ persona, personaName, onWebSignupClick }: PersonaCtaButtonsProps) {
  return (
    <div className="flex flex-col gap-2 mt-4">
      <button
        type="button"
        onClick={() => onWebSignupClick(persona)}
        className="w-full bg-slate-900 text-white px-5 py-3 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all flex items-center justify-center gap-2 group"
      >
        Begin your toolkit — built for {personaName}
        <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </button>
      <a
        href={buildPlayStoreLink(persona)}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full text-center px-5 py-2.5 rounded-xl font-semibold text-xs text-slate-500 border border-slate-200 hover:border-slate-300 hover:text-slate-700 transition-colors"
      >
        or get it on Google Play
      </a>
    </div>
  );
}
