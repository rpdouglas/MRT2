/**
 * src/components/tools/__tests__/GuidedWorkflowEngine.test.tsx
 * PROJ-50: Guided CBT/REBT Interactive Workflows
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Mock } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { GuidedWorkflowEngine, type Step } from '../GuidedWorkflowEngine';
import { useAuth } from '../../../contexts/AuthContext';
import { useLayout } from '../../../contexts/LayoutContext';
import { useGuidedDraft } from '../../../hooks/useGuidedDraft';
import { generateCBTCoachingPrompt } from '../../../lib/gemini';
import { useNavigate } from 'react-router-dom';

vi.mock('../../../contexts/AuthContext', () => ({ useAuth: vi.fn() }));
vi.mock('../../../contexts/LayoutContext', () => ({ useLayout: vi.fn() }));
vi.mock('../../../hooks/useGuidedDraft', () => ({ useGuidedDraft: vi.fn() }));
vi.mock('../../../lib/gemini', () => ({ generateCBTCoachingPrompt: vi.fn() }));
vi.mock('react-router-dom', () => ({ useNavigate: vi.fn() }));

interface TestPayload extends Record<string, string> { a: string; b: string; }

const STEPS: Step[] = [
    { id: 'a', label: 'Step A', question: 'Question A?', coaching: 'Coaching A', inputType: 'textarea', placeholder: 'a...', minLength: 5, aiPromptEnabled: false },
    { id: 'b', label: 'Step B', question: 'Question B?', coaching: 'Coaching B', inputType: 'textarea', placeholder: 'b...', minLength: 5, aiPromptEnabled: true },
];

describe('🧭 GuidedWorkflowEngine', () => {
    const mockNavigate = vi.fn();
    const mockGetDraft = vi.fn();
    const mockSaveDraft = vi.fn();
    const mockClearDraft = vi.fn();
    const onComplete = vi.fn();
    const onSaveProgress = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (useNavigate as Mock).mockReturnValue(mockNavigate);
        (useAuth as Mock).mockReturnValue({ userTier: 'free' });
        (useLayout as Mock).mockReturnValue({ isOnline: true });
        mockGetDraft.mockReturnValue(null);
        (useGuidedDraft as Mock).mockReturnValue({ getDraft: mockGetDraft, saveDraft: mockSaveDraft, clearDraft: mockClearDraft });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    const renderEngine = (overrides: Partial<Parameters<typeof GuidedWorkflowEngine<TestPayload>>[0]> = {}) => render(
        <GuidedWorkflowEngine<TestPayload>
            toolType="ABC"
            toolLabel="Test Tool"
            steps={STEPS}
            onComplete={onComplete}
            onSaveProgress={onSaveProgress}
            {...overrides}
        />
    );

    it('renders the first step label and question', () => {
        renderEngine();
        expect(screen.getByText('Step 1 of 2 — Step A')).toBeInTheDocument();
        expect(screen.getByText('Question A?')).toBeInTheDocument();
    });

    it('keeps Next disabled below minLength and enables it at threshold', () => {
        renderEngine();
        const textarea = screen.getByPlaceholderText('a...');
        const nextButton = screen.getByText('Next →');

        expect(nextButton).toBeDisabled();

        fireEvent.change(textarea, { target: { value: 'abcd' } }); // 4 chars, below minLength 5
        expect(nextButton).toBeDisabled();

        fireEvent.change(textarea, { target: { value: 'abcde' } }); // exactly 5
        expect(nextButton).not.toBeDisabled();
    });

    it('advances to the next step and preserves values when navigating back', () => {
        renderEngine();
        fireEvent.change(screen.getByPlaceholderText('a...'), { target: { value: 'hello world' } });
        fireEvent.click(screen.getByText('Next →'));

        expect(screen.getByText('Step 2 of 2 — Step B')).toBeInTheDocument();

        fireEvent.click(screen.getByText('Back'));
        expect(screen.getByText('Step 1 of 2 — Step A')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('a...')).toHaveValue('hello world');
    });

    it('calls onSaveProgress with the current partial stepData when Save Progress is tapped', async () => {
        renderEngine();
        fireEvent.change(screen.getByPlaceholderText('a...'), { target: { value: 'hello world' } });
        fireEvent.click(screen.getByText('Save Progress'));

        await waitFor(() => expect(onSaveProgress).toHaveBeenCalledWith({ a: 'hello world' }));
    });

    it('calls onComplete exactly once with the full payload on the final step', async () => {
        renderEngine();
        fireEvent.change(screen.getByPlaceholderText('a...'), { target: { value: 'hello world' } });
        fireEvent.click(screen.getByText('Next →'));
        fireEvent.change(screen.getByPlaceholderText('b...'), { target: { value: 'goodbye world' } });
        fireEvent.click(screen.getByText('Finish'));

        await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
        expect(onComplete).toHaveBeenCalledWith({ a: 'hello world', b: 'goodbye world' });
        expect(mockClearDraft).toHaveBeenCalled();
    });

    it('disables Save Progress/Finish and shows a connect message when offline', () => {
        (useLayout as Mock).mockReturnValue({ isOnline: false });
        renderEngine();
        fireEvent.change(screen.getByPlaceholderText('a...'), { target: { value: 'hello world' } });

        expect(screen.getByText('Connect to save your progress')).toBeInTheDocument();
        expect(screen.getByText('Save Progress')).toBeDisabled();
    });

    it('shows the resume-session prompt when a draft already exists', () => {
        mockGetDraft.mockReturnValue({ currentStep: 1, stepData: { a: 'partial' } });
        renderEngine();
        expect(screen.getByText('Resume your Test Tool session?')).toBeInTheDocument();
    });

    describe('forceFresh', () => {
        it('skips the resume-prompt and clears any existing draft, even when one exists', () => {
            mockGetDraft.mockReturnValue({ currentStep: 1, stepData: { a: 'partial' } });
            renderEngine({ forceFresh: true });

            expect(screen.queryByText('Resume your Test Tool session?')).not.toBeInTheDocument();
            expect(mockClearDraft).toHaveBeenCalled();
        });

        it('starts at step 0 with empty stepData, ignoring initialData', () => {
            renderEngine({ forceFresh: true, initialData: { a: 'stale value', b: 'also stale' } });

            expect(screen.getByText('Step 1 of 2 — Step A')).toBeInTheDocument();
            expect(screen.getByPlaceholderText('a...')).toHaveValue('');
        });
    });

    it('never calls the AI coaching prompt for free-tier users, even after the inactivity delay', async () => {
        vi.useFakeTimers();
        (useAuth as Mock).mockReturnValue({ userTier: 'free' });
        renderEngine();
        fireEvent.change(screen.getByPlaceholderText('a...'), { target: { value: 'hello world' } });
        fireEvent.click(screen.getByText('Next →'));
        fireEvent.change(screen.getByPlaceholderText('b...'), { target: { value: 'a valid belief here' } });

        await act(async () => { vi.advanceTimersByTime(6000); });

        expect(generateCBTCoachingPrompt).not.toHaveBeenCalled();
    });

    it('calls the AI coaching prompt once for premium users after the inactivity delay, and caches it per step', async () => {
        vi.useFakeTimers();
        (useAuth as Mock).mockReturnValue({ userTier: 'premium' });
        (generateCBTCoachingPrompt as Mock).mockResolvedValue('What else is true here?');

        renderEngine();
        fireEvent.change(screen.getByPlaceholderText('a...'), { target: { value: 'hello world' } });
        fireEvent.click(screen.getByText('Next →'));
        fireEvent.change(screen.getByPlaceholderText('b...'), { target: { value: 'a valid belief here' } });

        await act(async () => { vi.advanceTimersByTime(5100); });
        expect(generateCBTCoachingPrompt).toHaveBeenCalledTimes(1);

        // A second pause on the same step should not trigger a second call (cached).
        fireEvent.change(screen.getByPlaceholderText('b...'), { target: { value: 'a valid belief here, more' } });
        await act(async () => { vi.advanceTimersByTime(5100); });
        expect(generateCBTCoachingPrompt).toHaveBeenCalledTimes(1);
    });

    describe('list-type steps', () => {
        interface ListPayload extends Record<string, string | string[]> { items: string[]; }

        const LIST_STEPS: Step[] = [
            { id: 'items', label: 'Items', question: 'List some items', coaching: 'Coaching', inputType: 'list', accentColor: 'emerald', placeholder: 'Add item...', minLength: 1, aiPromptEnabled: false },
        ];

        const renderListEngine = () => render(
            <GuidedWorkflowEngine<ListPayload>
                toolType="CBA"
                toolLabel="Test Tool"
                steps={LIST_STEPS}
                onComplete={onComplete}
                onSaveProgress={onSaveProgress}
            />
        );

        it('gates Next by item count, not character count', () => {
            renderListEngine();
            const input = screen.getByPlaceholderText('Add item...');
            const finishButton = screen.getByText('Finish');

            expect(finishButton).toBeDisabled();

            // Typing alone (no commit) must not satisfy minLength — only committed items count.
            fireEvent.change(input, { target: { value: 'a much longer string than any minLength' } });
            expect(finishButton).toBeDisabled();

            fireEvent.keyDown(input, { key: 'Enter' });
            expect(finishButton).not.toBeDisabled();
        });

        it('never calls the AI coaching prompt for a list step even if misconfigured with aiPromptEnabled', async () => {
            vi.useFakeTimers();
            (useAuth as Mock).mockReturnValue({ userTier: 'premium' });
            const misconfiguredSteps: Step[] = [{ ...LIST_STEPS[0], aiPromptEnabled: true }];
            render(
                <GuidedWorkflowEngine<ListPayload>
                    toolType="CBA"
                    toolLabel="Test Tool"
                    steps={misconfiguredSteps}
                    onComplete={onComplete}
                    onSaveProgress={onSaveProgress}
                />
            );

            fireEvent.keyDown(screen.getByPlaceholderText('Add item...'), { key: 'Enter' }); // no-op, empty
            fireEvent.change(screen.getByPlaceholderText('Add item...'), { target: { value: 'item one' } });
            fireEvent.keyDown(screen.getByPlaceholderText('Add item...'), { key: 'Enter' });

            await act(async () => { vi.advanceTimersByTime(6000); });
            expect(generateCBTCoachingPrompt).not.toHaveBeenCalled();
        });
    });

    describe('emotion-type steps', () => {
        interface EmotionPayload extends Record<string, string> { emotions: string; outcomeEmotions: string; }

        const EMOTION_STEPS: Step[] = [
            { id: 'emotions', label: 'Emotions (Before)', question: 'How do you feel?', coaching: 'Coaching', inputType: 'emotion', placeholder: '', minLength: 1, aiPromptEnabled: false },
            { id: 'outcomeEmotions', label: 'Emotions (After)', question: 'Re-rate', coaching: 'Coaching', inputType: 'emotion', placeholder: '', minLength: 1, aiPromptEnabled: false, emotionSourceStepId: 'emotions' },
        ];

        const renderEmotionEngine = () => render(
            <GuidedWorkflowEngine<EmotionPayload>
                toolType="THOUGHT_RECORD"
                toolLabel="Test Tool"
                steps={EMOTION_STEPS}
                onComplete={onComplete}
                onSaveProgress={onSaveProgress}
            />
        );

        it('gates Next by emotion-selection count', () => {
            renderEmotionEngine();
            const nextButton = screen.getByText('Next →');
            expect(nextButton).toBeDisabled();

            fireEvent.click(screen.getByRole('button', { name: 'Calm' }));
            expect(nextButton).not.toBeDisabled();
        });

        it('resolves emotionSourceStepId into fixedEmotions on the re-rate step', () => {
            renderEmotionEngine();
            fireEvent.click(screen.getByRole('button', { name: 'Calm' }));
            fireEvent.click(screen.getByText('Next →'));

            expect(screen.getByText('Step 2 of 2 — Emotions (After)')).toBeInTheDocument();
            // Re-rate mode: 'Calm' shows as a slider label, and the free-pick chip grid (e.g. 'Anxious') is gone.
            expect(screen.getByText('Calm')).toBeInTheDocument();
            expect(screen.queryByRole('button', { name: 'Anxious' })).not.toBeInTheDocument();
        });
    });

    describe('renderExtra setStepValue', () => {
        interface SidePayload extends Record<string, string> { a: string; sideKey: string; }

        const SIDE_STEPS: Step[] = [
            {
                id: 'a', label: 'Step A', question: 'Question A?', coaching: 'Coaching', inputType: 'textarea', placeholder: 'a...', minLength: 5, aiPromptEnabled: false,
                renderExtra: ({ allStepValues, setStepValue }) => (
                    <button type="button" onClick={() => setStepValue('sideKey', 'sideValue')}>
                        Set side value (currently: {(allStepValues.sideKey as string) ?? 'none'})
                    </button>
                ),
            },
        ];

        it('writes to an arbitrary key without touching the current step\'s own value, and it survives to onComplete', async () => {
            render(
                <GuidedWorkflowEngine<SidePayload>
                    toolType="ABC"
                    toolLabel="Test Tool"
                    steps={SIDE_STEPS}
                    onComplete={onComplete}
                    onSaveProgress={onSaveProgress}
                />
            );

            fireEvent.change(screen.getByPlaceholderText('a...'), { target: { value: 'hello world' } });
            fireEvent.click(screen.getByText('Set side value (currently: none)'));

            expect(screen.getByPlaceholderText('a...')).toHaveValue('hello world');
            expect(screen.getByText('Set side value (currently: sideValue)')).toBeInTheDocument();

            fireEvent.click(screen.getByText('Finish'));
            await waitFor(() => expect(onComplete).toHaveBeenCalledWith({ a: 'hello world', sideKey: 'sideValue' }));
        });
    });

    describe('canAdvanceExtra', () => {
        interface RatingPayload extends Record<string, string | number> { a: string; rating: number; }

        const RATING_STEPS: Step[] = [
            {
                id: 'a', label: 'Step A', question: 'Question A?', coaching: 'Coaching', inputType: 'textarea', placeholder: 'a...', minLength: 5, aiPromptEnabled: false,
                canAdvanceExtra: (allStepValues) => typeof allStepValues.rating === 'number' && allStepValues.rating > 0,
                renderExtra: ({ setStepValue }) => (
                    <button type="button" onClick={() => setStepValue('rating', 3)}>Rate 3</button>
                ),
            },
        ];

        const renderRatingEngine = () => render(
            <GuidedWorkflowEngine<RatingPayload>
                toolType="ABC"
                toolLabel="Test Tool"
                steps={RATING_STEPS}
                onComplete={onComplete}
                onSaveProgress={onSaveProgress}
            />
        );

        it('blocks Finish until the extra gate is satisfied, even when minLength is already met', () => {
            renderRatingEngine();
            fireEvent.change(screen.getByPlaceholderText('a...'), { target: { value: 'hello world' } });
            expect(screen.getByText('Finish')).toBeDisabled();

            fireEvent.click(screen.getByText('Rate 3'));
            expect(screen.getByText('Finish')).not.toBeDisabled();
        });

        it('carries the numeric sibling value through to onComplete', async () => {
            renderRatingEngine();
            fireEvent.change(screen.getByPlaceholderText('a...'), { target: { value: 'hello world' } });
            fireEvent.click(screen.getByText('Rate 3'));
            fireEvent.click(screen.getByText('Finish'));

            await waitFor(() => expect(onComplete).toHaveBeenCalledWith({ a: 'hello world', rating: 3 }));
        });
    });

    describe('suppressCompletionScreen', () => {
        it('shows the generic completion screen by default', async () => {
            renderEngine();
            fireEvent.change(screen.getByPlaceholderText('a...'), { target: { value: 'hello world' } });
            fireEvent.click(screen.getByText('Next →'));
            fireEvent.change(screen.getByPlaceholderText('b...'), { target: { value: 'goodbye world' } });
            fireEvent.click(screen.getByText('Finish'));

            await waitFor(() => expect(screen.getByText('You just did some serious cognitive work.')).toBeInTheDocument());
        });

        it('skips the generic completion screen when suppressCompletionScreen is true, but still calls onComplete', async () => {
            renderEngine({ suppressCompletionScreen: true });
            fireEvent.change(screen.getByPlaceholderText('a...'), { target: { value: 'hello world' } });
            fireEvent.click(screen.getByText('Next →'));
            fireEvent.change(screen.getByPlaceholderText('b...'), { target: { value: 'goodbye world' } });
            fireEvent.click(screen.getByText('Finish'));

            await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
            expect(screen.queryByText('You just did some serious cognitive work.')).not.toBeInTheDocument();
        });
    });
});
