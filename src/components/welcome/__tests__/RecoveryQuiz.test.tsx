import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RecoveryQuiz from '../RecoveryQuiz';

describe('RecoveryQuiz', () => {
  it('walks through all 4 questions and resolves to the expected persona', () => {
    const onWebSignupClick = vi.fn();
    render(<RecoveryQuiz onWebSignupClick={onWebSignupClick} />);

    fireEvent.click(screen.getByText('Start the quiz'));

    fireEvent.click(screen.getByText('Calm, low friction')); // Q1 -> david
    fireEvent.click(screen.getByText('12-Step')); // Q2
    fireEvent.click(screen.getByText('Feeling overwhelmed')); // Q3
    fireEvent.click(screen.getByText('30 seconds at 2 AM')); // Q4

    expect(screen.getByText(/David — The Fresh Start/)).toBeInTheDocument();
  });

  it('fires onWebSignupClick with the resolved persona when the result CTA is clicked', () => {
    const onWebSignupClick = vi.fn();
    render(<RecoveryQuiz onWebSignupClick={onWebSignupClick} />);

    fireEvent.click(screen.getByText('Start the quiz'));
    fireEvent.click(screen.getByText("Supporting someone else's recovery")); // Q1 -> lisa
    fireEvent.click(screen.getByText('12-Step'));
    fireEvent.click(screen.getByText('Worries about data privacy'));
    fireEvent.click(screen.getByText('5 minutes between errands'));

    expect(screen.getByText(/Lisa — The Service Superstar/)).toBeInTheDocument();
    fireEvent.click(screen.getByText(/Begin your toolkit — built for Lisa/));
    expect(onWebSignupClick).toHaveBeenCalledWith('lisa');
  });
});
