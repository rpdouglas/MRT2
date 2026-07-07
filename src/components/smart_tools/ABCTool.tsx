/**
 * src/components/smart_tools/ABCTool.tsx
 * PROJ-27: The CBT Engine / PROJ-50: Guided CBT/REBT Interactive Workflows
 * Guided, step-locked ABCDE (REBT) flow. Persistence, encryption, and vault
 * gating are handled by SmartToolContainer; step navigation, coaching cards,
 * and the Step D Socratic/distortion aids are handled by GuidedWorkflowEngine.
 */

import { useState } from 'react';
import { SmartToolContainer } from './SmartToolContainer';
import { GuidedWorkflowEngine, type Step } from '../tools/GuidedWorkflowEngine';
import { SocraticPromptCard } from '../tools/SocraticPromptCard';
import { CognitiveDistortionPicker } from '../tools/CognitiveDistortionPicker';
import { DRAFT_TAG, type ABCPayload } from '../../lib/types/smart';

const SOCRATIC_QUESTIONS = [
    'What is the evidence that this belief is completely true?',
    'What would a trusted friend say about this belief?',
    'Has this belief protected you, or has it caused you harm?',
    'What is a more realistic way to see this situation?',
];

export const ABCTool: React.FC = () => {
    // Ephemeral — enriches the Step D AI coaching prompt only, never persisted to ABCPayload.
    const [distortion, setDistortion] = useState<string | null>(null);

    const initialData: ABCPayload = {
        activatingEvent: '',
        beliefs: '',
        consequences: '',
        dispute: '',
        effectiveBelief: '',
    };

    const steps: Step[] = [
        {
            id: 'activatingEvent',
            label: 'A — Activating Event',
            question: 'What happened? Describe just the facts — what you saw, heard, or experienced.',
            coaching: "An activating event is just what happened — not what it means, not how it made you feel. Just the facts. 'My sponsor didn't call me back' is a fact. 'My sponsor doesn't care about me' is a belief. We're just at Step A.",
            inputType: 'textarea',
            placeholder: "e.g., My boss sent a vague email asking to 'talk later'.",
            minLength: 20,
            aiPromptEnabled: false,
        },
        {
            id: 'beliefs',
            label: 'B — Your Belief',
            question: 'What thought went through your mind? What did that event mean to you?',
            coaching: "Our beliefs are the stories we tell about events. They happen automatically, often in a fraction of a second. The same event (a missed call) can trigger completely different beliefs in different people. Your belief isn't a fact — it's an interpretation.",
            inputType: 'textarea',
            placeholder: "e.g., I'm definitely getting fired. I can never do anything right.",
            minLength: 20,
            aiPromptEnabled: true,
        },
        {
            id: 'consequences',
            label: 'C — Consequence',
            question: 'How did that belief make you feel? What did you do (or want to do) as a result?',
            coaching: "Notice that the consequence wasn't caused by the activating event directly. It was caused by your belief about it. This is the core insight of REBT: events don't make us feel things. Our beliefs do. That means beliefs are changeable. If what you're feeling right now is very intense, it's okay to pause and use the Urge Surfer or breathwork tools first. This work will be here when you're ready.",
            inputType: 'textarea',
            placeholder: 'e.g., I felt panicked and my chest tightened. I wanted to drink to numb the anxiety.',
            minLength: 20,
            aiPromptEnabled: false,
        },
        {
            id: 'dispute',
            label: 'D — Dispute',
            question: 'Is this belief actually true? What evidence contradicts it? What would you say to a friend who had this thought?',
            coaching: "This is the hardest part, and the most powerful. You're about to argue against your own automatic thought using evidence and logic. It's not about pretending the event didn't happen. It's about questioning whether your first interpretation was the only way to see it.",
            inputType: 'textarea',
            placeholder: 'e.g., Where is the proof I\'m getting fired? We have a standard 1-on-1 scheduled today.',
            minLength: 30,
            aiPromptEnabled: true,
            renderExtra: () => (
                <div className="space-y-4">
                    <SocraticPromptCard questions={SOCRATIC_QUESTIONS} />
                    <CognitiveDistortionPicker selected={distortion} onChange={setDistortion} />
                </div>
            ),
        },
        {
            id: 'effectiveBelief',
            label: 'E — Effective Belief',
            question: 'Write a more balanced, realistic version of the original belief.',
            coaching: "An effective new belief doesn't have to be wildly positive. It just has to be more accurate and less self-defeating than the original. 'My sponsor might have been busy' is more accurate than 'my sponsor doesn't care about me.' That's enough.",
            inputType: 'textarea',
            placeholder: 'e.g., My boss probably just wants an update on the project. I will wait for facts before assuming the worst.',
            minLength: 20,
            aiPromptEnabled: false,
        },
    ];

    return (
        <SmartToolContainer<ABCPayload>
            toolType="ABC"
            toolLabel="ABC Coping Tool"
            initialData={initialData}
            resumeSession
            hideDefaultSaveButton
        >
            {({ data, save, isSaving }) => (
                <GuidedWorkflowEngine<ABCPayload>
                    toolType="ABC"
                    toolLabel="ABC Coping Tool"
                    steps={steps}
                    initialData={data}
                    isSaving={isSaving}
                    onSaveProgress={(partial) => save(partial as ABCPayload, [DRAFT_TAG])}
                    onComplete={(payload) => save(payload, [])}
                    getAiContext={(step, value) =>
                        step.id === 'dispute' && distortion ? `${value}\n(Possible cognitive distortion: ${distortion})` : value
                    }
                />
            )}
        </SmartToolContainer>
    );
};
