import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import ReadingShareButton from '../../components/readings/ReadingShareButton';
import type { DailyReading } from '../../lib/db';
import type { Timestamp } from 'firebase/firestore';

const mockWriteText = vi.fn().mockResolvedValue(undefined);

beforeEach(() => {
  vi.clearAllMocks();
  // Ensure clipboard API is available and navigator.share is absent (force clipboard path)
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: mockWriteText },
    configurable: true,
  });
  Object.defineProperty(navigator, 'share', {
    value: undefined,
    configurable: true,
    writable: true,
  });
});

const base: DailyReading = {
  id: 'twelve-step-aa_2026-05-03',
  modality: 'twelve-step-aa',
  date: '2026-05-03',
  theme: 'Surrender',
  title: 'One Day at a Time',
  body: 'In recovery, we learn to let go.',
  reflection: 'What does surrender mean to you today?',
  affirmation: 'I am enough.',
  bufferBatch: 1,
  generatedAt: {} as Timestamp,
};

async function clickShare() {
  const btn = screen.getByRole('button', { name: /share reading/i });
  await act(async () => { fireEvent.click(btn); });
  return mockWriteText.mock.calls[0]?.[0] as string;
}

describe('ReadingShareButton — share text content', () => {
  it('includes theme, body, reflection, affirmation, and url', async () => {
    render(<ReadingShareButton reading={base} />);
    const text = await clickShare();

    expect(text).toContain(base.theme);
    expect(text).toContain(base.body);
    expect(text).toContain(base.reflection);
    expect(text).toContain(base.affirmation);
    expect(text).toContain('www.myrecoverytoolkit.ca');
  });

  it('includes attribution when present', async () => {
    const reading = { ...base, attribution: 'Adapted from Recovery Dharma, CC BY-SA 4.0 — recoverydharma.org' };
    render(<ReadingShareButton reading={reading} />);
    const text = await clickShare();
    expect(text).toContain(reading.attribution);
  });

  it('includes Go Deeper label and URL when present', async () => {
    const reading = { ...base, goDeeper: { label: 'Learn more', url: 'https://aa.org' } };
    render(<ReadingShareButton reading={reading} />);
    const text = await clickShare();
    expect(text).toContain('Learn more');
    expect(text).toContain('https://aa.org');
  });

  it('omits attribution block when absent', async () => {
    render(<ReadingShareButton reading={base} />);
    const text = await clickShare();
    expect(text).not.toContain('CC BY-SA');
    expect(text).not.toContain('recoverydharma.org');
  });
});

describe('ReadingShareButton — PII safety', () => {
  it('does not include any user identifier in the share text', async () => {
    render(<ReadingShareButton reading={base} />);
    const text = await clickShare();

    // No UID-shaped strings (Firebase UIDs are ~28-char alphanumeric)
    expect(text).not.toMatch(/[a-zA-Z0-9]{28,}/);
    // No email patterns
    expect(text).not.toMatch(/\S+@\S+\.\S+/);
    // Output is plain text — no HTML tags
    expect(text).not.toMatch(/<[^>]+>/);
  });

  it('contains only reading content fields — no Firestore metadata', async () => {
    render(<ReadingShareButton reading={base} />);
    const text = await clickShare();

    expect(text).not.toContain(base.id);
    expect(text).not.toContain(base.date);
    expect(text).not.toContain(base.modality);
  });
});

describe('ReadingShareButton — UI state', () => {
  it('shows "Copied" feedback after successful clipboard write', async () => {
    render(<ReadingShareButton reading={base} />);
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /share reading/i })); });
    expect(screen.getByText('Copied')).toBeInTheDocument();
  });
});
