import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEncryption } from '../contexts/EncryptionContext'; 
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, Timestamp } from 'firebase/firestore';
import { 
  ChevronLeftIcon, 
  CheckCircleIcon, 
  ArrowRightIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { getWorkbook, type Workbook, type WorkbookSection } from '../data/workbooks';
import { getGeminiCoaching } from '../lib/gemini';

// Type definition for stored answers
type AnswerValue = string | { text: string; isEncrypted: boolean; updatedAt?: Timestamp };

export default function WorkbookSession() {
  const { workbookId, sectionId } = useParams();
  const { user } = useAuth();
  const { encrypt, decrypt } = useEncryption(); 
  const navigate = useNavigate();

  // Content State
  const [workbook, setWorkbook] = useState<Workbook | null>(null);
  const [section, setSection] = useState<WorkbookSection | null>(null);
  const [loading, setLoading] = useState(true);

  // User Progress State
  const [answers, setAnswers] = useState<Record<string, string>>({});
  
  // UI State
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [saving, setSaving] = useState(false);
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
          console.warn(`Workbook not found: ${workbookId}`);
          navigate('/workbooks');
          return;
        }
        setWorkbook(wb);

        const sec = wb.sections.find(s => s.id === sectionId);
        if (!sec) {
           console.warn(`Section not found: ${sectionId}`);
           navigate(`/workbooks/${workbookId}`);
           return;
        }
        setSection(sec);

        // B. Load User Progress from Firestore
        const progressRef = doc(db, 'users', user.uid, 'workbook_progress', workbookId);
        const snap = await getDoc(progressRef);

        if (snap.exists()) {
          const data = snap.data();
          
          // DECRYPTION LOGIC
          const rawAnswers = data.answers || {};
          const decryptedAnswers: Record<string, string> = {};

          for (const [qId, val] of Object.entries(rawAnswers)) {
             const answerVal = val as AnswerValue;
             
             if (typeof answerVal === 'object' && answerVal !== null && 'isEncrypted' in answerVal && answerVal.isEncrypted) {
                 try {
                     decryptedAnswers[qId] = await decrypt(answerVal.text);
                 } catch (e) {
                     console.error(`Failed to decrypt answer for ${qId}`, e);
                     decryptedAnswers[qId] = "🔒 [Error Decrypting Data]";
                 }
             } else if (typeof answerVal === 'object' && answerVal !== null && 'text' in answerVal) {
                 decryptedAnswers[qId] = answerVal.text;
             } else if (typeof answerVal === 'string') {
                 decryptedAnswers[qId] = answerVal;
             }
          }
          setAnswers(decryptedAnswers);
        }

      } catch (error) {
        console.error("Error loading session:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user, workbookId, sectionId, navigate, decrypt]);

  // 2. Handle Answer Input
  const handleAnswerChange = (text: string) => {
    if (!section) return;
    const qId = section.questions[activeQuestionIndex].id;
    setAnswers(prev => ({
      ...prev,
      [qId]: text
    }));
  };

  // 3. Save Answer (with Encryption)
  const saveAnswer = async (qId: string, text: string) => {
    if (!user || !workbookId || !db) return;
    
    try {
        const progressRef = doc(db, 'users', user.uid, 'workbook_progress', workbookId);
        
        // ENCRYPTION LOGIC
        let payloadValue: AnswerValue;
        try {
            const encryptedText = await encrypt(text);
            payloadValue = {
                text: encryptedText,
                isEncrypted: true,
                updatedAt: Timestamp.now()
            };
        } catch (e) {
            console.error("Encryption failed", e);
            alert("Security Error: Could not encrypt answer. Save aborted.");
            return;
        }

        await setDoc(progressRef, {
            answers: {
                [qId]: payloadValue 
            },
            lastActive: Timestamp.now(),
            lastSectionId: sectionId
        }, { merge: true });

    } catch (e) {
        console.error("Failed to save answer:", e);
    }
  };

  // 4. Navigation & Completion
  const handleNext = async () => {
    if (!section || !workbookId || !user || !db) return;
    
    const currentQ = section.questions[activeQuestionIndex];
    const currentAns = answers[currentQ.id];
    
    setSaving(true);
    if (currentAns) {
        await saveAnswer(currentQ.id, currentAns);
    }

    if (activeQuestionIndex < section.questions.length - 1) {
        setActiveQuestionIndex(prev => prev + 1);
        setAiFeedback(null); 
    } else {
        await updateDoc(doc(db, 'users', user.uid, 'workbook_progress', workbookId), {
            completedSections: arrayUnion(sectionId)
        });
        navigate(`/workbooks/${workbookId}`);
    }
    setSaving(false);
  };

  const handlePrevious = () => {
    if (activeQuestionIndex > 0) {
        setActiveQuestionIndex(prev => prev - 1);
        setAiFeedback(null);
    }
  };

  const handleGetCoaching = async () => {
      if (!section) return;
      const q = section.questions[activeQuestionIndex];
      const ans = answers[q.id];
      if (!ans || ans.length < 10) return alert("Please write a bit more before asking for coaching.");

      setAiCoachLoading(true);
      try {
          // FIX: Removed (q as any) cast. 'context' is part of the Question interface.
          const qContext = q.context || q.text; 
          const feedback = await getGeminiCoaching(qContext, ans);
          setAiFeedback(feedback);
      } catch (error) {
          console.error(error);
          alert("Coach is currently unavailable.");
      } finally {
          setAiCoachLoading(false);
      }
  };


  if (loading || !section) return <div className="p-8 text-center text-gray-500">Loading Session...</div>;

  const currentQuestion = section.questions[activeQuestionIndex];
  const progressPercent = ((activeQuestionIndex) / section.questions.length) * 100;

  return (
    <div className="max-w-3xl mx-auto px-4 pb-20">
        
        {/* NAV HEADER */}
        <div className="flex items-center gap-4 py-6">
            <button onClick={() => navigate(`/workbooks/${workbookId}`)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                <ChevronLeftIcon className="h-6 w-6" />
            </button>
            <div className="flex-1">
                <h1 className="text-sm font-bold text-gray-500 uppercase tracking-wider">{workbook?.title}</h1>
                <h2 className="text-xl font-bold text-gray-900">{section.title}</h2>
            </div>
        </div>

        {/* PROGRESS BAR */}
        <div className="w-full bg-gray-100 h-2 rounded-full mb-8">
            <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out" 
                style={{ width: `${progressPercent}%` }}
            />
        </div>

        {/* QUESTION CARD */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden min-h-[60vh] flex flex-col">
            
            <div className="p-6 md:p-8 bg-gray-50 border-b border-gray-100">
                <span className="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold mb-4">
                    Question {activeQuestionIndex + 1} of {section.questions.length}
                </span>
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 leading-relaxed">
                    {currentQuestion.text}
                </h3>
                {/* FIX: Removed (currentQuestion as any) cast */}
                {currentQuestion.context && (
                    <div className="mt-4 p-3 bg-blue-50/50 rounded-lg border border-blue-100 text-sm text-blue-800 italic">
                        <SparklesIcon className="h-4 w-4 inline mr-1 -mt-0.5" />
                        "{currentQuestion.context}"
                    </div>
                )}
            </div>

            <div className="flex-1 p-6 md:p-8 flex flex-col">
                <textarea
                    className="flex-1 w-full p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-lg text-gray-700 leading-relaxed bg-white"
                    placeholder="Type your answer here..."
                    value={answers[currentQuestion.id] || ''}
                    onChange={(e) => handleAnswerChange(e.target.value)}
                />
                
                {/* AI COACHING AREA */}
                {aiFeedback && (
                    <div className="mt-6 bg-purple-50 p-4 rounded-xl border border-purple-100 animate-fadeIn">
                        <div className="flex items-center gap-2 mb-2 text-purple-800 font-bold">
                            <SparklesIcon className="h-5 w-5" />
                            <span>Coach's Insight</span>
                        </div>
                        <div className="prose prose-sm text-purple-900 max-w-none whitespace-pre-wrap leading-relaxed">
                            {aiFeedback}
                        </div>
                    </div>
                )}
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                <button
                    onClick={handlePrevious}
                    disabled={activeQuestionIndex === 0}
                    className="px-6 py-3 rounded-xl text-gray-600 font-medium hover:bg-gray-200 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                >
                    Back
                </button>

                <div className="flex gap-2">
                    <button
                        onClick={handleGetCoaching}
                        disabled={aiCoachLoading || !answers[currentQuestion.id]}
                        className="hidden sm:flex items-center gap-2 px-4 py-3 rounded-xl text-purple-700 bg-purple-100 hover:bg-purple-200 font-medium transition-colors disabled:opacity-50"
                        title="Get AI feedback on your answer"
                    >
                        {aiCoachLoading ? <SparklesIcon className="h-5 w-5 animate-spin" /> : <SparklesIcon className="h-5 w-5" />}
                        <span>AI Coach</span>
                    </button>

                    <button
                        onClick={handleNext}
                        disabled={saving}
                        className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gray-900 text-white font-bold hover:bg-black transition-all shadow-lg hover:shadow-xl active:scale-95"
                    >
                        {saving ? (
                            <span>Saving...</span>
                        ) : activeQuestionIndex === section.questions.length - 1 ? (
                            <>
                                <span>Complete</span>
                                <CheckCircleIcon className="h-5 w-5" />
                            </>
                        ) : (
                            <>
                                <span>Next</span>
                                <ArrowRightIcon className="h-5 w-5" />
                            </>
                        )}
                    </button>
                </div>
            </div>

        </div>
    </div>
  );
}