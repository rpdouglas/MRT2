// src/components/games/jeopardy/JeopardyBoard.tsx
// PROJ-72 (Recovery Games), Phase 3. Ported from the legacy Recovery
// Jeopardy game, restyled onto MRT's Tailwind system.
import { Fragment } from 'react';
import type { JeopardyCategory, JeopardyQuestion, JeopardyRound } from '../../../lib/games/jeopardy/types';

interface JeopardyBoardProps {
  categories: JeopardyCategory[];
  round: JeopardyRound;
  onSelectQuestion: (category: JeopardyCategory, question: JeopardyQuestion) => void;
  answeredQuestions: string[];
}

export default function JeopardyBoard({ categories, round, onSelectQuestion, answeredQuestions }: JeopardyBoardProps) {
  const dollarValues = round === 'double' ? [400, 800, 1200, 1600, 2000] : [200, 400, 600, 800, 1000];
  const boardCategories = categories.slice(0, 6);

  return (
    <div className="grid grid-cols-6 gap-1.5 sm:gap-2 text-center">
      {boardCategories.map((cat) => (
        <div
          key={cat.name}
          className="bg-indigo-800 text-white p-2 font-extrabold h-24 flex items-center justify-center text-[10px] sm:text-sm uppercase leading-tight rounded-lg"
        >
          {cat.name}
        </div>
      ))}

      {dollarValues.map((value, rowIndex) => (
        <Fragment key={value}>
          {boardCategories.map((cat) => {
            const question = cat.questions[rowIndex];
            if (!question) {
              return <div key={`${cat.name}-${value}`} className="bg-slate-800 h-24 rounded-lg" />;
            }

            const isAnswered = answeredQuestions.includes(question.question);

            return (
              <button
                key={`${cat.name}-${value}`}
                onClick={() => !isAnswered && onSelectQuestion(cat, question)}
                disabled={isAnswered}
                className={`h-24 rounded-lg flex items-center justify-center text-white text-lg sm:text-xl font-bold transition-colors ${
                  isAnswered ? 'bg-slate-700 cursor-default' : 'bg-indigo-600 hover:bg-indigo-500 cursor-pointer'
                }`}
              >
                {isAnswered ? '' : `$${value}`}
              </button>
            );
          })}
        </Fragment>
      ))}
    </div>
  );
}
