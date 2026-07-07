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
});
