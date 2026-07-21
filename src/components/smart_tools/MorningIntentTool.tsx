/**
 * src/components/smart_tools/MorningIntentTool.tsx
 * PROJ-72 (Recovery Games), Phase 2. A forward-looking REBT-style guided flow —
 * distinct from ABCTool's retrospective A-B-C-D-E: instead of examining a belief
 * about something that already happened, this anticipates today's likely
 * challenges and sets an intention before they arrive. Persistence, encryption,
 * and vault gating are handled by SmartToolContainer, same as every other
 * guided tool — this file only defines the step config, per
 * docs/projects/72_RECOVERY_GAMES.md Part A.
 */
import { useSearchParams } from 'react-router-dom';
import { SmartToolContainer } from './SmartToolContainer';
import { GuidedWorkflowEngine, type Step } from '../tools/GuidedWorkflowEngine';
import { DRAFT_TAG, type MorningIntentPayload } from '../../lib/types/smart';

export const MorningIntentTool: React.FC = () => {
    const [searchParams] = useSearchParams();
    const forceFresh = searchParams.get('fresh') === '1';

    const initialData: MorningIntentPayload = {
        terrain: '',
        story: '',
        reframe: '',
        intention: '',
    };

    const steps: Step[] = [
        {
            id: 'terrain',
            label: "Today's Terrain",
            question: 'What situations, people, or moments today are most likely to challenge you?',
            coaching: "You don't need to predict everything — just name the one or two moments that come to mind first. Naming them now, while you're calm, makes them far less likely to catch you off guard later.",
            inputType: 'textarea',
            placeholder: 'e.g., A stressful meeting at 2pm, or driving past my old bar on the way home.',
            minLength: 15,
            aiPromptEnabled: false,
        },
        {
            id: 'story',
            label: 'The Automatic Story',
            question: "If that moment goes badly, what's the automatic thought you'd expect to show up?",
            coaching: "This is the story your mind tells on autopilot — not what's true, just what's familiar. Naming it in advance takes away some of its power to surprise you.",
            inputType: 'textarea',
            placeholder: "e.g., 'I can't handle this without using.'",
            minLength: 15,
            aiPromptEnabled: true,
        },
        {
            id: 'reframe',
            label: 'A More Useful Belief',
            question: "What's a more realistic, useful way to think about that moment instead?",
            coaching: "It doesn't need to be relentlessly positive — just more accurate and less self-defeating than the automatic story. 'This feeling will pass' is often enough.",
            inputType: 'textarea',
            placeholder: "e.g., 'This is uncomfortable, not dangerous. I've gotten through moments like this before.'",
            minLength: 15,
            aiPromptEnabled: true,
        },
        {
            id: 'intention',
            label: "Today's Intention",
            question: 'Given all that, what is one concrete thing you intend to do today?',
            coaching: 'Keep it small and doable — one intention you can actually act on, not a sweeping resolution. Small and kept beats big and abandoned.',
            inputType: 'textarea',
            placeholder: 'e.g., Text my sponsor before the 2pm meeting.',
            minLength: 10,
            aiPromptEnabled: false,
        },
    ];

    return (
        <SmartToolContainer<MorningIntentPayload>
            toolType="MORNING_INTENT"
            toolLabel="Morning Intent"
            initialData={initialData}
            resumeSession
            hideDefaultSaveButton
            hideHeader
        >
            {({ data, save, isSaving }) => (
                <GuidedWorkflowEngine<MorningIntentPayload>
                    toolType="MORNING_INTENT"
                    toolLabel="Morning Intent"
                    steps={steps}
                    initialData={data}
                    isSaving={isSaving}
                    forceFresh={forceFresh}
                    onSaveProgress={(partial) => save(partial as MorningIntentPayload, [DRAFT_TAG])}
                    onComplete={(payload) => save(payload, [])}
                />
            )}
        </SmartToolContainer>
    );
};
