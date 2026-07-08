/**
 * src/components/tools/__tests__/YesNoToggle.test.tsx
 * PROJ-50 Phase 5: DENTS Scenario Mode & Five Questions
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { YesNoToggle } from '../YesNoToggle';

describe('🔘 YesNoToggle', () => {
    it('calls onChange with "yes" when the Yes button is tapped', () => {
        const onChange = vi.fn();
        render(<YesNoToggle value="" onChange={onChange} />);
        fireEvent.click(screen.getByRole('button', { name: 'Yes' }));
        expect(onChange).toHaveBeenCalledWith('yes');
    });

    it('calls onChange with "no" when the No button is tapped', () => {
        const onChange = vi.fn();
        render(<YesNoToggle value="" onChange={onChange} />);
        fireEvent.click(screen.getByRole('button', { name: 'No' }));
        expect(onChange).toHaveBeenCalledWith('no');
    });

    it('marks the selected option as pressed', () => {
        render(<YesNoToggle value="yes" onChange={vi.fn()} />);
        expect(screen.getByRole('button', { name: 'Yes' })).toHaveAttribute('aria-pressed', 'true');
        expect(screen.getByRole('button', { name: 'No' })).toHaveAttribute('aria-pressed', 'false');
    });

    it('renders an optional label when provided', () => {
        render(<YesNoToggle value="" onChange={vi.fn()} label="Is this thought true?" />);
        expect(screen.getByText('Is this thought true?')).toBeInTheDocument();
    });

    it('renders no label when omitted', () => {
        render(<YesNoToggle value="" onChange={vi.fn()} />);
        expect(screen.queryByText(/./, { selector: 'h4' })).not.toBeInTheDocument();
    });
});
