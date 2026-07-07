/**
 * src/components/tools/__tests__/ListInput.test.tsx
 * PROJ-50 Phase 3: Guided CBA Flow
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ListInput } from '../ListInput';

describe('📋 ListInput', () => {
    it('renders the empty-state label when items is empty', () => {
        render(<ListInput items={[]} onChange={vi.fn()} accentColor="emerald" />);
        expect(screen.getByText('No items added yet')).toBeInTheDocument();
    });

    it('adds an item via Enter and clears the input', () => {
        const onChange = vi.fn();
        render(<ListInput items={[]} onChange={onChange} accentColor="emerald" />);
        const input = screen.getByPlaceholderText('Add factor...');

        fireEvent.change(input, { target: { value: 'Relief from stress' } });
        fireEvent.keyDown(input, { key: 'Enter' });

        expect(onChange).toHaveBeenCalledWith(['Relief from stress']);
        expect(input).toHaveValue('');
    });

    it('adds an item via the + button', () => {
        const onChange = vi.fn();
        render(<ListInput items={['existing']} onChange={onChange} accentColor="rose" />);
        const input = screen.getByPlaceholderText('Add factor...');

        fireEvent.change(input, { target: { value: 'New item' } });
        fireEvent.click(screen.getByLabelText('Add item'));

        expect(onChange).toHaveBeenCalledWith(['existing', 'New item']);
    });

    it('does not call onChange for blank or whitespace-only input', () => {
        const onChange = vi.fn();
        render(<ListInput items={[]} onChange={onChange} accentColor="sky" />);
        const input = screen.getByPlaceholderText('Add factor...');

        fireEvent.change(input, { target: { value: '   ' } });
        fireEvent.keyDown(input, { key: 'Enter' });

        expect(onChange).not.toHaveBeenCalled();
    });

    it('removes an item when its trash icon is clicked', () => {
        const onChange = vi.fn();
        render(<ListInput items={['a', 'b', 'c']} onChange={onChange} accentColor="orange" />);

        fireEvent.click(screen.getByLabelText('Remove b'));
        expect(onChange).toHaveBeenCalledWith(['a', 'c']);
    });

    it('auto-commits uncommitted text on blur', () => {
        const onChange = vi.fn();
        render(<ListInput items={[]} onChange={onChange} accentColor="emerald" />);
        const input = screen.getByPlaceholderText('Add factor...');

        fireEvent.change(input, { target: { value: 'typed but not submitted' } });
        fireEvent.blur(input);

        expect(onChange).toHaveBeenCalledWith(['typed but not submitted']);
    });

    it('does not double-add when Enter is pressed then the field is blurred', () => {
        const onChange = vi.fn();
        render(<ListInput items={[]} onChange={onChange} accentColor="emerald" />);
        const input = screen.getByPlaceholderText('Add factor...');

        fireEvent.change(input, { target: { value: 'one item' } });
        fireEvent.keyDown(input, { key: 'Enter' });
        fireEvent.blur(input);

        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith(['one item']);
    });

    it('renders the title heading with accent dot when provided', () => {
        render(<ListInput items={[]} onChange={vi.fn()} accentColor="sky" title="Advantages of Doing" />);
        expect(screen.getByText('Advantages of Doing')).toBeInTheDocument();
    });

    it('omits the heading when title is not provided', () => {
        render(<ListInput items={[]} onChange={vi.fn()} accentColor="sky" />);
        expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    });
});
