import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getWorkbook } from '../data/workbooks';
import { getSectionAnswers, saveAnswer, type WorkbookProgress } from '../lib/workbooks';
import { useAuth } from '../contexts/AuthContext';
import { 
  ArrowLeftIcon, 
  ArrowRightIcon, 
  DocumentArrowDownIcon,
  InformationCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export default function WorkbookSession() {
  const { workbookId, sectionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const workbook = getWorkbook(workbookId || '');
  const section = workbook?.sections.find(s => s.id === sectionId);

  // State
  const [answers, setAnswers] = useState<WorkbookProgress>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Print Mode State
  const [isPrintMode, setIsPrintMode] = useState(false);

  useEffect(() => {
    async function init() {
      if (!user || !workbook || !section) return;
      
      const saved = await getSectionAnswers(user.uid, workbook.id, section.id);
      setAnswers(saved);
      
      // --- SMART RESUME LOGIC ---
      // Find the index of the first actual 'input' question in the array
      const firstInputIndex = section.questions.findIndex(q => q.type !== 'read_only');
      
      // Find the index of the first question that hasn't been answered yet
      const firstMissingAnswerIndex = section.questions.findIndex(q => q.type !== 'read_only' && !saved[q.id]);

      // CASE 1: No input questions exist (Read only section) -> Start at 0
      if (firstInputIndex === -1) {
          setCurrentIndex(0);
      }
      // CASE 2: The user hasn't answered the FIRST input question yet -> Start at 0 (Show Intro)
      else if (firstMissingAnswerIndex === firstInputIndex) {
          setCurrentIndex(0);
      }
      // CASE 3: The user has answered some questions -> Resume at the first missing one
      else if (firstMissingAnswerIndex !== -1) {
          setCurrentIndex(firstMissingAnswerIndex);
      }
      // CASE 4: Section is complete -> Start at 0 (Review mode)
      else {
          setCurrentIndex(0);
      }
      
      setLoading(false);
    }
    init();
  }, [user, workbook, section]);

  // Handlers
  const currentQuestion = section?.questions[currentIndex];
  // Default to '' if no answer found
  const currentAnswer = currentQuestion ? (answers[currentQuestion.id] || '') : '';

  const handleTextChange = (val: string) => {
    if (!currentQuestion) return;
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: val }));
  };

  const saveCurrent = async () => {
    if (!user || !workbook || !section || !currentQuestion) return;
    
    // Do not save for read_only slides
    if (currentQuestion.type === 'read_only') return;

    setSaving(true);
    await saveAnswer(user.uid, workbook.id, section.id, currentQuestion.id, currentAnswer);
    setSaving(false);
  };

  const handleNext = async () => {
    await saveCurrent();
    if (section && currentIndex < section.questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Finished section
      navigate(`/workbooks/${workbookId}`);
    }
  };

  const handlePrev = async () => {
    await saveCurrent();
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handlePrint = () => {
    setIsPrintMode(true);
    setTimeout(() => {
      window.print();
    }, 500);
  };

  if (!workbook || !section || loading) return <div className="p-8">Loading session...</div>;

  // --- PRINT MODE VIEW ---
  if (isPrintMode) {
    return (
      <div className="bg-white min-h-screen text-black p-8 max-w-4xl mx-auto print:p-0">
        <div className="flex justify-between items-center mb-8 print:hidden">
          <h2 className="text-xl font-bold text-gray-500">Preview Mode</h2>
          <div className="flex gap-2">
            <button 
                onClick={() => window.print()} 
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
                Print PDF
            </button>
            <button 
                onClick={() => setIsPrintMode(false)} 
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
                Close
            </button>
          </div>
        </div>

        <div className="print:block">
            <h1 className="text-3xl font-bold mb-2">{workbook.title}</h1>
            <h2 className="text-xl text-gray-600 mb-8 border-b pb-4">{section.title}: {section.description}</h2>

            <div className="space-y-8">
                {section.questions.map((q, idx) => {
                    // Include read_only slides as context blocks
                    if (q.type === 'read_only') {
                        return (
                            <div key={q.id} className="break-inside-avoid bg-gray-50 p-6 rounded-lg border border-gray-200">
                                <p className="text-gray-800 whitespace-pre-wrap font-medium">{q.text}</p>
                            </div>
                        );
                    }

                    return (
                        <div key={q.id} className="break-inside-avoid">
                            <p className="font-bold text-lg mb-2">
                                {idx + 1}. {q.text}
                            </p>
                            <div className="bg-gray-50 p-4 rounded border border-gray-100 text-gray-800 whitespace-pre-wrap">
                                {answers[q.id] || "No answer provided."}
                            </div>
                        </div>
                    );
                })}
            </div>
            
            <div className="mt-12 pt-4 border-t text-sm text-gray-400 text-center">
                Generated by My Recovery Toolkit • {new Date().toLocaleDateString()}
            </div>
        </div>
      </div>
    );
  }

  // --- WIZARD MODE VIEW ---
  if (!currentQuestion) return <div>Error</div>;

  return (
    <div className="max-w-2xl mx-auto h-[calc(100vh-80px)] flex flex-col relative">
      
      {/* 1. Top Bar */}
      <div className="flex items-center justify-between mb-4">
         <div className="flex items-center gap-2">
            <button onClick={() => navigate(`/workbooks/${workbookId}`)} className="text-gray-400 hover:text-gray-900">
                <XMarkIcon className="h-6 w-6" />
            </button>
            <div className="text-xs font-bold uppercase tracking-widest text-gray-400">
                {currentQuestion.type === 'read_only' 
                    ? 'Introduction'
                    : `Question ${currentIndex + 1} of ${section.questions.length}`
                }
            </div>
         </div>
         
         <div className="flex items-center gap-3">
            <button onClick={handlePrint} className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm font-medium">
                <DocumentArrowDownIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Export</span>
            </button>
         </div>
      </div>

      {/* 2. Progress Line */}
      <div className="w-full bg-gray-100 h-1 rounded-full mb-8">
        <div 
            className="bg-blue-600 h-1 rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / section.questions.length) * 100}%` }}
        />
      </div>

      {/* 3. The Content Area */}
      <div className="flex-1 overflow-y-auto pb-20">
         
         {/* --- RENDER LOGIC BASED ON TYPE --- */}
         {currentQuestion.type === 'read_only' ? (
             // --- READING SLIDE ---
             <div className="prose prose-lg max-w-none">
                 <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                     <h2 className="text-xl font-bold text-blue-900 mb-4 flex items-center gap-2">
                        <InformationCircleIcon className="h-6 w-6" />
                        Explanation
                     </h2>
                     <div className="text-blue-900 whitespace-pre-wrap leading-relaxed">
                        {currentQuestion.text}
                     </div>
                 </div>
             </div>
         ) : (
             // --- INPUT SLIDE ---
             <div className="space-y-6">
                
                {/* A. Insight/Context (Shown FIRST) */}
                {currentQuestion.context && (
                    <div className="flex gap-3 bg-purple-50 p-5 rounded-xl text-purple-900 border border-purple-100 shadow-sm">
                        <InformationCircleIcon className="h-6 w-6 flex-shrink-0 text-purple-600" />
                        <div className="space-y-1">
                            <span className="text-xs font-bold uppercase tracking-wider text-purple-500">Insight</span>
                            <p className="italic font-medium leading-relaxed">"{currentQuestion.context}"</p>
                        </div>
                    </div>
                )}

                {/* B. Question Text (Shown SECOND - Styled as Focus Card) */}
                <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900 leading-relaxed">
                        {currentQuestion.text}
                    </h2>
                </div>

                {/* C. Input Textarea (Shown THIRD) */}
                <textarea
                    className="w-full min-h-[300px] p-4 text-lg border-2 border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-300 resize-none transition-all"
                    placeholder="Type your answer here..."
                    value={currentAnswer}
                    onChange={(e) => handleTextChange(e.target.value)}
                    autoFocus
                />
             </div>
         )}

      </div>

      {/* 4. Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 lg:static lg:bg-transparent lg:border-0">
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
            <button 
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                    currentIndex === 0 
                    ? 'text-gray-300 cursor-not-allowed' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
             >
                <ArrowLeftIcon className="h-5 w-5" />
                Prev
             </button>

             <div className="text-xs text-gray-400 italic">
                {currentQuestion.type === 'read_only' ? '' : (saving ? 'Saving...' : 'Auto-saved')}
             </div>

             <button 
                onClick={handleNext}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold shadow-md hover:bg-blue-700 transition-transform active:scale-95 flex items-center gap-2"
             >
                {currentIndex === section.questions.length - 1 ? 'Finish' : 'Next'}
                <ArrowRightIcon className="h-5 w-5" />
             </button>
          </div>
      </div>
    </div>
  );
}