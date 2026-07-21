// src/hooks/useShareImage.ts
// PROJ-72 (Recovery Games), Phase 7. Extracted from SobrietyHero.tsx's
// inline `handleShare` — renders a DOM node to a PNG (html-to-image) and
// shares it via the Web Share API, falling back to a direct download when
// navigator.share isn't available. SobrietyHero uses this for milestone
// images; Fast Lane's win screen and Recovery Jeopardy's winner reveal are
// the second and third consumers.
import { useCallback, useState, type RefObject } from 'react';
import { toPng } from 'html-to-image';

export interface ShareImageOptions {
  filename: string;
  title: string;
  text: string;
}

export function useShareImage() {
  const [isSharing, setIsSharing] = useState(false);

  const shareImage = useCallback(async (ref: RefObject<HTMLElement | null>, options: ShareImageOptions) => {
    if (!ref.current) return;
    try {
      setIsSharing(true);

      // Give React time to flush any export-mode layout change, and let
      // cached images finish painting, before the snapshot is taken.
      await new Promise((resolve) => setTimeout(resolve, 250));

      const dataUrl = await toPng(ref.current, { pixelRatio: 2 });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], options.filename, { type: 'image/png' });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({ title: options.title, text: options.text, files: [file] });
      } else {
        const link = document.createElement('a');
        link.download = options.filename;
        link.href = dataUrl;
        link.click();
      }
    } catch (err) {
      console.error('Failed to share image', err);
    } finally {
      setIsSharing(false);
    }
  }, []);

  return { shareImage, isSharing };
}
