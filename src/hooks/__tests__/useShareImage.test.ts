// PROJ-113 (Daily Inspirational Image) extracted `shareFile` out of
// useShareImage.ts so DailyImageModal could share an already-fetched Blob
// without a toPng() DOM-snapshot step (see useShareImage.ts's PROJ-113
// comment). No existing test covered either path (native share vs. the
// download-link fallback) before this extraction — this covers both, per
// docs/projects/113_DAILY_INSPIRATIONAL_IMAGE.md §4's "navigator.share
// unsupported (desktop browsers) → falls back to a download link" edge case.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { shareFile } from '../useShareImage';

describe('shareFile', () => {
  let mockShare: ReturnType<typeof vi.fn>;
  let mockCanShare: ReturnType<typeof vi.fn>;
  let mockClick: ReturnType<typeof vi.fn>;
  let createObjectURLSpy: ReturnType<typeof vi.spyOn>;
  let revokeObjectURLSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mockShare = vi.fn().mockResolvedValue(undefined);
    mockCanShare = vi.fn().mockReturnValue(true);
    Object.defineProperty(navigator, 'share', { value: mockShare, configurable: true, writable: true });
    Object.defineProperty(navigator, 'canShare', { value: mockCanShare, configurable: true, writable: true });

    createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
    revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    mockClick = vi.fn();
    const realCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'a') {
        return { click: mockClick, href: '', download: '' } as unknown as HTMLAnchorElement;
      }
      return realCreateElement(tag);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('uses navigator.share with the file when the platform supports it', async () => {
    const blob = new Blob(['fake-bytes'], { type: 'image/jpeg' });
    await shareFile(blob, 'daily-image-2026-09-05.jpg', 'Daily Inspiration', 'My Recovery Toolkit');

    expect(mockShare).toHaveBeenCalledTimes(1);
    const arg = mockShare.mock.calls[0][0];
    expect(arg.title).toBe('Daily Inspiration');
    expect(arg.text).toBe('My Recovery Toolkit');
    expect(arg.files).toHaveLength(1);
    expect(arg.files[0].name).toBe('daily-image-2026-09-05.jpg');
    expect(mockClick).not.toHaveBeenCalled();
  });

  it('falls back to a download link when navigator.share is unavailable (desktop browsers)', async () => {
    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true, writable: true });

    const blob = new Blob(['fake-bytes'], { type: 'image/jpeg' });
    await shareFile(blob, 'daily-image-2026-09-05.jpg', 'Daily Inspiration', 'My Recovery Toolkit');

    expect(mockShare).not.toHaveBeenCalled();
    expect(createObjectURLSpy).toHaveBeenCalledWith(blob);
    expect(mockClick).toHaveBeenCalledTimes(1);
    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url');
  });

  it('falls back to a download link when canShare rejects the file type', async () => {
    mockCanShare.mockReturnValue(false);

    const blob = new Blob(['fake-bytes'], { type: 'image/jpeg' });
    await shareFile(blob, 'daily-image-2026-09-05.jpg', 'Daily Inspiration', 'My Recovery Toolkit');

    expect(mockShare).not.toHaveBeenCalled();
    expect(mockClick).toHaveBeenCalledTimes(1);
  });
});
