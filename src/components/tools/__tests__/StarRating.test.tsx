/**
 * src/components/tools/__tests__/StarRating.test.tsx
 * PROJ-50 Phase 5: Five Questions
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StarRating } from '../StarRating';

describe('⭐ StarRating', () => {
    it('renders 5 stars by default', () => {
        render(<StarRating value={0} onChange={vi.fn()} />);
        expect(screen.getAllByRole('button')).toHaveLength(5);
    });

    it('calls onChange with the tapped star number', () => {
        const onChange = vi.fn();
        render(<StarRating value={0} onChange={onChange} />);
        fireEvent.click(screen.getByRole('button', { name: 'Rate 3 out of 5' }));
        expect(onChange).toHaveBeenCalledWith(3);
    });

    it('marks only the current value as pressed', () => {
        render(<StarRating value={3} onChange={vi.fn()} />);
        expect(screen.getByRole('button', { name: 'Rate 3 out of 5' })).toHaveAttribute('aria-pressed', 'true');
        expect(screen.getByRole('button', { name: 'Rate 4 out of 5' })).toHaveAttribute('aria-pressed', 'false');
    });

    it('respects a custom max', () => {
        render(<StarRating value={0} onChange={vi.fn()} max={3} />);
        expect(screen.getAllByRole('button')).toHaveLength(3);
    });

    it('readOnly renders no buttons', () => {
        render(<StarRating value={4} readOnly />);
        expect(screen.queryAllByRole('button')).toHaveLength(0);
    });
});
