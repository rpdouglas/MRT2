/**
 * src/pages/__tests__/ToolsHub.test.tsx
 * PROJ-50 §5: Tools Hub Redesign / PROJ-71: Tools Hub Regrouping
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import { render, screen, within, fireEvent } from '@testing-library/react';
import ToolsHub from '../ToolsHub';
import { useSmartToolCompletions } from '../../hooks/useSmartToolCompletions';
import { hasGuidedDraft } from '../../hooks/useGuidedDraft';

vi.mock('../../hooks/useSmartToolCompletions', () => ({ useSmartToolCompletions: vi.fn() }));
vi.mock('../../hooks/useGuidedDraft', () => ({ hasGuidedDraft: vi.fn(() => false) }));
vi.mock('../../contexts/LayoutContext', () => ({ useLayout: () => ({ isOnline: true }) }));
vi.mock('react-router-dom', () => ({
    useNavigate: () => vi.fn(),
    Link: ({ children, to, className }: { children: React.ReactNode; to: string; className?: string }) => (
        <a href={to} className={className}>{children}</a>
    ),
}));

/** Finds a tool's card by title, resolving to the element matching the card's `rounded-2xl` shell. */
function cardFor(title: string) {
    const card = screen.getAllByText(title)
        .map(el => el.closest('div.rounded-2xl, a.rounded-2xl'))
        .find((el): el is HTMLElement => el !== null);
    if (!card) throw new Error(`No card found for "${title}"`);
    return card;
}

/** CBA/D.E.N.T.S. live in "Before It Happens"; Lifestyle Balance/SMART Goal live in "Big Picture" — both collapsed by default. */
function expandSection(label: string) {
    fireEvent.click(screen.getByRole('button', { name: new RegExp(label) }));
}

describe('🧩 ToolsHub page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (hasGuidedDraft as Mock).mockReturnValue(false);
        (useSmartToolCompletions as Mock).mockReturnValue({ data: { counts: {}, hasDraftDoc: {} } });
    });

    it('always shows a Start Fresh link for a real guided tool, pointing at ?fresh=1', () => {
        render(<ToolsHub />);
        expandSection('Before It Happens');
        const card = cardFor('Cost Benefit Analysis');
        expect(within(card).getByText('Start Fresh').closest('a')).toHaveAttribute('href', '/tools/cba?fresh=1');
    });

    it('hides Resume when there is no draft anywhere', () => {
        render(<ToolsHub />);
        expandSection('Before It Happens');
        const card = cardFor('Cost Benefit Analysis');
        expect(within(card).queryByText('Resume')).not.toBeInTheDocument();
    });

    it('shows Resume when a same-session sessionStorage draft exists', () => {
        (hasGuidedDraft as Mock).mockImplementation((toolType: string) => toolType === 'CBA');
        render(<ToolsHub />);
        expandSection('Before It Happens');
        const card = cardFor('Cost Benefit Analysis');
        expect(within(card).getByText('Resume').closest('a')).toHaveAttribute('href', '/tools/cba');
    });

    it('shows Resume when a cross-session Firestore DRAFT doc exists, even with no sessionStorage draft', () => {
        (useSmartToolCompletions as Mock).mockReturnValue({ data: { counts: {}, hasDraftDoc: { DENTS: true } } });
        render(<ToolsHub />);
        expandSection('Before It Happens');
        const card = cardFor('D.E.N.T.S. Strategy');
        expect(within(card).getByText('Resume')).toBeInTheDocument();
    });

    it('never shows Resume for a non-guided-flow tool (Lifestyle Balance), even if hasDraftDoc were somehow true', () => {
        (useSmartToolCompletions as Mock).mockReturnValue({ data: { counts: {}, hasDraftDoc: { LIFESTYLE_BALANCE: true } } });
        render(<ToolsHub />);
        expandSection('Big Picture');
        const card = cardFor('Lifestyle Balance');
        expect(within(card).queryByText('Resume')).not.toBeInTheDocument();
    });

    it('shows the completion badge and a History link once a tool has completions', () => {
        (useSmartToolCompletions as Mock).mockReturnValue({ data: { counts: { CBA: 3 }, hasDraftDoc: {} } });
        render(<ToolsHub />);
        expandSection('Before It Happens');
        const card = cardFor('Cost Benefit Analysis');
        expect(within(card).getByText('Completed 3 times')).toBeInTheDocument();
        expect(within(card).getByText('History').closest('a')).toHaveAttribute('href', '/tools/CBA/history');
    });

    it('uses singular phrasing for exactly one completion', () => {
        (useSmartToolCompletions as Mock).mockReturnValue({ data: { counts: { CBA: 1 }, hasDraftDoc: {} } });
        render(<ToolsHub />);
        expandSection('Before It Happens');
        expect(within(cardFor('Cost Benefit Analysis')).getByText('Completed 1 time')).toBeInTheDocument();
    });

    it('hides the completion badge and History link when the count is zero', () => {
        render(<ToolsHub />);
        expandSection('Before It Happens');
        const card = cardFor('Cost Benefit Analysis');
        expect(within(card).queryByText(/Completed/)).not.toBeInTheDocument();
        expect(within(card).queryByText('History')).not.toBeInTheDocument();
    });

    it('renders SMART Goal as a disabled Coming Soon card with no action buttons', () => {
        render(<ToolsHub />);
        expandSection('Big Picture');
        expect(screen.getByText('Coming Soon')).toBeInTheDocument();
        const card = cardFor('SMART Goal');
        expect(within(card).queryByText('Start Fresh')).not.toBeInTheDocument();
    });

    it('renders Urge Surfer as the original simple card with no entry-mode buttons', () => {
        render(<ToolsHub />);
        expandSection('Right Now');
        const card = cardFor('Urge Surfer');
        expect(within(card).queryByText('Start Fresh')).not.toBeInTheDocument();
        expect(card.tagName).toBe('A');
        expect(card).toHaveAttribute('href', '/tools/urge-surfer');
    });

    describe('moment-based grouping (PROJ-71)', () => {
        it('keeps all four sections collapsed by default', () => {
            render(<ToolsHub />);
            expect(screen.queryByText('Urge Surfer')).not.toBeInTheDocument();
            expect(screen.queryByText('Cost Benefit Analysis')).not.toBeInTheDocument();
            expect(screen.queryByText('Thought Record')).not.toBeInTheDocument();
            expect(screen.queryByText('Lifestyle Balance')).not.toBeInTheDocument();
        });

        it('reveals a collapsed section\'s tools once its header is clicked', () => {
            render(<ToolsHub />);
            expandSection('Before It Happens');
            expect(screen.getByText('Cost Benefit Analysis')).toBeInTheDocument();
            expect(screen.getByText('D.E.N.T.S. Strategy')).toBeInTheDocument();
        });

        it('shows a tool count badge per section', () => {
            render(<ToolsHub />);
            const beforeHeader = screen.getByRole('button', { name: /Before It Happens/ });
            // PROJ-72: Morning Intent joined CBA and D.E.N.T.S. in this section.
            expect(within(beforeHeader).getByText('3')).toBeInTheDocument();
        });
    });
});
