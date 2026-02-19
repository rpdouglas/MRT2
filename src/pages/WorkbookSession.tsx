/**
 * src/pages/WorkbookSession.tsx
 * UPDATED: Zen Mode (Focus UI), Auto-Save Integration, Typography Plugin.
 * FIXED: Removed unused variables and invalid characters via Python generation.
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEncryption } from '../contexts/EncryptionContext'; 
import { db } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { 
    CheckCircleIcon, 
    ArrowRightIcon,
    SparklesIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';
import { getWorkbook, type WorkbookSection } from '../data/workbooks';
import { getGeminiCoaching } from '../lib/gemini';
import { useAutoSave } from '../hooks/useAutoSave';

export default function WorkbookSession() {
    const { workbookId, sectionId } = useParams();
    const { user } = useAuth();
    const { decrypt } = useEncryption(); 
    const navigate = useNavigate();

    // Content State
    const [section, setSection] = useState<WorkbookSection | null>(null);
    const [loading, setLoading] = useState(true);

    // User Progress State
    const [currentAnswer, setCurrentAnswer] = useState('');
    const [answers, setAnswers] = useState<Record<string, string>>({}); // Cache for loaded answers
    
    // UI State
    const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
    const [aiCoachLoading, setAiCoachLoading] = useState(false);
    const [aiFeedback, setAiFeedback] = useState<string | null>(null);

    // 1. Load Workbook Content & User Progress
    useEffect(() => {
        async function loadData() {
            if (!user || !workbookId || !sectionId || !db) return;

            try {
                // A. Load Static Workbook JSON
                const wb = getWorkbook(workbookId || '');
                if (!wb) {
                    navigate('/workbooks');
                    return;
                }

                const sec = wb.sections.find(s => s.id === sectionId);
                if (!sec) {
                   navigate(`/workbooks/${workbookId}`);
                   return;
                }
                setSection(sec);

                // B. Load User Progress
                const answersRef = collection(db, 'users', user.uid, 'workbook_answers');
                const q = query(answersRef, where('workbookId', '==', workbookId));
                const snapshot = await getDocs(q);
                const loadedAnswers: Record<string, string> = {};

                for (const docSnap of snapshot.docs) {
                    const data = docSnap.data();
                    if (data.answer) {
                        if (data.isEncrypted) {
                            try {
                                loadedAnswers[data.questionId] = await decrypt(data.answer);
                            } catch {
                                loadedAnswers[data.questionId] = "🔒 [Error Decrypting]";
                            }
                        } else {
                            loadedAnswers[data.questionId] = data.answer;
                        }
                    }
                }
                setAnswers(loadedAnswers);
                
                // Initialize current answer based on first question
                if (sec.questions.length > 0) {
                    const firstQ = sec.questions[0];
                    setCurrentAnswer(loadedAnswers[firstQ.id] || '');
                }

            } catch (error) {
                console.error("Error loading session:", error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [user, workbookId, sectionId, navigate, decrypt]);

    // Current Question Helpers
    const currentQuestion = section?.questions[activeQuestionIndex];
    const isIntroSlide = currentQuestion?.type === 'read_only';

    // Update currentAnswer when question changes
    useEffect(() => {
        if (currentQuestion) {
            setCurrentAnswer(answers[currentQuestion.id] || '');
            setAiFeedback(null);
        }
    }, [activeQuestionIndex, currentQuestion, answers]);

    // --- AUTO SAVE HOOK ---
    const { status: saveStatus } = useAutoSave({
        uid: user?.uid || '',
        workbookId: workbookId || '',
        sectionId: sectionId || '',
        questionId: currentQuestion?.id || '',
        value: currentAnswer
    });

    // 2. Handle Answer Input
    const handleAnswerChange = (text: string) => {
        setCurrentAnswer(text);
        // Update local cache immediately for UI responsiveness
        if (currentQuestion) {
            setAnswers(prev => ({ ...prev, [currentQuestion.id]: text }));
        }
    };

    // 3. Navigation
    const handleNext = () => {
        if (!section) return;
        if (activeQuestionIndex < section.questions.length - 1) {
            setActiveQuestionIndex(prev => prev + 1);
        } else {
            navigate(`/workbooks/${workbookId}`);
        }
    };

    const handlePrevious = () => {
        if (activeQuestionIndex > 0) {
            setActiveQuestionIndex(prev => prev - 1);
        }
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

    if (loading || !section || !currentQuestion) return <div className="p-8 text-center text-gray-500">Loading Session...</div>;

    const progressPercent = ((activeQuestionIndex) / section.questions.length) * 100;

    return (
        // ZEN MODE CONTAINER: Fixed full screen, covers AppShell
        <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col overflow-hidden">
            
            {/* TOP BAR */}
            <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100 shadow-sm z-10">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(`/workbooks/${workbookId}`)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors">
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                    <div className="flex flex-col">
                        <h2 className="text-sm font-bold text-gray-900">{section.title}</h2>
                        <span className="text-xs text-gray-400">Question {activeQuestionIndex + 1} of {section.questions.length}</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Auto-Save Indicator */}
                    <div className="flex items-center gap-1.5 text-xs font-medium transition-colors">
                        {saveStatus === 'saving' && <span className="text-blue-500 animate-pulse">Saving...</span>}
                        {saveStatus === 'saved' && <span className="text-green-600 flex items-center gap-1"><CheckCircleIcon className="h-4 w-4" /> Saved</span>}
                        {saveStatus === 'error' && <span className="text-red-500">Save Failed</span>}
                    </div>
                    
                    <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
                    </div>
                </div>
            </div>

            {/* SCROLLABLE CONTENT */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-2xl mx-auto px-6 py-12">
                    
                    {/* QUESTION / CONTENT */}
                    <div className="prose prose-slate prose-lg max-w-none mb-8">
                        {isIntroSlide ? (
                           <div className="text-center py-10">
                               <h1 className="text-3xl font-black text-gray-900 mb-6">{section.title}</h1>
                               <div className="whitespace-pre-wrap text-gray-600 leading-loose">{currentQuestion.text}</div>
                           </div>
                        ) : (
                           <div className="animate-fadeIn">
                               <h3 className="text-xl font-bold text-gray-900 mb-4">{currentQuestion.text}</h3>
                               {currentQuestion.context && (
                                   <blockquote className="not-italic bg-blue-50 border-l-4 border-blue-500 py-2 px-4 text-blue-900 rounded-r-lg text-base">
                                       <SparklesIcon className="h-5 w-5 inline mr-2 text-blue-500" />
                                       {currentQuestion.context}
                                   </blockquote>
                               )}
                           </div>
                        )}
                    </div>

                    {/* INPUT AREA */}
                    {!isIntroSlide && (
                        <div className="animate-slideUp">
                            <textarea 
                                value={currentAnswer}
                                onChange={(e) => handleAnswerChange(e.target.value)}
                                placeholder="Reflect here..."
                                className="w-full min-h-[300px] p-6 rounded-xl border-2 border-gray-100 bg-white text-lg leading-relaxed text-gray-700 focus:border-blue-500 focus:ring-0 shadow-sm resize-none transition-all placeholder:text-gray-300"
                                autoFocus
                            />
                            
                            {/* AI FEEDBACK */}
                            {aiFeedback && (
                                <div className="mt-6 bg-purple-50 p-6 rounded-xl border border-purple-100 animate-fadeIn">
                                    <h4 className="flex items-center gap-2 text-purple-900 font-bold mb-2">
                                        <SparklesIcon className="h-5 w-5" /> Insight
                                    </h4>
                                    <p className="text-purple-800 leading-relaxed">{aiFeedback}</p>
                                </div>
                            )}

                            <div className="mt-4 flex justify-end">
                                <button 
                                    onClick={handleGetCoaching}
                                    disabled={aiCoachLoading || currentAnswer.length < 10}
                                    className="text-xs font-bold text-purple-600 hover:text-purple-800 flex items-center gap-1 disabled:opacity-50"
                                >
                                    {aiCoachLoading ? "Thinking..." : "Get AI Insight"} <SparklesIcon className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </div>

            {/* BOTTOM NAV */}
            <div className="bg-white border-t border-gray-100 p-4 safe-area-bottom z-10">
                <div className="max-w-2xl mx-auto flex justify-between items-center">
                    <button 
                        onClick={handlePrevious} 
                        disabled={activeQuestionIndex === 0}
                        className="px-6 py-3 rounded-xl text-gray-500 font-bold hover:bg-gray-50 disabled:opacity-30 transition-colors"
                    >
                        Back
                    </button>

                    <button 
                        onClick={handleNext}
                        className="flex items-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-black transition-all shadow-lg active:scale-95"
                    >
                        {activeQuestionIndex === section.questions.length - 1 ? 'Finish' : 'Next'} 
                        <ArrowRightIcon className="h-4 w-4" />
                    </button>
                </div>
            </div>

        </div>
    );
}
