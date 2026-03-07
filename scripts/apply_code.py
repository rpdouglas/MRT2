import os

# FENCE pattern to protect markdown backticks
FENCE = chr(96) * 3

# Path Resolution Engine to guarantee we hit the project root
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)

# =============================================================================
# 1. src/pages/Workbooks.tsx
# =============================================================================
workbooks_content = r'''import { useState } from 'react';
import { Link } from 'react-router-dom';
import { WORKBOOKS } from '../data/workbooks';
import VibrantHeader from '../components/VibrantHeader';
import { THEME } from '../lib/theme';
import { 
    BookOpenIcon, 
    StarIcon, 
    HeartIcon, 
    AcademicCapIcon,
    ChevronRightIcon,
    DocumentTextIcon
} from '@heroicons/react/24/outline';

export default function Workbooks() {
  const [activeTab, setActiveTab] = useState<'workbooks' | 'literature'>('workbooks');

  const getTheme = (type: string) => {
    switch (type) {
      case 'general': return { color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-l-yellow-500', icon: StarIcon };
      case 'steps': return { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-l-blue-600', icon: BookOpenIcon };
      default: return { color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-l-purple-500', icon: HeartIcon };
    }
  };

  return (
    <div className={`pb-24 relative min-h-screen ${THEME.workbooks.page}`}>
      
      {/* HEADER */}
      <div className="flex-shrink-0 z-10">
          <VibrantHeader 
            title="Recovery Library"
            subtitle="Structured guides to process your journey."
            icon={AcademicCapIcon}
            fromColor={THEME.workbooks.header.from}
            viaColor={THEME.workbooks.header.via}
            toColor={THEME.workbooks.header.to}
          />
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-8 relative z-30 space-y-6 flex flex-col">
        
        {/* TAB NAVIGATION */}
        <div className="flex p-1 space-x-1 bg-emerald-100/50 rounded-xl mb-2 overflow-x-auto shadow-sm border border-emerald-200 backdrop-blur-sm">
          <button
            onClick={() => setActiveTab('workbooks')}
            className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-lg transition-all duration-200 uppercase tracking-wide ${
              activeTab === 'workbooks'
                ? 'bg-white text-emerald-800 shadow-md transform scale-[1.02]'
                : 'text-emerald-700 hover:bg-white/50'
            }`}
          >
            <BookOpenIcon className="w-4 h-4" />
            Workbooks
          </button>
          <button
            onClick={() => setActiveTab('literature')}
            className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-lg transition-all duration-200 uppercase tracking-wide ${
              activeTab === 'literature'
                ? 'bg-white text-emerald-800 shadow-md transform scale-[1.02]'
                : 'text-emerald-700 hover:bg-white/50'
            }`}
          >
            <DocumentTextIcon className="w-4 h-4" />
            Literature
          </button>
        </div>

        {/* WORKBOOKS CONTENT */}
        {activeTab === 'workbooks' && (
            <div className="space-y-4 animate-fadeIn">
              {WORKBOOKS.map((workbook) => {
                  const theme = getTheme(workbook.type);
                  
                  return (
                      <Link 
                          key={workbook.id} 
                          to={`/workbooks/${workbook.id}`}
                          className={`block relative group bg-white rounded-xl p-5 shadow-sm border border-gray-200 transition-all hover:shadow-md ${theme.border} border-l-[6px]`}
                      >
                          <div className="flex items-start gap-4">
                              <div className={`flex-shrink-0 h-10 w-10 rounded-lg flex items-center justify-center ${theme.bg} ${theme.color}`}>
                                  <theme.icon className="h-6 w-6" />
                              </div>
                              <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-1">
                                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                                          {workbook.title}
                                      </h3>
                                      <ChevronRightIcon className="h-5 w-5 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                                  </div>
                                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                      {workbook.description}
                                  </p>
                                  <div className="flex items-center gap-3">
                                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${theme.bg} ${theme.color} border-transparent`}>
                                          {workbook.sections.length} Sections
                                      </span>
                                      {workbook.type === 'steps' && (
                                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                              12-Step Compatible
                                          </span>
                                      )}
                                  </div>
                              </div>
                          </div>
                      </Link>
                  );
              })}
            </div>
        )}

        {/* LITERATURE CONTENT (EMPTY STATE) */}
        {activeTab === 'literature' && (
            <div className="text-center py-16 bg-white/80 backdrop-blur-sm rounded-xl border border-dashed border-emerald-300 shadow-sm animate-fadeIn">
                <div className="bg-emerald-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100">
                    <DocumentTextIcon className="h-8 w-8 text-emerald-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Coming Soon</h3>
                <p className="text-gray-500 text-sm mt-3 max-w-sm mx-auto leading-relaxed">
                    Classic recovery literature, daily meditations, and reference texts are being prepared for your digital library.
                </p>
            </div>
        )}

      </div>
    </div>
  );
}
'''

# =============================================================================
# 2. src/pages/WorkbookSession.tsx
# =============================================================================
session_content = r'''import { useState, useEffect } from 'react';
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
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 bg-white border-b border-gray-100 shadow-sm z-10 shrink-0">
                <div className="flex items-center gap-3 sm:gap-4">
                    <button onClick={() => navigate(`/workbooks/${workbookId}`)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors">
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
                    <div className="prose prose-slate prose-base sm:prose-lg max-w-none mb-4 shrink-0">
                        {isIntroSlide ? (
                           <div className="text-center py-6 sm:py-10">
                               <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mb-4 sm:mb-6">{section.title}</h1>
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
                               <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4 leading-snug">{currentQuestion.text}</h3>
                               {currentQuestion.context && (
                                   <blockquote className="not-italic bg-blue-50 border-l-4 border-blue-500 py-2 px-4 text-blue-900 rounded-r-lg text-sm sm:text-base">
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
                                className="w-full flex-1 min-h-[150px] p-4 sm:p-6 rounded-b-xl border-2 border-gray-100 bg-white text-base sm:text-lg leading-relaxed text-gray-700 focus:border-blue-500 focus:ring-0 shadow-sm resize-none transition-all placeholder:text-gray-300"
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
'''

def write_file(relative_path, content):
    absolute_path = os.path.join(PROJECT_ROOT, relative_path)
    dirname = os.path.dirname(absolute_path)
    
    if dirname: 
        os.makedirs(dirname, exist_ok=True)
        
    # Safely replace FENCE
    final_content = content.replace("__FENCE__", FENCE).strip() + "\n"
    
    with open(absolute_path, "w", encoding="utf-8") as f:
        f.write(final_content)
    print(f"✅ Surgically patched: {absolute_path}")

if __name__ == "__main__":
    print("🚀 Initiating Sector 6 UX Polish...")
    write_file("src/pages/Workbooks.tsx", workbooks_content)
    write_file("src/pages/WorkbookSession.tsx", session_content)
    print("✨ Keyboard Flexbox bug resolved. Library routing established.")