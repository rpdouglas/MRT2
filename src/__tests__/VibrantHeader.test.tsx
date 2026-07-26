import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import VibrantHeader from '../components/VibrantHeader';
import { LayoutProvider } from '../contexts/LayoutContext';
import { HeartIcon } from '@heroicons/react/24/outline';

function renderHeader(subtitle: string) {
  return render(
    <MemoryRouter>
      <LayoutProvider>
        <VibrantHeader
          title="My Workbooks"
          subtitle={subtitle}
          icon={HeartIcon}
          fromColor="from-emerald-600"
          viaColor="via-teal-600"
          toColor="to-emerald-600"
        />
      </LayoutProvider>
    </MemoryRouter>
  );
}

describe('VibrantHeader', () => {
  it('renders the SOS button', () => {
    renderHeader('Structured guides to process your journey.');
    expect(screen.getByLabelText('Emergency SOS')).toBeInTheDocument();
  });

  // Regression guard: a long subtitle previously pushed the SOS button past the
  // viewport edge because the center title/subtitle column was `shrink-0` and
  // never yielded width back to the flex-1 icon columns. See docs/projects/78.
  it('lets a long subtitle truncate instead of forcing the row to overflow', () => {
    renderHeader('Structured guides to process your journey.');
    const subtitle = screen.getByText('Structured guides to process your journey.');
    expect(subtitle.className).toContain('truncate');

    const centerColumn = subtitle.closest('div');
    expect(centerColumn?.className).toContain('min-w-0');
  });

  it('keeps the SOS button out of the shrinkable center column', () => {
    renderHeader('Structured guides to process your journey.');
    const sos = screen.getByLabelText('Emergency SOS');
    const rightColumn = sos.closest('div.flex-1');
    expect(rightColumn?.className).not.toContain('min-w-0');
  });
});
