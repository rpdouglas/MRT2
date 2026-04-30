import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import PremiumGate from '../PremiumGate';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

// Mock the hooks
vi.mock('../../contexts/AuthContext', () => ({
    useAuth: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
    useNavigate: vi.fn(),
}));

describe('PremiumGate', () => {
    const mockNavigate = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (useNavigate as Mock).mockReturnValue(mockNavigate);
    });

    it('renders children natively if userTier === premium', () => {
        (useAuth as Mock).mockReturnValue({ userTier: 'premium' });

        render(
            <PremiumGate>
                <div data-testid="premium-content">Content</div>
            </PremiumGate>
        );

        expect(screen.getByTestId('premium-content')).toBeInTheDocument();
        expect(screen.queryByText('Supporter Feature')).not.toBeInTheDocument();
    });

    it('renders the lock button if userTier !== premium and fallbackMode === button_swap', () => {
        (useAuth as Mock).mockReturnValue({ userTier: 'free' });

        render(
            <PremiumGate fallbackMode="button_swap">
                <div data-testid="premium-content">Content</div>
            </PremiumGate>
        );

        expect(screen.queryByTestId('premium-content')).not.toBeInTheDocument();
        const button = screen.getByText('Supporter Feature');
        expect(button).toBeInTheDocument();

        fireEvent.click(button);
        expect(mockNavigate).toHaveBeenCalledWith('/premium');
    });

    it('renders the blurred overlay container if fallbackMode === lock_overlay', () => {
        (useAuth as Mock).mockReturnValue({ userTier: 'free' });

        render(
            <PremiumGate fallbackMode="lock_overlay">
                <div data-testid="premium-content">Content</div>
            </PremiumGate>
        );

        // Content is technically rendered but blurred in the DOM
        expect(screen.getByTestId('premium-content')).toBeInTheDocument();
        
        const overlayText = screen.getByText('Premium Access Required');
        expect(overlayText).toBeInTheDocument();

        const viewBenefitsButton = screen.getByText('View Benefits');
        fireEvent.click(viewBenefitsButton);
        expect(mockNavigate).toHaveBeenCalledWith('/premium');
    });

    it('returns null if userTier !== premium and fallbackMode === hide', () => {
        (useAuth as Mock).mockReturnValue({ userTier: 'free' });

        const { container } = render(
            <PremiumGate fallbackMode="hide">
                <div data-testid="premium-content">Content</div>
            </PremiumGate>
        );

        expect(screen.queryByTestId('premium-content')).not.toBeInTheDocument();
        expect(container).toBeEmptyDOMElement();
    });
});
