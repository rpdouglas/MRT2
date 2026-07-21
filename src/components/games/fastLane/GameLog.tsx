// src/components/games/fastLane/GameLog.tsx
// PROJ-72 (Recovery Games), Phase 4. Ported from the legacy GameLog.jsx —
// deliberately NOT using dangerouslySetInnerHTML like the original (which
// rendered raw HTML for bold markers that were never actually converted from
// markdown, so it had no real effect). turnEngine.ts's log messages are
// plain strings, so this is just a plain, auto-scrolling list.
import { useRef, useEffect } from 'react';

interface GameLogProps {
  log: string[];
}

export default function GameLog({ log }: GameLogProps) {
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [log]);

  return (
    <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4">
      <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">Game Log</h3>
      <div className="flex flex-col gap-1.5 max-h-80 overflow-y-auto text-sm text-slate-600">
        {log.map((entry, index) => (
          <p key={index}>{entry}</p>
        ))}
        <div ref={logEndRef} />
      </div>
    </div>
  );
}
