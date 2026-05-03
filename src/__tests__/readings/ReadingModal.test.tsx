import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ReadingModal from '../../components/readings/ReadingModal';
import type { DailyReading } from '../../lib/db';
import type { Timestamp } from 'firebase/firestore';

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

describe('ReadingModal — optional fields', () => {
  it('renders without error when goDeeper is undefined', () => {
    render(<ReadingModal readings={[base]} onClose={() => {}} />);
    expect(screen.getByText('Surrender')).toBeInTheDocument();
  });

  it('does not render a Go Deeper link when goDeeper is absent', () => {
    render(<ReadingModal readings={[base]} onClose={() => {}} />);
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('renders a Go Deeper link when goDeeper is present', () => {
    const reading = { ...base, goDeeper: { label: 'Learn more', url: 'https://aa.org' } };
    render(<ReadingModal readings={[reading]} onClose={() => {}} />);
    const link = screen.getByRole('link', { name: /learn more/i });
    expect(link).toHaveAttribute('href', 'https://aa.org');
  });

  it('renders attribution when present', () => {
    const reading = { ...base, attribution: 'Adapted from Recovery Dharma, CC BY-SA 4.0' };
    render(<ReadingModal readings={[reading]} onClose={() => {}} />);
    expect(screen.getByText(/Adapted from Recovery Dharma/)).toBeInTheDocument();
  });

  it('does not render attribution when absent', () => {
    render(<ReadingModal readings={[base]} onClose={() => {}} />);
    expect(screen.queryByText(/CC BY-SA/)).toBeNull();
  });
});

describe('ReadingModal — navigation', () => {
  const second: DailyReading = {
    ...base,
    id: 'smart-recovery_2026-05-03',
    modality: 'smart-recovery',
    theme: 'Motivation',
  };

  it('shows prev/next navigation when multiple readings are passed', () => {
    render(<ReadingModal readings={[base, second]} onClose={() => {}} />);
    expect(screen.getByLabelText('Previous reading')).toBeInTheDocument();
    expect(screen.getByLabelText('Next reading')).toBeInTheDocument();
  });

  it('hides navigation when only one reading is passed', () => {
    render(<ReadingModal readings={[base]} onClose={() => {}} />);
    expect(screen.queryByLabelText('Previous reading')).toBeNull();
    expect(screen.queryByLabelText('Next reading')).toBeNull();
  });

  it('advances to the next reading on next button click', () => {
    render(<ReadingModal readings={[base, second]} onClose={() => {}} />);
    expect(screen.getByText('Surrender')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Next reading'));
    expect(screen.getByText('Motivation')).toBeInTheDocument();
  });
});

describe('ReadingModal — journal callback', () => {
  it('calls onJournal with the current reading when Journal is clicked', () => {
    const onJournal = vi.fn();
    render(<ReadingModal readings={[base]} onClose={() => {}} onJournal={onJournal} />);
    fireEvent.click(screen.getByRole('button', { name: /journal/i }));
    expect(onJournal).toHaveBeenCalledOnce();
    expect(onJournal).toHaveBeenCalledWith(base);
  });

  it('does not render Journal button when onJournal prop is absent', () => {
    render(<ReadingModal readings={[base]} onClose={() => {}} />);
    expect(screen.queryByRole('button', { name: /journal/i })).toBeNull();
  });
});
