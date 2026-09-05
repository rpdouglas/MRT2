/**
 * src/components/dashboard/__tests__/DailyImageModal.test.tsx
 * Regression coverage for a real user report: tapping "Share" appeared to do
 * nothing. Root cause was DailyImageModal's own fetch() of the Storage
 * download URL never checking res.ok, plus a silent console.error-only catch
 * with no user-visible feedback — see the fix in DailyImageModal.tsx.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DailyImageModal from '../DailyImageModal';
import type { DailyImageRecord } from '../../../lib/db';

const mockDailyImage: DailyImageRecord = {
  date: '2026-09-05',
  imageId: 'image-123',
  storagePath: 'daily-images/image-123.jpg',
  downloadUrl: 'https://firebasestorage.googleapis.com/daily-images/image-123.jpg',
  caption: 'Every day clean is a day you chose yourself.',
  assignedAt: null as unknown as DailyImageRecord['assignedAt'],
};

vi.mock('../../../hooks/useDailyImage', () => ({
  useDailyImage: () => ({ dailyImage: mockDailyImage, isLoading: false, isError: false }),
}));

const mockShareFile = vi.fn();
vi.mock('../../../hooks/useShareImage', () => ({
  shareFile: (...args: unknown[]) => mockShareFile(...args),
}));

vi.mock('../../journal/JournalEditor', () => ({ default: () => <div>Journal Editor</div> }));
vi.mock('../../VaultGate', () => ({ default: ({ children }: { children: React.ReactNode }) => <>{children}</> }));

describe('DailyImageModal', () => {
  beforeEach(() => {
    mockShareFile.mockReset();
    mockShareFile.mockResolvedValue(undefined);
  });

  it('shares successfully when the image fetch resolves ok', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(new Blob(['fake-image-bytes'], { type: 'image/jpeg' })),
    }));

    render(<DailyImageModal onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /share/i }));

    await waitFor(() => expect(mockShareFile).toHaveBeenCalledTimes(1));
    expect(screen.queryByText(/couldn't share/i)).not.toBeInTheDocument();

    vi.unstubAllGlobals();
  });

  it('surfaces a visible error when the Storage fetch returns a non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      blob: () => Promise.resolve(new Blob(['<xml>not found</xml>'])),
    }));

    render(<DailyImageModal onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /share/i }));

    await waitFor(() => expect(screen.getByText(/couldn't share/i)).toBeInTheDocument());
    expect(mockShareFile).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
  });

  it('does not show an error when the user just closes the native share sheet', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(new Blob(['fake-image-bytes'], { type: 'image/jpeg' })),
    }));
    const abortError = new DOMException('The user aborted a request.', 'AbortError');
    mockShareFile.mockRejectedValue(abortError);

    render(<DailyImageModal onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /share/i }));

    await waitFor(() => expect(mockShareFile).toHaveBeenCalledTimes(1));
    expect(screen.queryByText(/couldn't share/i)).not.toBeInTheDocument();

    vi.unstubAllGlobals();
  });
});
