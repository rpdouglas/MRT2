/**
 * src/components/journal/__tests__/TemplateEditor.test.tsx
 * PROJ-59: smoke test added as part of migrating this file off raw Firestore
 * calls onto useFirestoreQuery/useFirestoreMutation + db.ts's existing
 * getUserTemplates/saveUserTemplate/deleteUserTemplate (previously zero coverage).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TemplateEditor from '../TemplateEditor';

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { uid: 'test-user-123' } }),
}));

const mockGetUserTemplates = vi.fn();
const mockSaveUserTemplate = vi.fn();
const mockDeleteUserTemplate = vi.fn();
vi.mock('../../../lib/db', () => ({
  getUserTemplates: (...args: unknown[]) => mockGetUserTemplates(...args),
  saveUserTemplate: (...args: unknown[]) => mockSaveUserTemplate(...args),
  deleteUserTemplate: (...args: unknown[]) => mockDeleteUserTemplate(...args),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

function renderTemplateEditor() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TemplateEditor />
      </BrowserRouter>
    </QueryClientProvider>,
  );
}

describe('TemplateEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.confirm = vi.fn(() => true);
  });

  it('lists templates fetched via getUserTemplates', async () => {
    mockGetUserTemplates.mockResolvedValue([
      { id: 't1', name: 'Gratitude List', content: 'body', defaultTags: ['#gratitude'] },
    ]);

    renderTemplateEditor();

    expect(await screen.findByText('Gratitude List')).toBeInTheDocument();
    expect(mockGetUserTemplates).toHaveBeenCalledWith('test-user-123');
  });

  it('shows the empty state when there are no templates', async () => {
    mockGetUserTemplates.mockResolvedValue([]);
    renderTemplateEditor();

    expect(await screen.findByText(/haven't created any custom templates/i)).toBeInTheDocument();
  });

  it('saves a new template via saveUserTemplate with an empty id (create branch)', async () => {
    mockGetUserTemplates.mockResolvedValue([]);
    mockSaveUserTemplate.mockResolvedValue(undefined);
    renderTemplateEditor();

    fireEvent.click(await screen.findByText('Create New'));
    fireEvent.change(screen.getByPlaceholderText(/daily gratitude list/i), { target: { value: 'My Template' } });
    fireEvent.change(screen.getByPlaceholderText(/design your template here/i), { target: { value: 'Some content' } });
    fireEvent.click(screen.getByText('Save Template'));

    await waitFor(() => expect(mockSaveUserTemplate).toHaveBeenCalledWith(
      'test-user-123',
      expect.objectContaining({ id: '', name: 'My Template', content: 'Some content' }),
    ));
  });

  it('deletes a template via deleteUserTemplate after confirm', async () => {
    mockGetUserTemplates.mockResolvedValue([
      { id: 't1', name: 'Gratitude List', content: 'body', defaultTags: [] },
    ]);
    mockDeleteUserTemplate.mockResolvedValue(undefined);
    renderTemplateEditor();

    fireEvent.click(await screen.findByTitle('Delete'));

    await waitFor(() => expect(mockDeleteUserTemplate).toHaveBeenCalledWith('test-user-123', 't1'));
  });
});
