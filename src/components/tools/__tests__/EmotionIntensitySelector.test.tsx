/**
 * src/components/tools/__tests__/EmotionIntensitySelector.test.tsx
 * PROJ-50 Phase 4: Thought Record
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmotionIntensitySelector, type EmotionEntry } from '../EmotionIntensitySelector';

describe('🎭 EmotionIntensitySelector', () => {
    describe('free-select mode', () => {
        it('selecting a preset emotion adds it at intensity 50', () => {
            const onChange = vi.fn();
            render(<EmotionIntensitySelector value={[]} onChange={onChange} />);
            fireEvent.click(screen.getByText('Anxious'));
            expect(onChange).toHaveBeenCalledWith([{ emotion: 'Anxious', intensity: 50 }]);
        });

        it('tapping a selected chip deselects it', () => {
            const onChange = vi.fn();
            const value: EmotionEntry[] = [{ emotion: 'Anxious', intensity: 70 }];
            render(<EmotionIntensitySelector value={value} onChange={onChange} />);
            fireEvent.click(screen.getByRole('button', { name: 'Anxious' }));
            expect(onChange).toHaveBeenCalledWith([]);
        });

        it('caps selection at 3 — a 4th tap is a no-op', () => {
            const onChange = vi.fn();
            const value: EmotionEntry[] = [
                { emotion: 'Anxious', intensity: 50 },
                { emotion: 'Angry', intensity: 50 },
                { emotion: 'Sad', intensity: 50 },
            ];
            render(<EmotionIntensitySelector value={value} onChange={onChange} />);
            fireEvent.click(screen.getByText('Calm'));
            expect(onChange).not.toHaveBeenCalled();
            expect(screen.getByText('Calm')).toBeDisabled();
        });

        it('dragging a slider updates only that entry\'s intensity', () => {
            const onChange = vi.fn();
            const value: EmotionEntry[] = [
                { emotion: 'Anxious', intensity: 50 },
                { emotion: 'Sad', intensity: 30 },
            ];
            render(<EmotionIntensitySelector value={value} onChange={onChange} />);
            const sliders = screen.getAllByRole('slider') as HTMLInputElement[];
            fireEvent.change(sliders[0], { target: { value: '80' } });
            expect(onChange).toHaveBeenCalledWith([
                { emotion: 'Anxious', intensity: 80 },
                { emotion: 'Sad', intensity: 30 },
            ]);
        });

        it('adds a custom emotion word via the text input', () => {
            const onChange = vi.fn();
            render(<EmotionIntensitySelector value={[]} onChange={onChange} />);
            const input = screen.getByPlaceholderText('Add your own word...');
            fireEvent.change(input, { target: { value: 'Numb' } });
            fireEvent.keyDown(input, { key: 'Enter' });
            expect(onChange).toHaveBeenCalledWith([{ emotion: 'Numb', intensity: 50 }]);
        });

        it('ignores a blank custom emotion', () => {
            const onChange = vi.fn();
            render(<EmotionIntensitySelector value={[]} onChange={onChange} />);
            const input = screen.getByPlaceholderText('Add your own word...');
            fireEvent.change(input, { target: { value: '   ' } });
            fireEvent.keyDown(input, { key: 'Enter' });
            expect(onChange).not.toHaveBeenCalled();
        });
    });

    describe('re-rate mode (fixedEmotions)', () => {
        it('renders sliders only for the given names, no chip grid, no custom-add', () => {
            render(<EmotionIntensitySelector value={[]} onChange={vi.fn()} fixedEmotions={['Anxious', 'Calm']} />);
            expect(screen.getByText('Anxious')).toBeInTheDocument();
            expect(screen.getByText('Calm')).toBeInTheDocument();
            expect(screen.queryByText('Sad')).not.toBeInTheDocument(); // preset chip, not requested
            expect(screen.queryByPlaceholderText('Add your own word...')).not.toBeInTheDocument();
            expect(screen.getAllByRole('slider')).toHaveLength(2);
        });

        it('seeds each slider from a matching entry already present in value', () => {
            render(
                <EmotionIntensitySelector
                    value={[{ emotion: 'Anxious', intensity: 75 }]}
                    onChange={vi.fn()}
                    fixedEmotions={['Anxious']}
                />
            );
            expect(screen.getByText('75%')).toBeInTheDocument();
        });

        it('defaults to 50 when a fixed emotion has no entry in value yet', () => {
            render(<EmotionIntensitySelector value={[]} onChange={vi.fn()} fixedEmotions={['Anxious']} />);
            expect(screen.getByText('50%')).toBeInTheDocument();
        });
    });
});
