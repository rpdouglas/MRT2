/**
 * src/pages/__tests__/ToolHistory.test.tsx
 * PROJ-50 §5: Tools Hub Redesign
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ToolHistory from '../ToolHistory';
import { useToolHistory } from '../../hooks/useToolHistory';
import { useParams } from 'react-router-dom';

vi.mock('../../hooks/useToolHistory', () => ({ useToolHistory: vi.fn() }));
vi.mock('../../contexts/LayoutContext', () => ({ useLayout: () => ({ isOnline: true }) }));

vi.mock('react-router-dom', () => ({
    useParams: vi.fn(),
    useNavigate: () => vi.fn(),
    Link: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
}));

describe('🗂️ ToolHistory page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('shows a not-found message for an unknown or missing toolType param', () => {
        (useParams as Mock).mockReturnValue({ toolType: 'NOT_A_REAL_TYPE' });
        (useToolHistory as Mock).mockReturnValue({ data: [], isLoading: false });

        render(<ToolHistory />);
        expect(screen.getByText("That tool doesn't have a history view.")).toBeInTheDocument();
    });

    it('shows a loading state', () => {
        (useParams as Mock).mockReturnValue({ toolType: 'CBA' });
        (useToolHistory as Mock).mockReturnValue({ data: [], isLoading: true });

        render(<ToolHistory />);
        expect(screen.getByText('Loading…')).toBeInTheDocument();
    });

    it('shows an empty state with a link to start the tool when there are no completions', () => {
        (useParams as Mock).mockReturnValue({ toolType: 'CBA' });
        (useToolHistory as Mock).mockReturnValue({ data: [], isLoading: false });

        render(<ToolHistory />);
        expect(screen.getByText('No completions yet.')).toBeInTheDocument();
        expect(screen.getByText('Start your first session →').closest('a')).toHaveAttribute('href', '/tools/cba');
    });

    it('lists each completion using the headline field, and expands to show full details on tap', () => {
        (useParams as Mock).mockReturnValue({ toolType: 'CBA' });
        (useToolHistory as Mock).mockReturnValue({
            data: [
                { id: 'doc-1', createdAt: new Date('2026-02-14'), data: { behavior: 'Drinking', advantagesDoing: ['Relief'] } },
            ],
            isLoading: false,
        });

        render(<ToolHistory />);
        expect(screen.getByText('Drinking')).toBeInTheDocument();
        expect(screen.queryByText('Relief')).not.toBeInTheDocument();

        fireEvent.click(screen.getByText('Drinking'));
        expect(screen.getByText('Relief')).toBeInTheDocument();
        // Real question text, dynamically referencing the saved behavior — not a generic humanized field name.
        expect(screen.getByText('What does Drinking actually give you?')).toBeInTheDocument();
    });

    it('falls back to the entry date as the headline when the headline field is empty', () => {
        (useParams as Mock).mockReturnValue({ toolType: 'CBA' });
        (useToolHistory as Mock).mockReturnValue({
            data: [{ id: 'doc-1', createdAt: new Date('2026-02-14'), data: { behavior: '' } }],
            isLoading: false,
        });

        render(<ToolHistory />);
        expect(screen.getAllByText('Feb 14, 2026')).toHaveLength(2); // date row + headline fallback
    });
});
