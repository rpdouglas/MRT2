/**
 * src/pages/__tests__/Workbooks.test.tsx
 * PROJ-75 (Workbook Marketplace v1): "My Workbooks" only lists installed
 * workbooks, the new Marketplace tab lists the full official catalog with
 * add/remove controls, and those controls call through to useWorkbookLibrary.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Workbooks from '../Workbooks';
import { WORKBOOKS } from '../../data/workbooks';
import * as WorkbookLibraryHook from '../../hooks/useWorkbookLibrary';

vi.mock('../../hooks/useWorkbookLibrary', () => ({ useWorkbookLibrary: vi.fn() }));
vi.mock('../../components/VibrantHeader', () => ({ default: ({ title }: { title: string }) => <h1>{title}</h1> }));

type WorkbookLibraryValue = ReturnType<typeof WorkbookLibraryHook.useWorkbookLibrary>;

const addWorkbook = vi.fn();
const removeWorkbook = vi.fn();

function mockLibrary(installedIds: string[]) {
  vi.mocked(WorkbookLibraryHook.useWorkbookLibrary).mockReturnValue({
    isLoading: false,
    catalog: WORKBOOKS,
    installedWorkbooks: WORKBOOKS.filter(w => installedIds.includes(w.id)),
    isInstalled: (id: string) => installedIds.includes(id),
    addWorkbook,
    removeWorkbook,
    isUpdating: false,
  } as unknown as WorkbookLibraryValue);
}

function renderWorkbooks() {
  return render(
    <BrowserRouter>
      <Workbooks />
    </BrowserRouter>,
  );
}

describe('📖 Workbooks page (Marketplace v1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. "My Workbooks" tab only renders installed workbooks', () => {
    mockLibrary(['general_recovery']);
    renderWorkbooks();

    expect(screen.getByText('General Recovery Workbook')).toBeInTheDocument();
    expect(screen.queryByText('12-Step Workbook')).not.toBeInTheDocument();
  });

  it('2. "My Workbooks" shows an empty-library message when nothing is installed', () => {
    mockLibrary([]);
    renderWorkbooks();

    expect(screen.getByText('Your library is empty.')).toBeInTheDocument();
  });

  it('3. Marketplace tab lists every official workbook in the catalog', async () => {
    mockLibrary(['general_recovery']);
    renderWorkbooks();

    fireEvent.click(screen.getByText('Marketplace'));

    for (const workbook of WORKBOOKS) {
      expect(screen.getByText(workbook.title)).toBeInTheDocument();
    }
  });

  it('4. Marketplace shows "Remove" for installed workbooks and "Add" for the rest', () => {
    mockLibrary(['general_recovery']);
    renderWorkbooks();

    fireEvent.click(screen.getByText('Marketplace'));

    expect(screen.getAllByText('Remove')).toHaveLength(1);
    expect(screen.getAllByText('Add')).toHaveLength(WORKBOOKS.length - 1);
  });

  it('5. clicking "Add" on a specific card calls addWorkbook with that workbook id', async () => {
    mockLibrary(['general_recovery']);
    renderWorkbooks();

    fireEvent.click(screen.getByText('Marketplace'));
    const stepsCard = screen.getByText('12-Step Workbook').closest('div[class*="rounded-xl"]') as HTMLElement;
    fireEvent.click(within(stepsCard).getByText('Add'));

    await waitFor(() => expect(addWorkbook).toHaveBeenCalledWith('12_steps'));
  });

  it('6. clicking "Remove" calls removeWorkbook with the installed workbook id', () => {
    mockLibrary(['general_recovery']);
    renderWorkbooks();

    fireEvent.click(screen.getByText('Marketplace'));
    fireEvent.click(screen.getByText('Remove'));

    expect(removeWorkbook).toHaveBeenCalledWith('general_recovery');
  });
});
