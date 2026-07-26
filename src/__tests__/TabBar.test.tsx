import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TabBar from '../components/ui/TabBar';

const theme = {
  border: 'border-indigo-200',
  hoverText: 'hover:text-indigo-600',
  activeFrom: 'from-indigo-600',
  activeTo: 'to-violet-600',
};

describe('TabBar', () => {
  it('renders every tab label', () => {
    render(
      <TabBar
        tabs={[{ id: 'a', label: 'Alpha' }, { id: 'b', label: 'Beta' }]}
        activeTab="a"
        onChange={vi.fn()}
        {...theme}
      />
    );
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });

  it('calls onChange with the clicked tab id', () => {
    const onChange = vi.fn();
    render(
      <TabBar
        tabs={[{ id: 'a', label: 'Alpha' }, { id: 'b', label: 'Beta' }]}
        activeTab="a"
        onChange={onChange}
        {...theme}
      />
    );
    fireEvent.click(screen.getByText('Beta'));
    expect(onChange).toHaveBeenCalledWith('b');
  });

  it('applies the active gradient classes only to the active tab', () => {
    render(
      <TabBar
        tabs={[{ id: 'a', label: 'Alpha' }, { id: 'b', label: 'Beta' }]}
        activeTab="a"
        onChange={vi.fn()}
        {...theme}
      />
    );
    expect(screen.getByText('Alpha').closest('button')?.className).toContain('from-indigo-600');
    expect(screen.getByText('Beta').closest('button')?.className).not.toContain('from-indigo-600');
  });

  it('shows a badge only when its count is greater than zero', () => {
    render(
      <TabBar
        tabs={[{ id: 'a', label: 'Alpha', badge: 3 }, { id: 'b', label: 'Beta', badge: 0 }]}
        activeTab="a"
        onChange={vi.fn()}
        {...theme}
      />
    );
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  // Regression guard: buttons must be allowed to keep their natural (min-w-fit)
  // width and the row must scroll (overflow-x-auto) rather than shrinking below
  // content width — flex-1 with no min-width floor lets long/many labels
  // overlap each other instead of wrapping or scrolling. See docs/projects/77.
  it('never lets tabs shrink below their content width', () => {
    render(
      <TabBar
        tabs={[
          { id: 'a', label: 'General' },
          { id: 'b', label: 'Security' },
          { id: 'c', label: 'Data' },
          { id: 'd', label: 'Achievements' },
        ]}
        activeTab="a"
        onChange={vi.fn()}
        {...theme}
      />
    );
    const container = screen.getByText('Achievements').closest('div.flex');
    expect(container?.className).toContain('overflow-x-auto');
    for (const label of ['General', 'Security', 'Data', 'Achievements']) {
      expect(screen.getByText(label).closest('button')?.className).toContain('min-w-fit');
    }
  });
});
