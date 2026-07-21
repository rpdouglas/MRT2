/**
 * src/components/tools/__tests__/PayloadSummaryList.test.tsx
 * PROJ-50 §5: Tools Hub Redesign
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PayloadSummaryList } from '../PayloadSummaryList';

describe('📋 PayloadSummaryList', () => {
    it('renders a humanized label and value for each present string field', () => {
        render(<PayloadSummaryList data={{ behavior: 'Drinking', activatingEvent: 'My boss emailed me.' }} />);
        expect(screen.getByText('Behavior')).toBeInTheDocument();
        expect(screen.getByText('Drinking')).toBeInTheDocument();
        expect(screen.getByText('Activating Event')).toBeInTheDocument();
        expect(screen.getByText('My boss emailed me.')).toBeInTheDocument();
    });

    it('skips empty strings, empty arrays, undefined, and null', () => {
        render(<PayloadSummaryList data={{ behavior: 'Drinking', evidenceFor: '', tags: [], distortionType: undefined, notes: null }} />);
        expect(screen.getByText('Behavior')).toBeInTheDocument();
        expect(screen.queryByText('Evidence For')).not.toBeInTheDocument();
        expect(screen.queryByText('Tags')).not.toBeInTheDocument();
        expect(screen.queryByText('Distortion Type')).not.toBeInTheDocument();
        expect(screen.queryByText('Notes')).not.toBeInTheDocument();
    });

    it('renders a plain string array as a bullet list', () => {
        render(<PayloadSummaryList data={{ advantagesDoing: ['Relief from stress', 'Fits in socially'] }} />);
        expect(screen.getByText('Relief from stress')).toBeInTheDocument();
        expect(screen.getByText('Fits in socially')).toBeInTheDocument();
    });

    it('renders an emotion-intensity array as a single inline summary', () => {
        render(<PayloadSummaryList data={{ emotions: [{ emotion: 'Anxious', intensity: 80 }, { emotion: 'Sad', intensity: 30 }] }} />);
        expect(screen.getByText('Anxious 80%, Sad 30%')).toBeInTheDocument();
    });

    it('renders a boolean as Yes/No', () => {
        render(<PayloadSummaryList data={{ completed: true, skipped: false }} />);
        expect(screen.getByText('Yes')).toBeInTheDocument();
        expect(screen.getByText('No')).toBeInTheDocument();
    });

    it('renders a number, including a meaningful zero', () => {
        render(<PayloadSummaryList data={{ turnaroundRating: 0 }} />);
        expect(screen.getByText('Turnaround Rating')).toBeInTheDocument();
        expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('shows a fallback message when every field is empty', () => {
        render(<PayloadSummaryList data={{ behavior: '', tags: [] }} />);
        expect(screen.getByText('No details recorded.')).toBeInTheDocument();
    });

    it('shows the real question text next to the answer when toolType is provided', () => {
        render(<PayloadSummaryList data={{ thought: 'I need this drink', q1IsTrue: 'no' }} toolType="FIVE_QUESTIONS" />);
        expect(screen.getByText('Is It True?')).toBeInTheDocument();
        expect(screen.getByText('no')).toBeInTheDocument();
        expect(screen.queryByText('Q1 Is True')).not.toBeInTheDocument();
    });

    it('renders an array of plain objects as readable labeled rows instead of [object Object]', () => {
        render(
            <PayloadSummaryList
                data={{ personas: [{ id: 1, name: 'The Critic', action: 'You always fail.', result: "That's not true." }] }}
                toolType="PERSONIFY"
            />
        );
        expect(screen.getByText("Rogue's Name:")).toBeInTheDocument();
        expect(screen.getByText('The Critic')).toBeInTheDocument();
        expect(screen.getByText('The Lie It Tells:')).toBeInTheDocument();
        expect(screen.getByText('You always fail.')).toBeInTheDocument();
        expect(screen.queryByText('[object Object]')).not.toBeInTheDocument();
    });
});
