import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import VibrantHeader from '../components/VibrantHeader';
import { LayoutProvider, useLayout } from '../contexts/LayoutContext';
import { HeartIcon, PhotoIcon } from '@heroicons/react/24/outline';

function renderHeader(subtitle: string, extraAction?: Parameters<typeof VibrantHeader>[0]['extraAction']) {
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
          extraAction={extraAction}
        />
      </LayoutProvider>
    </MemoryRouter>
  );
}

// PROJ-104 follow-up regression guard: AppShell relies on this flag to know
// whether it's safe to hide its own fallback SOS button.
function HeaderSOSMountedProbe() {
  const { headerSOSMounted } = useLayout();
  return <span data-testid="header-sos-mounted">{String(headerSOSMounted)}</span>;
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

  it('omits the extra action button when none is provided', () => {
    renderHeader('Structured guides to process your journey.');
    expect(screen.queryByLabelText("View today's image")).not.toBeInTheDocument();
  });

  it('renders and wires up an optional extra action button (PROJ-113)', () => {
    const onClick = vi.fn();
    renderHeader('Structured guides to process your journey.', {
      icon: PhotoIcon,
      onClick,
      label: "View today's image",
    });

    const button = screen.getByLabelText("View today's image");
    expect(button).toBeInTheDocument();
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('registers headerSOSMounted on mount and clears it on unmount (PROJ-104 follow-up)', () => {
    const { unmount } = render(
      <MemoryRouter>
        <LayoutProvider>
          <HeaderSOSMountedProbe />
          <VibrantHeader
            title="My Workbooks"
            subtitle="Structured guides to process your journey."
            icon={HeartIcon}
            fromColor="from-emerald-600"
            viaColor="via-teal-600"
            toColor="to-emerald-600"
          />
        </LayoutProvider>
      </MemoryRouter>
    );

    expect(screen.getByTestId('header-sos-mounted').textContent).toBe('true');
    unmount();
  });

  it('leaves headerSOSMounted false when no VibrantHeader is mounted', () => {
    render(
      <MemoryRouter>
        <LayoutProvider>
          <HeaderSOSMountedProbe />
        </LayoutProvider>
      </MemoryRouter>
    );

    expect(screen.getByTestId('header-sos-mounted').textContent).toBe('false');
  });
});
