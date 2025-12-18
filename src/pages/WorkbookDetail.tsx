import { useEffect, useState, Fragment } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getWorkbook } from '../data/workbooks';
import { getSectionCompletion, getAllWorkbookAnswers } from '../lib/workbooks'; // Updated Import
import { analyzeFullWorkbook, type WorkbookInsight } from '../lib/gemini'; // Updated Import
import { useAuth } from '../contexts/AuthContext';
import { Dialog, Transition } from '@headlessui/react';
import { 
  ChevronRightIcon, 
  CheckCircleIcon, 
  ArrowLeftIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

export default function WorkbookDetail() {
  const { workbookId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const workbook = getWorkbook(workbookId || '');
  
  const [progressMap, setProgressMap] = useState<{[sectionId: string]: number}>({});
  
  // AI State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<WorkbookInsight | null>(null);
  const [showAiModal, setShowAiModal] = useState(false);

  useEffect(() => {
    async function loadProgress() {
      if (!user || !workbook) return;
      
      const newMap: {[key: string]: number} = {};
      
      for (const section of workbook.sections) {
        const pct = await getSectionCompletion(user.uid, workbook.id, section.id, section.questions.length);
        newMap[section.id] = pct;
      }
      
      setProgressMap(newMap);
    }

    loadProgress();
  }, [user, workbook]);

  // --- HANDLER: Holistic Analysis ---
  const handleAiAnalysis = async () => {
    if (!user || !workbook) return;

    setIsAnalyzing(true);
    setShowAiModal(true);
    setAiResult(null); // Reset previous result

    try {
      // 1. Fetch ALL answers from ALL sections
      const fullContent = await getAllWorkbookAnswers(
        user.uid, 
        workbook.id, 
        workbook.sections.map(s => ({ id: s.id, title: s.title }))
      );

      if (!fullContent) {
        setAiResult({
          feedback: "It looks like you haven't started this workbook yet. Complete a few questions first!",
          encouragement: "Every journey begins with a single step."
        });
        setIsAnalyzing(false);
        return;
      }

      // 2. Send to Gemini
      const result = await analyzeFullWorkbook(workbook.title, fullContent);
      setAiResult(result);
      
    } catch (error) {
      console.error("Analysis failed", error);
      setAiResult({
        feedback: "We couldn't generate an analysis at this moment. Please check your connection and try again.",
        encouragement: "Keep going."
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!workbook) return <div>Workbook not found</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/workbooks')} className="text-gray-500 hover:text-gray-900">
             <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{workbook.title}</h1>
        </div>
        
        {/* SPARKLE BUTTON (Moved Here) */}
        <button 
          onClick={handleAiAnalysis}
          className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-md hover:shadow-lg transition-all active:scale-95"
        >
          <SparklesIcon className="h-5 w-5" />
          <span>Analyze Progress</span>
        </button>
      </div>

      <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
        <ul className="divide-y divide-gray-100">
          {workbook.sections.map((section) => {
            const progress = progressMap[section.id] || 0;
            const isComplete = progress === 100;

            return (
              <li key={section.id}>
                <Link 
                  to={`/workbooks/${workbook.id}/session/${section.id}`}
                  className="block hover:bg-gray-50 transition p-4 sm:p-6"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 pr-4">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{section.title}</h3>
                        {isComplete && <CheckCircleIcon className="h-5 w-5 text-green-500" />}
                      </div>
                      <p className="text-sm text-gray-500">{section.description}</p>
                      
                      {/* Progress Bar */}
                      <div className="mt-2 w-full max-w-[200px] bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className={`h-full ${isComplete ? 'bg-green-500' : 'bg-blue-500'}`} 
                          style={{ width: `${progress}%` }} 
                        />
                      </div>
                      <span className="text-xs text-gray-400 mt-1 block">{progress}% Complete</span>
                    </div>
                    
                    <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* --- AI INSIGHT MODAL --- */}
      <Transition appear show={showAiModal} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setShowAiModal(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  
                  <div className="flex items-center gap-2 mb-4">
                    <SparklesIcon className="h-6 w-6 text-purple-500" />
                    <Dialog.Title as="h3" className="text-xl font-bold leading-6 text-gray-900">
                      Holistic Workbook Analysis
                    </Dialog.Title>
                  </div>

                  {isAnalyzing ? (
                    <div className="py-12 text-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500 mx-auto mb-4"></div>
                        <p className="text-gray-500 font-medium">Reviewing your entire journey...</p>
                        <p className="text-xs text-gray-400 mt-2">Connecting dots between sections</p>
                    </div>
                  ) : (
                    aiResult && (
                        <div className="space-y-6">
                            <div className="bg-purple-50 p-5 rounded-xl text-gray-800 leading-relaxed border border-purple-100 text-base">
                                {aiResult.feedback}
                            </div>
                            
                            <div className="text-center">
                                <span className="block text-xs uppercase tracking-widest text-gray-400 mb-1">Encouragement</span>
                                <span className="font-bold text-purple-700 text-lg">"{aiResult.encouragement}"</span>
                            </div>
                        </div>
                    )
                  )}

                  <div className="mt-8">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-lg border border-transparent bg-purple-100 px-4 py-3 text-sm font-semibold text-purple-900 hover:bg-purple-200 focus:outline-none w-full transition-colors"
                      onClick={() => setShowAiModal(false)}
                    >
                      Close Analysis
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

    </div>
  );
}