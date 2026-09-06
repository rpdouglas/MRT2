/**
 * PROJ-116: proves CrisisResourcesPanel needs no auth/encryption context —
 * this is the crisis-bypass target for an unauthenticated Welcome-page
 * visitor, so unlike SOSModal it must render standalone. Deliberately no
 * AuthContext/EncryptionContext/QueryClient providers wrapped here.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CrisisResourcesPanel from '../CrisisResourcesPanel';

describe('CrisisResourcesPanel', () => {
  it('renders crisis support options with no auth/encryption context providers', () => {
    render(<CrisisResourcesPanel isOpen onClose={vi.fn()} />);

    expect(screen.getByText('You are not alone')).toBeInTheDocument();
    expect(screen.getByText('Call 988 (Lifeline)')).toBeInTheDocument();
    expect(screen.getByText('Call 911')).toBeInTheDocument();
  });

  it('reveals the meeting-finder links on demand', () => {
    render(<CrisisResourcesPanel isOpen onClose={vi.fn()} />);

    expect(screen.queryByText('Alcoholics Anonymous (AA)')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Find a Meeting'));
    expect(screen.getByText('Alcoholics Anonymous (AA)')).toBeInTheDocument();
  });

  it('calls onClose when dismissed', () => {
    const onClose = vi.fn();
    render(<CrisisResourcesPanel isOpen onClose={onClose} />);
    // Two "Close" elements exist: the sr-only label on the X icon button,
    // and the visible dismiss button — click the visible one.
    const closeButtons = screen.getAllByText('Close');
    fireEvent.click(closeButtons[closeButtons.length - 1]);
    expect(onClose).toHaveBeenCalled();
  });
});
