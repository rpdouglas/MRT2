import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import JournalEditor from '../components/journal/JournalEditor';
import { BrowserRouter } from 'react-router-dom';

// --- MOCKS ---

// Mock Auth Context
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { uid: 'test-user', displayName: 'Tester' }
  })
}));

// Mock Firebase (Generic)
vi.mock('../lib/firebase', () => ({
  db: {} // Empty object is enough for the component to render
}));

// Mock Firestore methods
vi.mock('firebase/firestore', async (importOriginal) => {
  // Use generics to avoid 'any' cast
  const actual = await importOriginal<typeof import('firebase/firestore')>();
  return {
    ...actual,
    collection: vi.fn(),
    addDoc: vi.fn().mockResolvedValue({ id: 'new-doc-id' }),
    updateDoc: vi.fn().mockResolvedValue({}),
    serverTimestamp: vi.fn(),
  };
});

describe('JournalEditor Component', () => {
  
  it('renders default write mode correctly', () => {
    render(
      <BrowserRouter>
        <JournalEditor 
          onSaveComplete={vi.fn()} 
          initialEntry={null} // FIX: Must be null, not undefined
        />
      </BrowserRouter>
    );
    
    expect(screen.getByPlaceholderText(/Write your thoughts here/i)).toBeDefined();
    expect(screen.getByText(/Today/i)).toBeDefined();
  });

  it('loads the Urge Log template via props (Deep Linking)', () => {
    render(
      <BrowserRouter>
        <JournalEditor 
          onSaveComplete={vi.fn()} 
          initialEntry={null} // FIX: Must be null, not undefined
          initialTemplateId="urge_log" 
        />
      </BrowserRouter>
    );

    // Verify template specific fields appear
    expect(screen.getByDisplayValue(/Trigger:/i)).toBeDefined();
    expect(screen.getByDisplayValue(/Intensity \(1-10\):/i)).toBeDefined();
  });

  it('updates mood score when slider changes', () => {
    render(
      <BrowserRouter>
        <JournalEditor 
          onSaveComplete={vi.fn()} 
          initialEntry={null} // FIX: Must be null, not undefined
        />
      </BrowserRouter>
    );
    
    // Find slider (range input)
    const slider = screen.getByRole('slider');
    
    // Change value to 8
    fireEvent.change(slider, { target: { value: '8' } });
    
    // Check if the UI reflects the score '8'
    expect(screen.getByText('8')).toBeDefined();
  });

  it('allows switching templates manually', () => {
    render(
      <BrowserRouter>
        <JournalEditor 
          onSaveComplete={vi.fn()} 
          initialEntry={null} // FIX: Must be null, not undefined
        />
      </BrowserRouter>
    );

    // Find template selector
    const selector = screen.getByRole('combobox');
    
    // Select "Morning Check-in"
    fireEvent.change(selector, { target: { value: 'morning' } });
    
    // Verify content updated
    expect(screen.getByDisplayValue(/3 things I'm grateful for/i)).toBeDefined();
  });
});