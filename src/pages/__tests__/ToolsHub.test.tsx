/**
 * src/pages/__tests__/ToolsHub.test.tsx
 * PROJ-50 §5: Tools Hub Redesign
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import { render, screen, within } from '@testing-library/react';
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

function cardFor(title: string) {
    return screen.getByText(title).closest('div.bg-white, a.group') as HTMLElement;
}

describe('🧩 ToolsHub page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (hasGuidedDraft as Mock).mockReturnValue(false);
        (useSmartToolCompletions as Mock).mockReturnValue({ data: { counts: {}, hasDraftDoc: {} } });
    });

    it('always shows a Start Fresh link for a real guided tool, pointing at ?fresh=1', () => {
        render(<ToolsHub />);
        const card = cardFor('Cost Benefit Analysis');
        expect(within(card).getByText('Start Fresh').closest('a')).toHaveAttribute('href', '/tools/cba?fresh=1');
    });

    it('hides Resume when there is no draft anywhere', () => {
        render(<ToolsHub />);
        const card = cardFor('Cost Benefit Analysis');
        expect(within(card).queryByText('Resume')).not.toBeInTheDocument();
    });

    it('shows Resume when a same-session sessionStorage draft exists', () => {
        (hasGuidedDraft as Mock).mockImplementation((toolType: string) => toolType === 'CBA');
        render(<ToolsHub />);
        const card = cardFor('Cost Benefit Analysis');
        expect(within(card).getByText('Resume').closest('a')).toHaveAttribute('href', '/tools/cba');
    });

    it('shows Resume when a cross-session Firestore DRAFT doc exists, even with no sessionStorage draft', () => {
        (useSmartToolCompletions as Mock).mockReturnValue({ data: { counts: {}, hasDraftDoc: { DENTS: true } } });
        render(<ToolsHub />);
        const card = cardFor('D.E.N.T.S. Strategy');
        expect(within(card).getByText('Resume')).toBeInTheDocument();
    });

    it('never shows Resume for a non-guided-flow tool (Lifestyle Balance), even if hasDraftDoc were somehow true', () => {
        (useSmartToolCompletions as Mock).mockReturnValue({ data: { counts: {}, hasDraftDoc: { LIFESTYLE_BALANCE: true } } });
        render(<ToolsHub />);
        const card = cardFor('Lifestyle Balance');
        expect(within(card).queryByText('Resume')).not.toBeInTheDocument();
    });

    it('shows the completion badge and a History link once a tool has completions', () => {
        (useSmartToolCompletions as Mock).mockReturnValue({ data: { counts: { CBA: 3 }, hasDraftDoc: {} } });
        render(<ToolsHub />);
        const card = cardFor('Cost Benefit Analysis');
        expect(within(card).getByText('Completed 3 times')).toBeInTheDocument();
        expect(within(card).getByText('History').closest('a')).toHaveAttribute('href', '/tools/CBA/history');
    });

    it('uses singular phrasing for exactly one completion', () => {
        (useSmartToolCompletions as Mock).mockReturnValue({ data: { counts: { CBA: 1 }, hasDraftDoc: {} } });
        render(<ToolsHub />);
        expect(within(cardFor('Cost Benefit Analysis')).getByText('Completed 1 time')).toBeInTheDocument();
    });

    it('hides the completion badge and History link when the count is zero', () => {
        render(<ToolsHub />);
        const card = cardFor('Cost Benefit Analysis');
        expect(within(card).queryByText(/Completed/)).not.toBeInTheDocument();
        expect(within(card).queryByText('History')).not.toBeInTheDocument();
    });

    it('renders SMART Goal as a disabled Coming Soon card with no action buttons', () => {
        render(<ToolsHub />);
        expect(screen.getByText('Coming Soon')).toBeInTheDocument();
        const card = cardFor('SMART Goal');
        expect(within(card).queryByText('Start Fresh')).not.toBeInTheDocument();
    });

    it('renders Urge Surfer as the original simple card with no entry-mode buttons', () => {
        render(<ToolsHub />);
        const card = cardFor('Urge Surfer');
        expect(within(card).queryByText('Start Fresh')).not.toBeInTheDocument();
        expect(card.tagName).toBe('A');
        expect(card).toHaveAttribute('href', '/tools/urge-surfer');
    });
});
