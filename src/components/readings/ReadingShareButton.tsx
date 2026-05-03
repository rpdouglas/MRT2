import { useState } from 'react';
import { ShareIcon, CheckIcon } from '@heroicons/react/24/outline';
import type { DailyReading } from '../../lib/db';

interface Props {
  reading: DailyReading;
}

function buildShareText(reading: DailyReading): string {
  const lines: string[] = [
    reading.theme,
    '',
    reading.body,
    '',
    `Reflection: ${reading.reflection}`,
    '',
    reading.affirmation,
  ];
  if (reading.attribution) {
    lines.push('', reading.attribution);
  }
  if (reading.goDeeper) {
    lines.push('', `${reading.goDeeper.label}: ${reading.goDeeper.url}`);
  }
  
  lines.push('', 'www.myrecoverytoolkit.ca');
  
  return lines.join('\n');
}

export default function ReadingShareButton({ reading }: Props) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const text = buildShareText(reading);

    if (navigator.share) {
      try {
        await navigator.share({ text });
        return;
      } catch {
        // User cancelled or share failed — fall through to clipboard
      }
    }

    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-1.5 text-xs font-bold text-sky-600 hover:text-sky-700 transition-colors"
    >
      {copied ? (
        <>
          <CheckIcon className="h-4 w-4 text-emerald-500" />
          <span className="text-emerald-600">Copied</span>
        </>
      ) : (
        <>
          <ShareIcon className="h-4 w-4" />
          <span>Share reading</span>
        </>
      )}
    </button>
  );
}
