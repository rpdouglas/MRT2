// src/components/games/jeopardy/QuestionModal.tsx
// PROJ-72 (Recovery Games), Phase 3. Ported from the legacy Recovery
// Jeopardy game, restyled onto MRT's Tailwind system. Self-graded
// (honor-system) scoring — same as the legacy design, matches how a
// pass-the-device group game is actually played.
import { useState } from 'react';
import type { JeopardyCategory, JeopardyQuestion, JeopardyRound } from '../../../lib/games/jeopardy/types';

interface QuestionModalProps {
  category: JeopardyCategory;
  question: JeopardyQuestion;
  round: JeopardyRound;
  onAnswer: (wasCorrect: boolean) => void;
  onClose: () => void;
}

export default function QuestionModal({ category, question, round, onAnswer, onClose }: QuestionModalProps) {
  const [userAnswer, setUserAnswer] = useState('');
  const [isRevealed, setIsRevealed] = useState(false);

  const dollarValue = round === 'double' ? question.value * 2 : question.value;

  return (
    <div className="fixed inset-0 bg-slate-900/75 flex items-center justify-center z-50 p-4">
      <div className="relative bg-white p-8 rounded-2xl shadow-2xl ring-1 ring-white/10 w-full max-w-2xl text-center flex flex-col min-h-[300px]">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-2xl leading-none">
          &times;
        </button>

        <h2 className="text-xl font-bold text-indigo-800 uppercase mb-2">{category.name}</h2>
        <p className="text-3xl font-black text-emerald-600 mb-6">${dollarValue}</p>
        <p className="text-2xl font-semibold text-slate-800 flex-grow mb-8">{question.question}</p>

        {!isRevealed ? (
          <>
            <input
              type="text"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="What is...?"
              className="w-full p-3 border border-slate-300 rounded-xl shadow-sm text-center text-lg"
            />
            <button
              onClick={() => setIsRevealed(true)}
              className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-xl shadow-md w-full"
            >
              Reveal Answer
            </button>
          </>
        ) : (
          <div>
            <h3 className="text-xl font-bold mb-3 text-slate-700">Correct Answer:</h3>
            <p className="text-2xl font-bold text-emerald-700 mb-6">{question.answer}</p>
            <p className="text-lg mb-6 text-slate-600">
              Your answer: <span className="font-semibold">{userAnswer.trim() || '(no answer)'}</span>
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => onAnswer(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-xl shadow-md"
              >
                We Were Correct
              </button>
              <button
                onClick={() => onAnswer(false)}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 px-6 rounded-xl shadow-md"
              >
                We Were Incorrect
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
