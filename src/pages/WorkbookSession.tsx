import { useState, useEffect, useMemo, useRef } from 'react';
import posthog from 'posthog-js';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircleIcon, ArrowRightIcon, SparklesIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { getWorkbook, type WorkbookSection } from '../data/workbooks';
import { getGeminiCoaching } from '../lib/gemini';
import { useAutoSave } from '../hooks/useAutoSave';
import { useWorkbookAnswers } from '../hooks/useWorkbookAnswers';

export default function WorkbookSession() {
    const { workbookId, sectionId } = useParams();
    const navigate = useNavigate();

    // Content State
    const [section, setSection] = useState<WorkbookSection | null>(null);

    // User Progress State (loaded via useWorkbookAnswers, overlaid with in-session edits
    // so switching between questions within the autosave debounce window shows the latest keystrokes)
    const [currentAnswer, setCurrentAnswer] = useState('');
    const [localEdits, setLocalEdits] = useState<Record<string, string>>({});

    // UI State
    const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
    const [aiCoachLoading, setAiCoachLoading] = useState(false);
    const [aiFeedback, setAiFeedback] = useState<string | null>(null);

    const { answers: savedAnswers, isLoading, saveAnswer } = useWorkbookAnswers(workbookId);

    const answers = useMemo(() => {
        const record: Record<string, string> = {};
        for (const entry of savedAnswers) record[entry.questionId] = entry.answer;
        return { ...record, ...localEdits };
    }, [savedAnswers, localEdits]);

    const sectionStartedRef = useRef(false);

    // 1. Load Static Workbook Content
    useEffect(() => {
        if (!workbookId || !sectionId) return;

        const wb = getWorkbook(workbookId);
        if (!wb) { navigate('/workbooks'); return; }

        const sec = wb.sections.find(s => s.id === sectionId);
        if (!sec) { navigate(`/workbooks/${workbookId}`); return; }
        setSection(sec);
        if (!sectionStartedRef.current) {
            sectionStartedRef.current = true;
            posthog.capture('workbook_section_started', {
                workbook_id: workbookId,
                section_id: sectionId,
                question_count: sec.questions.length,
            });
        }
    }, [workbookId, sectionId, navigate]);

    // Current Question Helpers
    const currentQuestion = section?.questions[activeQuestionIndex];
    const isIntroSlide = currentQuestion?.type === 'read_only';

    // Update currentAnswer when question changes
    useEffect(() => { if (currentQuestion) { setCurrentAnswer(answers[currentQuestion.id] || ''); setAiFeedback(null); }
    }, [activeQuestionIndex, currentQuestion, answers]);

    // --- AUTO SAVE HOOK ---
    const { status: saveStatus } = useAutoSave({
        sectionId: sectionId || '',
        questionId: currentQuestion?.id || '',
        value: currentAnswer,
        saveAnswer,
    });

    // 2. Handle Answer Input
    const handleAnswerChange = (text: string) => {
        setCurrentAnswer(text);
        // Update local cache immediately for UI responsiveness
        if (currentQuestion) {
            setLocalEdits(prev => ({ ...prev, [currentQuestion.id]: text }));
        }
    };

    // 3. Navigation
    const handleNext = () => {
        if (!section) return;
        if (currentAnswer.trim()) {
            posthog.capture('workbook_answer_saved', {
                workbook_id: workbookId,
                section_id: sectionId,
                question_index: activeQuestionIndex,
            });
        }
        if (activeQuestionIndex < section.questions.length - 1) {
            setActiveQuestionIndex(prev => prev + 1);
        } else {
            navigate(`/workbooks/${workbookId}`);
        }
    };

    const handlePrevious = () => { if (activeQuestionIndex > 0) { setActiveQuestionIndex(prev => prev - 1); }
    };

    const handleGetCoaching = async () => {
        if (!currentQuestion || !currentAnswer || currentAnswer.length < 10) return alert("Write a bit more first.");
        setAiCoachLoading(true);
        try {
            const context = currentQuestion.context || currentQuestion.text; 
            const feedback = await getGeminiCoaching(context, currentAnswer);
            setAiFeedback(feedback);
        } catch {
            alert("Coach unavailable.");
        } finally {
            setAiCoachLoading(false);
        }
    };

    if (isLoading || !section || !currentQuestion) return <div className="p-8 text-center text-gray-500">Loading Session...</div>;

    const progressPercent = ((activeQuestionIndex) / section.questions.length) * 100;

    return (
        // ZEN MODE CONTAINER: Fixed full screen, covers AppShell
        <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col overflow-hidden">
            
            {/* TOP BAR */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 bg-white border-b border-gray-100 shadow-sm z-10 shrink-0">
                <div className="flex items-center gap-3 sm:gap-4">
                    <button onClick={() => navigate(`/workbooks/${workbookId}`)} aria-label="Exit to workbook section list" className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors">
                        <XMarkIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                    </button>
                    <div className="flex flex-col">
                        <h2 className="text-xs sm:text-sm font-bold text-gray-900">{section.title}</h2>
                        <span className="text-[10px] sm:text-xs text-gray-400">Question {activeQuestionIndex + 1} of {section.questions.length}</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Auto-Save Indicator */}
                    <div className="flex items-center gap-1.5 text-xs font-medium transition-colors">
                        {saveStatus === 'saving' && <span className="text-blue-500 animate-pulse">Saving...</span>}
                        {saveStatus === 'saved' && <span className="text-green-600 flex items-center gap-1"><CheckCircleIcon className="h-4 w-4" /> Saved</span>}
                        {saveStatus === 'error' && <span className="text-red-500">Save Failed</span>}
                    </div>
                    
                    <div className="hidden sm:block w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
                    </div>
                </div>
            </div>

            {/* SCROLLABLE CONTENT WITH DYNAMIC FLEXBOX */}
            <div className="flex-1 flex flex-col min-h-0 overflow-y-auto bg-slate-50">
                <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 sm:py-8 w-full flex-1 flex flex-col min-h-0">
                    
                    {/* QUESTION / CONTENT (Shrink-0 protects it from the keyboard) */}
                    <div className="prose prose-slate prose-lg sm:prose-xl max-w-none mb-4 shrink-0">
                        {isIntroSlide ? (
                           <div className="text-center py-6 sm:py-10">
                               <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4 sm:mb-6">{section.title}</h1>
                               <div className="whitespace-pre-wrap text-gray-600 leading-loose mb-8 sm:mb-10 text-left sm:text-center px-2">{currentQuestion.text}</div>
                               <button 
                                   onClick={handleNext}
                                   className="inline-flex items-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-black transition-all shadow-lg active:scale-95"
                               >
                                   Begin <ArrowRightIcon className="h-5 w-5" />
                               </button>
                           </div>
                        ) : (
                           <div className="animate-fadeIn">
                               <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 leading-snug">{currentQuestion.text}</h3>
                               {currentQuestion.context && (
                                   <blockquote className="not-italic bg-blue-50 border-l-4 border-blue-500 py-2 px-4 text-blue-900 rounded-r-lg text-base sm:text-lg">
                                       <SparklesIcon className="h-4 w-4 sm:h-5 sm:w-5 inline mr-2 text-blue-500" />
                                       {currentQuestion.context}
                                   </blockquote>
                               )}
                           </div>
                        )}
                    </div>

                    {/* INPUT AREA WITH STICKY TOOLBAR (Flex-1 Min-H-0 allows dynamic shrinking) */}
                    {!isIntroSlide && (
                        <div className="animate-slideUp flex flex-col relative flex-1 min-h-0">
                            
                            {/* STICKY TOOLBAR (Shrink-0) */}
                            <div className="sticky top-0 z-20 flex justify-between items-center bg-slate-50/95 backdrop-blur-md py-2 sm:py-3 px-2 rounded-t-xl border-b border-gray-200 shadow-sm mb-2 shrink-0">
                                <button 
                                    onClick={handlePrevious} 
                                    disabled={activeQuestionIndex === 0}
                                    className="px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-500 font-bold hover:bg-gray-200 rounded-lg disabled:opacity-30 transition-colors"
                                >
                                    Back
                                </button>

                                <div className="flex items-center gap-2 sm:gap-4">
                                    <button 
                                        onClick={handleGetCoaching}
                                        disabled={aiCoachLoading || currentAnswer.length < 10}
                                        className="text-[10px] sm:text-xs font-bold text-purple-600 hover:text-purple-800 flex items-center gap-1 disabled:opacity-50 px-2 py-1.5 sm:py-2 rounded-lg hover:bg-purple-50 transition-colors"
                                    >
                                        {aiCoachLoading ? "Thinking..." : "AI Insight"} <SparklesIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                                    </button>

                                    <button 
                                        onClick={handleNext}
                                        className="flex items-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-2 text-xs sm:text-sm bg-slate-900 text-white rounded-lg font-bold hover:bg-black transition-all shadow-md active:scale-95"
                                    >
                                        {activeQuestionIndex === section.questions.length - 1 ? 'Finish' : 'Next'} 
                                        <ArrowRightIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                                    </button>
                                </div>
                            </div>

                            {/* AI FEEDBACK (Shrink-0 so it pushes the textarea down, but stays visible) */}
                            {aiFeedback && (
                                <div className="mb-2 bg-purple-50 p-4 sm:p-6 rounded-xl border border-purple-100 animate-fadeIn shrink-0">
                                    <h4 className="flex items-center gap-2 text-purple-900 font-bold mb-2 text-xs sm:text-sm">
                                        <SparklesIcon className="h-4 w-4 sm:h-5 sm:w-5" /> Insight
                                    </h4>
                                    <p className="text-purple-800 leading-relaxed text-xs sm:text-sm">{aiFeedback}</p>
                                </div>
                            )}

                            {/* TEXTAREA (Flex-1 Resize-None lets it fill available space without breaking layout) */}
                            <textarea 
                                value={currentAnswer}
                                onChange={(e) => handleAnswerChange(e.target.value)}
                                placeholder="Reflect here..."
                                className="w-full flex-1 min-h-[150px] p-4 sm:p-6 rounded-b-xl border-2 border-gray-100 bg-white text-lg sm:text-xl leading-relaxed text-gray-700 focus:border-blue-500 focus:ring-0 shadow-sm resize-none transition-all placeholder:text-gray-300"
                                // eslint-disable-next-line jsx-a11y/no-autofocus -- deliberate: the primary (only) input of this guided, one-question-at-a-time writing flow, matching WCAG's modal-focus-management guidance (not autofocus on ordinary page load).
                                autoFocus
                            />
                            
                        </div>
                    )}

                </div>
            </div>

            {/* Mobile Progress Bar (Moved to absolute bottom for mobile) */}
            <div className="sm:hidden w-full h-1 bg-gray-100 shrink-0">
                <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
            </div>

        </div>
    );
}
